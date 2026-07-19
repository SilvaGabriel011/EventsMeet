import { NextRequest, NextResponse } from "next/server";
import {
  CATEGORIES,
  EventsResponse,
  PerthEvent,
  EventCategory,
  WhenFilter,
  PriceFilter,
  TasteProfile,
} from "@/lib/types";
import { SAMPLE_EVENTS } from "@/lib/sample-events";

export const maxDuration = 60;

const OPENAI_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-5.6-luna";
const CACHE_TTL_MS = 30 * 60 * 1000;
const OG_FETCH_TIMEOUT_MS = 4500;

interface CacheEntry {
  events: PerthEvent[];
  ts: number;
}

// Best-effort in-memory cache (per server instance) to avoid re-querying
// OpenAI for the same search within the TTL.
const cache = new Map<string, CacheEntry>();

const WHEN_PROMPTS: Record<Exclude<WhenFilter, "custom">, string> = {
  any: "happening in the next 30 days",
  today: "happening TODAY only",
  weekend: "happening this coming weekend (Friday evening through Sunday)",
  week: "happening in the next 7 days",
};

function perthDate(isoDay: string): string {
  return new Date(`${isoDay}T00:00:00+08:00`).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Australia/Perth",
  });
}

function buildPrompt(
  category: string | null,
  when: WhenFilter,
  dateFrom: string | null,
  dateTo: string | null,
  price: PriceFilter,
  taste: TasteProfile | null,
  exclude: string[]
): string {
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

  const whenText =
    when === "custom" && dateFrom && dateTo
      ? `happening between ${perthDate(dateFrom)} and ${perthDate(dateTo)} (inclusive)`
      : WHEN_PROMPTS[when === "custom" ? "any" : when];

  const freeLine =
    price === "free"
      ? "ONLY include events that are free to attend."
      : typeof price === "number"
        ? `Only include events that are free or cost at most $${price} AUD per ticket.`
        : "";

  const tasteLine = taste
    ? `User taste profile from their swipe history — previously liked: ${taste.liked.join("; ")}.${
        taste.skipped.length ? ` Skipped (not interested): ${taste.skipped.join("; ")}.` : ""
      }${
        taste.topCategories.length
          ? ` Their favourite categories are ${taste.topCategories.join(", ")}.`
          : ""
      } Prioritise events matching their taste while still keeping some variety, and avoid events very similar to the skipped ones.`
    : "";

  const excludeLine = exclude.length
    ? `Do NOT include these events the user has already seen: ${exclude
        .slice(0, 60)
        .join("; ")}.`
    : "";

  return `You are an event scout for Perth, Western Australia. Today is ${today} (Perth time).

Search the web for REAL upcoming events in Perth and surrounding areas (Fremantle, Northbridge, Scarborough, Swan Valley, etc.) ${whenText}. ${categoryLine} ${freeLine} ${tasteLine} ${excludeLine}

Return ONLY a JSON array (no markdown, no commentary) of 8 to 12 events. Each element must have exactly these fields:
- "title": event name
- "category": one of ${CATEGORIES.map((c) => `"${c}"`).join(", ")}
- "date": human-friendly date/time, e.g. "Sat 26 Jul, 7pm"
- "start": exact start date-time in ISO 8601 with the Perth timezone offset, e.g. "2026-07-26T19:00:00+08:00" — or null if the exact date/time cannot be determined
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

    const startRaw = str(e.start);
    const startISO =
      startRaw && !isNaN(Date.parse(startRaw))
        ? new Date(startRaw).toISOString()
        : null;

    events.push({
      id: `live-${Date.now()}-${i}`,
      title,
      category,
      date: str(e.date) || "Date TBA",
      start: startISO,
      venue: str(e.venue) || "Perth, WA",
      price: str(e.price) || "See event page",
      description: str(e.description) || "Found by AI web search.",
      url,
      emoji: str(e.emoji) || "🎉",
      image: null,
    });
  }
  return events;
}

/** Pulls og:image / twitter:image from an event page. Best-effort — any failure → null. */
async function fetchOgImage(pageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(pageUrl, {
      signal: AbortSignal.timeout(OG_FETCH_TIMEOUT_MS),
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html")) {
      return null;
    }
    const html = (await res.text()).slice(0, 400_000);
    const match =
      html.match(
        /<meta[^>]+(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image)["'][^>]*content=["']([^"']+)["']/i
      ) ??
      html.match(
        /<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image)["']/i
      );
    if (!match) return null;

    let img = match[1].trim().replace(/&amp;/g, "&");
    if (img.startsWith("//")) img = "https:" + img;
    else if (img.startsWith("/")) img = new URL(pageUrl).origin + img;
    return img.startsWith("http") ? img : null;
  } catch {
    return null;
  }
}

async function enrichWithImages(events: PerthEvent[]): Promise<PerthEvent[]> {
  return Promise.all(
    events.map(async (e) => ({ ...e, image: await fetchOgImage(e.url) }))
  );
}

async function fetchLiveEvents(
  apiKey: string,
  category: string | null,
  when: WhenFilter,
  dateFrom: string | null,
  dateTo: string | null,
  price: PriceFilter,
  taste: TasteProfile | null,
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
      input: buildPrompt(category, when, dateFrom, dateTo, price, taste, exclude),
    }),
    signal: AbortSignal.timeout(45_000),
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
  return enrichWithImages(events);
}

/** Applies the when/price filters to the built-in sample events (Perth time). */
function filterSamples(
  when: WhenFilter,
  dateFrom: string | null,
  dateTo: string | null,
  price: PriceFilter,
  category: string | null
): PerthEvent[] {
  const now = Date.now();
  const perthDay = (ms: number) => Math.floor((ms + 8 * 3600_000) / 86_400_000);
  const withinDays = (startISO: string | null, days: number) => {
    if (!startISO) return false;
    const start = Date.parse(startISO);
    return start >= now - 3600_000 && perthDay(start) <= perthDay(now) + days;
  };
  const isFree = (p: string) => p.toLowerCase().includes("free");
  const priceNum = (p: string): number | null => {
    const m = p.match(/(\d+(?:\.\d+)?)/);
    return m ? parseFloat(m[1]) : null;
  };

  return SAMPLE_EVENTS.filter((e) => {
    if (category && category !== "All" && e.category !== category) return false;
    if (price === "free" && !isFree(e.price)) return false;
    if (typeof price === "number") {
      const n = priceNum(e.price);
      if (!isFree(e.price) && (n === null || n > price)) return false;
    }
    if (when === "today") return withinDays(e.start, 0);
    if (when === "weekend") {
      if (!withinDays(e.start, 7) || !e.start) return false;
      const dow = new Date(Date.parse(e.start) + 8 * 3600_000).getUTCDay();
      return dow === 5 || dow === 6 || dow === 0;
    }
    if (when === "week") return withinDays(e.start, 7);
    if (when === "custom" && dateFrom && dateTo) {
      if (!e.start) return false;
      const start = Date.parse(e.start);
      return (
        start >= Date.parse(`${dateFrom}T00:00:00+08:00`) &&
        start <= Date.parse(`${dateTo}T23:59:59+08:00`)
      );
    }
    return true;
  });
}

function parseTaste(v: unknown): TasteProfile | null {
  if (typeof v !== "object" || v === null) return null;
  const o = v as Record<string, unknown>;
  const strs = (a: unknown, max: number): string[] =>
    Array.isArray(a)
      ? a.filter((x): x is string => typeof x === "string").slice(0, max)
      : [];
  const taste: TasteProfile = {
    liked: strs(o.liked, 12),
    skipped: strs(o.skipped, 12),
    topCategories: strs(o.topCategories, 3),
  };
  return taste.liked.length || taste.skipped.length ? taste : null;
}

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(req: NextRequest) {
  let category: string | null = null;
  let when: WhenFilter = "any";
  let dateFrom: string | null = null;
  let dateTo: string | null = null;
  let price: PriceFilter = "any";
  let taste: TasteProfile | null = null;
  let exclude: string[] = [];
  let refresh = false;

  try {
    const body = await req.json();
    if (typeof body.category === "string") category = body.category;
    if (["any", "today", "weekend", "week", "custom"].includes(body.when)) when = body.when;
    if (typeof body.dateFrom === "string" && DAY_RE.test(body.dateFrom)) dateFrom = body.dateFrom;
    if (typeof body.dateTo === "string" && DAY_RE.test(body.dateTo)) dateTo = body.dateTo;
    if (body.price === "free") price = "free";
    else if (typeof body.price === "number" && body.price > 0 && body.price <= 10_000) {
      price = Math.round(body.price);
    }
    taste = parseTaste(body.taste);
    if (Array.isArray(body.exclude)) {
      exclude = body.exclude.filter((x: unknown) => typeof x === "string");
    }
    refresh = body.refresh === true;
  } catch {
    // Empty body is fine — defaults apply.
  }

  // A custom range needs both valid, ordered dates.
  if (when === "custom" && (!dateFrom || !dateTo || dateFrom > dateTo)) {
    when = "any";
    dateFrom = null;
    dateTo = null;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const events = filterSamples(when, dateFrom, dateTo, price, category);
    return NextResponse.json<EventsResponse>({
      events,
      live: false,
      note:
        events.length === 0
          ? "No sample events match these filters. Add your OPENAI_API_KEY to .env.local for live AI-searched events."
          : "No OPENAI_API_KEY set — showing sample events. Add your key to .env.local for live AI-searched events.",
    });
  }

  // Taste titles change on every swipe; keying on top categories keeps the
  // cache useful while still serving broadly personalized results.
  const cacheKey = [
    category ?? "All",
    when,
    dateFrom ?? "",
    dateTo ?? "",
    price,
    taste?.topCategories.slice().sort().join(",") ?? "",
  ].join("|");
  const cached = cache.get(cacheKey);
  const cacheable = !refresh && exclude.length === 0;
  if (cacheable && cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return NextResponse.json<EventsResponse>({ events: cached.events, live: true });
  }

  try {
    const events = await fetchLiveEvents(
      apiKey,
      category,
      when,
      dateFrom,
      dateTo,
      price,
      taste,
      exclude
    );
    if (exclude.length === 0) {
      cache.set(cacheKey, { events, ts: Date.now() });
    }
    return NextResponse.json<EventsResponse>({ events, live: true });
  } catch (err) {
    console.error("Live event search failed:", err);
    const events = filterSamples(when, dateFrom, dateTo, price, category);
    return NextResponse.json<EventsResponse>({
      events,
      live: false,
      note: `AI search failed (${err instanceof Error ? err.message : "unknown error"}). Showing sample events.`,
    });
  }
}
