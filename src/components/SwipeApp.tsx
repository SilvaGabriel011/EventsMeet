"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CATEGORIES,
  EventCategory,
  EventsResponse,
  PerthEvent,
  TasteProfile,
  WhenFilter,
} from "@/lib/types";
import { DEFAULT_THEME, THEMES, ThemeId, isThemeId } from "@/lib/themes";
import { ChipDef } from "@/lib/chips";
import { getSupabase } from "@/lib/supabase";
import { addSave, removeSaveByTitle, syncSaves } from "@/lib/social";
import { User } from "@supabase/supabase-js";
import SwipeCard, { SwipeDir } from "./SwipeCard";
import SavedPanel from "./SavedPanel";
import FilterBar from "./FilterBar";
import AccountSheet from "./AccountSheet";

const SAVED_KEY = "eventsmeet.saved.v1";
const SEEN_KEY = "eventsmeet.seen.v1";
const THEME_KEY = "eventsmeet.theme.v1";
const TASTE_KEY = "eventsmeet.taste.v1";
const FAV_CHIPS_KEY = "eventsmeet.favchips.v1";
const VISIBLE_CARDS = 3;
const TASTE_CAP = 60;

type Filter = "All" | (typeof CATEGORIES)[number];

interface TasteEntry {
  t: string;
  c: EventCategory;
}

interface TasteStore {
  likes: TasteEntry[];
  skips: TasteEntry[];
}

