import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildICS } from "@/lib/ics";
import { SavedRow, rowToEvent } from "@/lib/social";

export const maxDuration = 30;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Personal calendar feed. Apple Calendar subscribes to
 * webcal://<host>/api/calendar/feed?token=<secret> and re-fetches it
 * periodically, so saved events stay in sync automatically.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  if (!UUID_RE.test(token)) {
    return new Response("Invalid token", { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return new Response("Calendar feed not configured", { status: 503 });
  }

  const sb = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: tokenRow } = await sb
    .from("calendar_tokens")
    .select("user_id")
    .eq("token", token)
    .maybeSingle();
  if (!tokenRow) {
    return new Response("Unknown token", { status: 404 });
  }

  const { data: rows, error } = await sb
    .from("saved_events")
    .select("*")
    .eq("user_id", tokenRow.user_id);
  if (error) {
    return new Response("Feed error", { status: 500 });
  }

  const ics = buildICS((rows as SavedRow[]).map(rowToEvent));
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="eventsmeet.ics"',
      "Cache-Control": "private, max-age=300",
    },
  });
}
