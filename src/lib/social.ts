import { SupabaseClient } from "@supabase/supabase-js";
import { EventCategory, PerthEvent } from "./types";

/** Normalized identity for an event, so two users who saved the same event match. */
export function eventKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface SavedRow {
  id: string;
  user_id: string;
  event_key: string;
  title: string;
  category: string;
  date_text: string;
  start_at: string | null;
  venue: string;
  price: string;
  description: string;
  url: string;
  emoji: string;
  image: string | null;
}

export function rowToEvent(row: SavedRow): PerthEvent {
  return {
    id: `sb-${row.id}`,
    title: row.title,
    category: row.category as EventCategory,
    date: row.date_text,
    start: row.start_at,
    venue: row.venue,
    price: row.price,
    description: row.description,
    url: row.url,
    emoji: row.emoji,
    image: row.image,
  };
}

function eventToRow(userId: string, e: PerthEvent) {
  return {
    user_id: userId,
    event_key: eventKey(e.title),
    title: e.title,
    category: e.category,
    date_text: e.date,
    start_at: e.start,
    venue: e.venue,
    price: e.price,
    description: e.description,
    url: e.url,
    emoji: e.emoji,
    image: e.image,
  };
}

/** Pushes local saves to the server, then returns the merged server list. */
export async function syncSaves(
  sb: SupabaseClient,
  userId: string,
  local: PerthEvent[]
): Promise<PerthEvent[]> {
  if (local.length > 0) {
    await sb
      .from("saved_events")
      .upsert(local.map((e) => eventToRow(userId, e)), {
        onConflict: "user_id,event_key",
        ignoreDuplicates: true,
      });
  }
  const { data, error } = await sb
    .from("saved_events")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as SavedRow[]).map(rowToEvent);
}

export async function addSave(sb: SupabaseClient, userId: string, e: PerthEvent) {
  await sb.from("saved_events").upsert(eventToRow(userId, e), {
    onConflict: "user_id,event_key",
    ignoreDuplicates: true,
  });
}

export async function removeSaveByTitle(sb: SupabaseClient, userId: string, title: string) {
  await sb
    .from("saved_events")
    .delete()
    .eq("user_id", userId)
    .eq("event_key", eventKey(title));
}

export interface CoGoer {
  userId: string;
  name: string;
}

/** For each of my saved event keys: the other users who saved it too. */
export async function fetchCoGoers(
  sb: SupabaseClient,
  myId: string,
  keys: string[]
): Promise<Map<string, CoGoer[]>> {
  const map = new Map<string, CoGoer[]>();
  if (keys.length === 0) return map;

  const { data: rows, error } = await sb
    .from("saved_events")
    .select("event_key,user_id")
    .in("event_key", keys)
    .neq("user_id", myId);
  if (error) throw error;

  const userIds = [...new Set((rows as { user_id: string }[]).map((r) => r.user_id))];
  if (userIds.length === 0) return map;

  const { data: profiles } = await sb
    .from("profiles")
    .select("id,display_name")
    .in("id", userIds);
  const names = new Map(
    ((profiles ?? []) as { id: string; display_name: string }[]).map((p) => [
      p.id,
      p.display_name || "Someone",
    ])
  );

  for (const r of rows as { event_key: string; user_id: string }[]) {
    const list = map.get(r.event_key) ?? [];
    list.push({ userId: r.user_id, name: names.get(r.user_id) ?? "Someone" });
    map.set(r.event_key, list);
  }
  return map;
}

export interface WaveSets {
  /** `${event_key}:${otherUserId}` pairs. */
  sent: Set<string>;
  received: Set<string>;
}

export const wavePair = (key: string, otherUserId: string) => `${key}:${otherUserId}`;

export async function fetchMyWaves(sb: SupabaseClient, myId: string): Promise<WaveSets> {
  const { data, error } = await sb
    .from("waves")
    .select("event_key,from_user,to_user")
    .or(`from_user.eq.${myId},to_user.eq.${myId}`);
  if (error) throw error;
  const sent = new Set<string>();
  const received = new Set<string>();
  for (const w of data as { event_key: string; from_user: string; to_user: string }[]) {
    if (w.from_user === myId) sent.add(wavePair(w.event_key, w.to_user));
    else received.add(wavePair(w.event_key, w.from_user));
  }
  return { sent, received };
}

export async function sendWave(
  sb: SupabaseClient,
  myId: string,
  key: string,
  toUser: string
) {
  await sb
    .from("waves")
    .upsert(
      { event_key: key, from_user: myId, to_user: toUser },
      { onConflict: "event_key,from_user,to_user", ignoreDuplicates: true }
    );
}

/** Readable only for yourself or users you matched with (RLS). */
export async function fetchContact(sb: SupabaseClient, userId: string): Promise<string | null> {
  const { data } = await sb
    .from("contacts")
    .select("contact")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.contact || null;
}

export interface MyProfile {
  displayName: string;
  contact: string;
}

export async function fetchMyProfile(sb: SupabaseClient, myId: string): Promise<MyProfile> {
  const [{ data: p }, { data: c }] = await Promise.all([
    sb.from("profiles").select("display_name").eq("id", myId).maybeSingle(),
    sb.from("contacts").select("contact").eq("user_id", myId).maybeSingle(),
  ]);
  return { displayName: p?.display_name ?? "", contact: c?.contact ?? "" };
}

export async function saveMyProfile(
  sb: SupabaseClient,
  myId: string,
  profile: MyProfile
): Promise<void> {
  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    sb.from("profiles").upsert({ id: myId, display_name: profile.displayName.trim() }),
    sb.from("contacts").upsert({ user_id: myId, contact: profile.contact.trim() }),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
}

/** Returns the user's stable webcal feed token, creating one on first use. */
export async function getCalendarToken(sb: SupabaseClient, myId: string): Promise<string> {
  const { data } = await sb
    .from("calendar_tokens")
    .select("token")
    .eq("user_id", myId)
    .maybeSingle();
  if (data?.token) return data.token as string;
  const { data: created, error } = await sb
    .from("calendar_tokens")
    .upsert({ user_id: myId }, { onConflict: "user_id", ignoreDuplicates: true })
    .select("token")
    .maybeSingle();
  if (created?.token) return created.token as string;
  // Upsert with ignoreDuplicates returns no row when it already existed — re-read.
  const { data: again, error: e2 } = await sb
    .from("calendar_tokens")
    .select("token")
    .eq("user_id", myId)
    .single();
  if (e2 || error) throw e2 ?? error;
  return again.token as string;
}