export default function SwipeApp() {
  const [deck, setDeck] = useState<PerthEvent[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [filter, setFilter] = useState<Filter>("All");
  const [when, setWhen] = useState<WhenFilter>("any");
  const [freeOnly, setFreeOnly] = useState(false);
  const [favChips, setFavChips] = useState<string[]>([]);
  const [saved, setSaved] = useState<PerthEvent[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [themeId, setThemeId] = useState<ThemeId>(DEFAULT_THEME);
  const [forced, setForced] = useState<{ dir: SwipeDir; nonce: number } | null>(null);
  const [history, setHistory] = useState<{ event: PerthEvent; dir: SwipeDir }[]>([]);
  const seenTitles = useRef<string[]>([]);
  const taste = useRef<TasteStore>({ likes: [], skips: [] });
  const savedRef = useRef<PerthEvent[]>([]);
  const sb = getSupabase();

  const t = THEMES[themeId];

  // Track auth state (no-op when Supabase isn't configured).
  useEffect(() => {
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [sb]);

  // On sign-in: push local saves to the server, then adopt the merged list.
  useEffect(() => {
    if (!sb || !user) return;
    syncSaves(sb, user.id, savedRef.current)
      .then(setSaved)
      .catch((err) => console.error("Saved-events sync failed:", err));
  }, [sb, user]);

  // Hydrate persisted state after mount — localStorage isn't available during
  // SSR, and reading it in a useState initializer would cause a hydration
  // mismatch whenever the user has saved events or a non-default theme.
  useEffect(() => {
    try {
      const rawSaved = localStorage.getItem(SAVED_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (rawSaved) setSaved(JSON.parse(rawSaved));
      const rawTheme = localStorage.getItem(THEME_KEY);
      if (isThemeId(rawTheme)) setThemeId(rawTheme);
      const rawSeen = localStorage.getItem(SEEN_KEY);
      if (rawSeen) seenTitles.current = JSON.parse(rawSeen);
      const rawTaste = localStorage.getItem(TASTE_KEY);
      if (rawTaste) taste.current = JSON.parse(rawTaste);
      const rawFavs = localStorage.getItem(FAV_CHIPS_KEY);
      if (rawFavs) setFavChips(JSON.parse(rawFavs));
    } catch {
      // Corrupt storage — start fresh.
    }
  }, []);

  const toggleFavChip = (id: string) => {
    setFavChips((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem(FAV_CHIPS_KEY, JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    savedRef.current = saved;
    localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
  }, [saved]);

  const pickTheme = (id: ThemeId) => {
    setThemeId(id);
    setPickerOpen(false);
    localStorage.setItem(THEME_KEY, id);
  };

  const rememberSeen = (title: string) => {
    seenTitles.current = [...seenTitles.current.filter((x) => x !== title), title].slice(-80);
    localStorage.setItem(SEEN_KEY, JSON.stringify(seenTitles.current));
  };

  const persistTaste = () => {
    taste.current.likes = taste.current.likes.slice(-TASTE_CAP);
    taste.current.skips = taste.current.skips.slice(-TASTE_CAP);
    localStorage.setItem(TASTE_KEY, JSON.stringify(taste.current));
  };

  /** Compact summary of the swipe history for the AI prompt. */
  const tasteProfile = (): TasteProfile | null => {
    const { likes, skips } = taste.current;
    if (likes.length + skips.length < 3) return null;
    const counts = new Map<EventCategory, number>();
    for (const { c } of likes) counts.set(c, (counts.get(c) ?? 0) + 1);
    const topCategories = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([c]) => c);
    return {
      liked: likes.slice(-12).map(({ t: title, c }) => `${title} (${c})`),
      skipped: skips.slice(-12).map(({ t: title, c }) => `${title} (${c})`),
      topCategories,
    };
  };

  const fetchEvents = useCallback(
    async (
      category: Filter,
      whenF: WhenFilter,
      free: boolean,
      opts: { append?: boolean; refresh?: boolean; tasteP?: TasteProfile | null } = {}
    ) => {
      setLoading(true);
      setNote(null);
      try {
        const res = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category,
            when: whenF,
            freeOnly: free,
            taste: opts.tasteP ?? null,
            refresh: opts.refresh ?? false,
            exclude: opts.refresh ? seenTitles.current : [],
          }),
        });
        const data: EventsResponse = await res.json();
        setLive(data.live);
        setNote(data.note ?? null);
        if (opts.append) {
          setDeck((prev) => {
            const titles = new Set(prev.map((e) => e.title));
            return [...prev, ...data.events.filter((e) => !titles.has(e.title))];
          });
        } else {
          setDeck(data.events);
          setIndex(0);
          setHistory([]);
        }
      } catch {
        setNote("Could not reach the events API. Check your connection and try again.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount; setLoading(true) is a no-op on first render
    fetchEvents("All", "any", false);
  }, [fetchEvents]);

  const topEvent = deck[index];
  const deckEmpty = !loading && !topEvent;

  const refetch = (category: Filter, whenF: WhenFilter, free: boolean) =>
    fetchEvents(category, whenF, free, { tasteP: tasteProfile() });

  const handleSwiped = (dir: SwipeDir) => {
    if (!topEvent) return;
    rememberSeen(topEvent.title);
    const entry: TasteEntry = { t: topEvent.title, c: topEvent.category };
    if (dir === 1) {
      taste.current.likes.push(entry);
      setSaved((prev) =>
        prev.some((e) => e.title === topEvent.title) ? prev : [topEvent, ...prev]
      );
      if (sb && user) {
        addSave(sb, user.id, topEvent).catch((err) =>
          console.error("Server save failed:", err)
        );
      }
    } else {
      taste.current.skips.push(entry);
    }
    persistTaste();
    setHistory((prev) => [...prev, { event: topEvent, dir }]);
    setForced(null);
    setIndex((i) => i + 1);
  };

  const swipe = (dir: SwipeDir) => {
    if (!topEvent || loading) return;
    setForced({ dir, nonce: Date.now() });
  };

  const rewind = () => {
    const last = history[history.length - 1];
    if (!last) return;
    setHistory((prev) => prev.slice(0, -1));
    const list = last.dir === 1 ? taste.current.likes : taste.current.skips;
    const idx = list.map((e) => e.t).lastIndexOf(last.event.title);
    if (idx !== -1) list.splice(idx, 1);
    persistTaste();
    if (last.dir === 1) {
      setSaved((prev) => prev.filter((e) => e.title !== last.event.title));
      if (sb && user) {
        removeSaveByTitle(sb, user.id, last.event.title).catch(() => {});
      }
    }
    setIndex((i) => Math.max(0, i - 1));
  };

  /** Applies a carousel chip: activates it, or reverts to the default if it was active. */
  const applyChip = (chip: ChipDef, wasActive: boolean) => {
    if (chip.kind === "cat") {
      const f = wasActive ? "All" : (chip.value as Filter);
      setFilter(f);
      refetch(f, when, freeOnly);
    } else if (chip.kind === "when") {
      const w = wasActive ? "any" : (chip.value as WhenFilter);
      setWhen(w);
      refetch(filter, w, freeOnly);
    } else {
      const v = !freeOnly;
      setFreeOnly(v);
      refetch(filter, when, v);
    }
  };

  return (
    <div className={`min-h-dvh ${t.wrapper}`}>
      <div className="mx-auto flex h-dvh w-full max-w-md flex-col pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(0.75rem,env(safe-area-inset-top))]">
        {/* Header */}
        <header className="flex items-center justify-between py-2">
          <div>
            <h1 className={`text-xl font-black tracking-tight ${t.logoText}`}>
              Events<span className={t.logoAccent}>Meet</span>
            </h1>
            <p className={`text-[11px] font-medium uppercase tracking-widest ${t.tagline}`}>
              Perth · WA {live && <span className={t.taglineLive}>· live AI search</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Theme picker */}
            <div className="relative">
              <button
                onClick={() => setPickerOpen((o) => !o)}
                className={`rounded-full p-2.5 ${t.headerBtn}`}
                aria-label="Change design theme"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="13.5" cy="6.5" r="2.5" />
                  <circle cx="19" cy="13" r="2" />
                  <circle cx="6" cy="12" r="2.5" />
                  <path d="M12 22a10 10 0 1 1 10-10c0 2-1.5 3-3 3h-3a2.5 2.5 0 0 0-2 4c.5.7 0 3-2 3z" />
                </svg>
              </button>
              {pickerOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setPickerOpen(false)} />
                  <div className={`absolute right-0 z-40 mt-2 w-44 overflow-hidden rounded-2xl p-1.5 shadow-xl ${t.pickerBg}`}>
                    {Object.values(THEMES).map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => pickTheme(theme.id)}
                        className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold ${
                          theme.id === themeId ? t.pickerItemActive : t.pickerItem
                        }`}
                      >
                        <span className={`h-4 w-4 shrink-0 rounded-full ${theme.swatch}`} />
                        {theme.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            {/* Account (hidden when Supabase isn't configured) */}
            {sb && (
              <button
                onClick={() => setAccountOpen(true)}
                className={`relative rounded-full p-2.5 ${t.headerBtn}`}
                aria-label="Open account"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
                </svg>
                {user && (
                  <span className={`absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-transparent ${t.badge}`} />
                )}
              </button>
            )}
            {/* Saved events */}
            <button
              onClick={() => setPanelOpen(true)}
              className={`relative rounded-full p-2.5 ${t.headerBtn}`}
              aria-label="Open saved events"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21s-7.5-4.7-10-9.3C.3 8.6 2.2 5 5.6 5c2 0 3.4 1.1 4.4 2.5A5.3 5.3 0 0 1 14.4 5c3.4 0 5.3 3.6 3.6 6.7C15.5 16.3 12 21 12 21z" />
              </svg>
              {saved.length > 0 && (
                <span className={`absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold ${t.badge}`}>
                  {saved.length}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Filters: pinned favorites row + auto-scrolling carousel */}
        <FilterBar
          theme={t}
          filter={filter}
          when={when}
          freeOnly={freeOnly}
          favorites={favChips}
          onApply={applyChip}
          onToggleFav={toggleFavChip}
        />

        {/* Notice banner */}
        {note && (
          <div className={`mb-2 rounded-xl px-3 py-2 text-xs leading-snug ${t.banner}`}>
            {note}
          </div>
        )}

        {/* Card stack — height-capped so cards keep a sane aspect on tall screens */}
        <div className="flex min-h-0 flex-1 flex-col justify-center">
          <div className="relative max-h-[40rem] w-full flex-1">
            {loading && (
              <div className={`absolute inset-0 flex animate-pulse flex-col items-center justify-center gap-3 ${t.cardRadius} ${t.surface}`}>
                <span className="text-5xl">🔎</span>
                <p className={`px-8 text-center text-sm font-medium ${t.surfaceText}`}>
                  AI is scouting Perth for events…
                </p>
              </div>
            )}

            {!loading &&
              deck
                .slice(index, index + VISIBLE_CARDS)
                .map((event, i) => (
                  <SwipeCard
                    key={event.id}
                    event={event}
                    theme={t}
                    depth={i}
                    forced={i === 0 ? forced : null}
                    onSwiped={handleSwiped}
                  />
                ))
                .reverse()}

            {deckEmpty && (
              <div className={`absolute inset-0 flex flex-col items-center justify-center gap-4 ${t.cardRadius} ${t.surface}`}>
                <span className="text-5xl">🎉</span>
                <p className={`px-8 text-center text-sm font-medium ${t.surfaceText}`}>
                  You&apos;ve seen everything for now.
                </p>
                <button
                  onClick={() =>
                    fetchEvents(filter, when, freeOnly, {
                      append: true,
                      refresh: true,
                      tasteP: tasteProfile(),
                    })
                  }
                  className={`rounded-full px-5 py-2.5 text-sm font-bold ${t.primaryBtn}`}
                >
                  Find more events
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-5 py-4">
          <button
            onClick={rewind}
            disabled={history.length === 0}
            aria-label="Undo last swipe"
            className={`rounded-full p-3.5 transition disabled:opacity-30 ${t.undoBtn}`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7v6h6" />
              <path d="M21 17a9 9 0 0 0-15-6.7L3 13" />
            </svg>
          </button>
          <button
            onClick={() => swipe(-1)}
            aria-label="Skip event"
            className={`rounded-full p-5 shadow-lg transition hover:scale-105 ${t.nopeBtn}`}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
          <button
            onClick={() => swipe(1)}
            aria-label="Save event"
            className={`rounded-full p-5 shadow-lg transition hover:scale-105 ${t.likeBtn}`}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21s-7.5-4.7-10-9.3C.3 8.6 2.2 5 5.6 5c2 0 3.4 1.1 4.4 2.5A5.3 5.3 0 0 1 14.4 5c3.4 0 5.3 3.6 3.6 6.7C15.5 16.3 12 21 12 21z" />
              </svg>
          </button>
        </div>

        <SavedPanel
          open={panelOpen}
          saved={saved}
          theme={t}
          user={user}
          onClose={() => setPanelOpen(false)}
          onRemove={(id) => {
            const event = saved.find((e) => e.id === id);
            setSaved((prev) => prev.filter((e) => e.id !== id));
            if (event && sb && user) {
              removeSaveByTitle(sb, user.id, event.title).catch(() => {});
            }
          }}
        />
        <AccountSheet
          open={accountOpen}
          user={user}
          theme={t}
          onClose={() => setAccountOpen(false)}
        />
      </div>
    </div>
  );
}
