import { NextRequest, NextResponse } from "next/server";
import { CATEGORIES, EventsResponse, PerthEvent, EventCategory } from "@/lib/types";
import { SAMPLE_EVENTS } from "@/lib/sample-events";

export const maxDuration = 60;

const OPENAI_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-4.1-mini";
const CACHE_TTL_MS = 30 * 60 * 1000;

interface CacheEntry {
  events: PerthEvent[];
  ts: number;
}

// Best-effort in-memory cache (per server instance) to avoid re-querying
// OpenAI for the same category within the TTL.
const cache = new Map<string, CacheEntry>();

function buildPrompt(category: string | null, exclude: string[]): string {
  const today = new Date().toLocaleDateString("en-AU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Australia/Perth",
  });

  const categoryLine =
    category && category !== "All"
      ? `Focus on the "${category}" category.`
      : `Cover a diverse mix of categories.`;

  const excludeLine = exclude.length
    ? `Do NOT include these events the user has already seen: ${exclude
        .slice(0, 60)
        .join("; ")}.`
    : "";

  return `You are an event scout for Perth, Western Australia. Today is ${today} (Perth time).

Search the web for REAL upcoming events in Perth and surrounding areas (Fremantle, Northbridge, Scarborough, Swan Valley, etc.) happening in the next 30 days. ${categoryLine} ${excludeLine}

Return ONLY a JSON array (no markdown, no commentary) of 8 to 12 events. Each element must have exactly these string fields:
- "title": event name
- "category": one of ${CATEGORIES.map((c) => `"${c}"`).join(", ")}
- "date": human-friendly date/time, e.g. "Sat 26 Jul, 7pm"
- "venue": venue name and suburb
- "price": e.g. "Free", "From $30"
- "description": 1–2 punchy sentences selling the event
- "url": link to the official event page or ticket page found in your search
- "emoji": a single emoji that captures the event

Only include events you actually found via web search, with real URLs. Prefer a variety of venues and dates.`;
}

interface OpenAIOutputItem {
  type?: string;
  content?: Array<{ type?: string; text?: string }>;
}

function extractText(data: { output?: OpenAIOutputItem[]; output_text?: string }): string {
  if (typeof data.output_text === "string" && data.output_text.length > 0) {
    return data.output_text;
  }
  for (const item of data.output ?? []) {
    if (item.type === "message") {
      for (const part of item.content ?? []) {
        if (part.type === "output_text" && part.text) return part.text;
      }
    }
  }
  return "";
}

function parseEvents(text: string): PerthEvent[] {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) return [];

  let raw: unknown;
  try {
    raw = JSON.parse(text.slice(start, end + 1));
  } catch {
    return [];
  }
  if (!Array.isArray(raw)) return [];

  const events: PerthEvent[] = [];
  for (const [i, item] of raw.entries()) {
    if (typeof item !== "object" || item === null) continue;
    const e = item as Record<string, unknown>;
    const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
    const title = str(e.title);
    const url = str(e.url);
    if (!title || !url.startsWith("http")) continue;

    const category = CATEGORIES.includes(str(e.category) as EventCategory)
      ? (str(e.category) as EventCategory)
      : "Arts & Culture";

    events.push({
      id: `live-${Date.now()}-${i}`,
      title,
      category,
      date: str(e.date) || "Date TBA",
      venue: str(e.venue) || "Perth, WA",
      price: str(e.price) || "See event page",
      description: str(e.description) || "Found by AI web search.",
      url,
      emoji: str(e.emoji) || "🎉",
    });
  }
  return events;
}

async function fetchLiveEvents(
  apiKey: string,
  category: string | null,
  exclude: string[]
): Promise<PerthEvent[]> {
  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
      tools: [{ type: "web_search" }],
      input: buildPrompt(category, exclude),
    }),
    signal: AbortSignal.timeout(55_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OpenAI API error ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const events = parseEvents(extractText(data));
  if (events.length === 0) {
    throw new Error("OpenAI returned no parseable events");
  }
  return events;
}

export async function POST(req: NextRequest) {
  let category: string | null = null;
  let exclude: string[] = [];
  let refresh = false;

  try {
    const body = await req.json();
    if (typeof body.category === "string") category = body.category;
    if (Array.isArray(body.exclude)) {
      exclude = body.exclude.filter((t: unknown) => typeof t === "string");
    }
    refresh = body.refresh === true;
  } catch {
    // Empty body is fine — defaults apply.
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const events =
      category && category !== "All"
        ? SAMPLE_EVENTS.filter((e) => e.category === category)
        : SAMPLE_EVENTS;
    return NextResponse.json<EventsResponse>({
      events: events.length ? events : SAMPLE_EVENTS,
      live: false,
      note: "No OPENAI_API_KEY set — showing sample events. Add your key to .env.local for live AI-searched events.",
    });
  }

  const cacheKey = category ?? "All";
  const cached = cache.get(cacheKey);
  const cacheable = !refresh && exclude.length === 0;
  if (cacheable && cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return NextResponse.json<EventsResponse>({ events: cached.events, live: true });
  }

  try {
    const events = await fetchLiveEvents(apiKey, category, exclude);
    if (exclude.length === 0) {
      cache.set(cacheKey, { events, ts: Date.now() });
    }
    return NextResponse.json<EventsResponse>({ events, live: true });
  } catch (err) {
    console.error("Live event search failed:", err);
    return NextResponse.json<EventsResponse>({
      events: SAMPLE_EVENTS,
      live: false,
      note: `AI search failed (${err instanceof Error ? err.message : "unknown error"}). Showing sample events.`,
    });
  }
}
