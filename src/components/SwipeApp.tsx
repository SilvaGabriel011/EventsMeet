"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CATEGORIES,
  EventCategory,
  EventsResponse,
  PerthEvent,
  TasteProfile,
  WHEN_OPTIONS,
  WhenFilter,
} from "@/lib/types";
import { DEFAULT_THEME, THEMES, ThemeId, isThemeId } from "@/lib/themes";
import SwipeCard, { SwipeDir } from "./SwipeCard";
import SavedPanel from "./SavedPanel";

const SAVED_KEY = "eventsmeet.saved.v1";
const SEEN_KEY = "eventsmeet.seen.v1";
const THEME_KEY = "eventsmeet.theme.v1";
const TASTE_KEY = "eventsmeet.taste.v1";
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
  const [saved, setSaved] = useState<PerthEvent[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [themeId, setThemeId] = useState<ThemeId>(DEFAULT_THEME);
  const [forced, setForced] = useState<{ dir: SwipeDir; nonce: number } | null>(null);
  const [history, setHistory] = useState<{ event: PerthEvent; dir: SwipeDir }[]>([]);
  const seenTitles = useRef<string[]>([]);
  const taste = useRef<TasteStore>({ likes: [], skips: [] });

  const t = THEMES[themeId];

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
    } catch {
      // Corrupt storage — start fresh.
    }
  }, []);

  useEffect(() => {
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
    }
    setIndex((i) => Math.max(0, i - 1));
  };

  const changeFilter = (f: Filter) => {
    if (f === filter && !deckEmpty) return;
    setFilter(f);
    refetch(f, when, freeOnly);
  };

  const changeWhen = (w: WhenFilter) => {
    if (w === when && !deckEmpty) return;
    setWhen(w);
    refetch(filter, w, freeOnly);
  };

  const toggleFree = () => {
    const v = !freeOnly;
    setFreeOnly(v);
    refetch(filter, when, v);
  };

  return (
    <div className={`min-h-dvh ${t.wrapper}`}>
      <div className="mx-auto flex h-dvh w-full max-w-md flex-col px-4 pb-4 pt-3">
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

        {/* Category chips */}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pt-2 [scrollbar-width:none]">
          {(["All", ...CATEGORIES] as Filter[]).map((c) => (
            <button
              key={c}
              onClick={() => changeFilter(c)}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                filter === c ? t.chipActive : t.chipIdle
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* When / price chips */}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 py-2 [scrollbar-width:none]">
          {WHEN_OPTIONS.map((w) => (
            <button
              key={w.id}
              onClick={() => changeWhen(w.id)}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                when === w.id ? t.chipActive : t.chipIdle
              }`}
            >
              {w.label}
            </button>
          ))}
          <button
            onClick={toggleFree}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              freeOnly ? t.chipActive : t.chipIdle
            }`}
          >
            🤑 Free only
          </button>
        </div>

        {/* Notice banner */}
        {note && (
          <div className={`mb-2 rounded-xl px-3 py-2 text-xs leading-snug ${t.banner}`}>
            {note}
          </div>
        )}

        {/* Card stack */}
        <div className="relative flex-1">
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
          onClose={() => setPanelOpen(false)}
          onRemove={(id) => setSaved((prev) => prev.filter((e) => e.id !== id))}
        />
      </div>
    </div>
  );
}
