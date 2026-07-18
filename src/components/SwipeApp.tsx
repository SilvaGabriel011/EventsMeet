"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CATEGORIES, EventsResponse, PerthEvent } from "@/lib/types";
import SwipeCard, { SwipeDir } from "./SwipeCard";
import SavedPanel from "./SavedPanel";

const SAVED_KEY = "eventsmeet.saved.v1";
const SEEN_KEY = "eventsmeet.seen.v1";
const VISIBLE_CARDS = 3;

type Filter = "All" | (typeof CATEGORIES)[number];

export default function SwipeApp() {
  const [deck, setDeck] = useState<PerthEvent[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [filter, setFilter] = useState<Filter>("All");
  const [saved, setSaved] = useState<PerthEvent[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [forced, setForced] = useState<{ dir: SwipeDir; nonce: number } | null>(null);
  const [history, setHistory] = useState<{ event: PerthEvent; dir: SwipeDir }[]>([]);
  const seenTitles = useRef<string[]>([]);

  // Hydrate persisted state after mount — localStorage isn't available during
  // SSR, and reading it in a useState initializer would cause a hydration
  // mismatch whenever the user has saved events.
  useEffect(() => {
    try {
      const rawSaved = localStorage.getItem(SAVED_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (rawSaved) setSaved(JSON.parse(rawSaved));
      const rawSeen = localStorage.getItem(SEEN_KEY);
      if (rawSeen) seenTitles.current = JSON.parse(rawSeen);
    } catch {
      // Corrupt storage — start fresh.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
  }, [saved]);

  const rememberSeen = (title: string) => {
    seenTitles.current = [...seenTitles.current.filter((t) => t !== title), title].slice(-80);
    localStorage.setItem(SEEN_KEY, JSON.stringify(seenTitles.current));
  };

  const fetchEvents = useCallback(
    async (category: Filter, opts: { append?: boolean; refresh?: boolean } = {}) => {
      setLoading(true);
      setNote(null);
      try {
        const res = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category,
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
    fetchEvents("All");
  }, [fetchEvents]);

  const topEvent = deck[index];
  const deckEmpty = !loading && !topEvent;

  const handleSwiped = (dir: SwipeDir) => {
    if (!topEvent) return;
    rememberSeen(topEvent.title);
    if (dir === 1) {
      setSaved((prev) =>
        prev.some((e) => e.title === topEvent.title) ? prev : [topEvent, ...prev]
      );
    }
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
    if (last.dir === 1) {
      setSaved((prev) => prev.filter((e) => e.title !== last.event.title));
    }
    setIndex((i) => Math.max(0, i - 1));
  };

  const changeFilter = (f: Filter) => {
    if (f === filter && !deckEmpty) return;
    setFilter(f);
    fetchEvents(f);
  };

  return (
    <div className="mx-auto flex h-dvh w-full max-w-md flex-col px-4 pb-4 pt-3">
      {/* Header */}
      <header className="flex items-center justify-between py-2">
        <div>
          <h1 className="text-xl font-black tracking-tight text-white">
            Events<span className="text-fuchsia-500">Meet</span>
          </h1>
          <p className="text-[11px] font-medium uppercase tracking-widest text-white/40">
            Perth · WA {live && <span className="text-emerald-400">· live AI search</span>}
          </p>
        </div>
        <button
          onClick={() => setPanelOpen(true)}
          className="relative rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20"
          aria-label="Open saved events"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21s-7.5-4.7-10-9.3C.3 8.6 2.2 5 5.6 5c2 0 3.4 1.1 4.4 2.5A5.3 5.3 0 0 1 14.4 5c3.4 0 5.3 3.6 3.6 6.7C15.5 16.3 12 21 12 21z" />
          </svg>
          {saved.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-fuchsia-500 px-1 text-[11px] font-bold text-white">
              {saved.length}
            </span>
          )}
        </button>
      </header>

      {/* Category chips */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 py-2 [scrollbar-width:none]">
        {(["All", ...CATEGORIES] as Filter[]).map((c) => (
          <button
            key={c}
            onClick={() => changeFilter(c)}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              filter === c
                ? "bg-fuchsia-600 text-white"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Notice banner */}
      {note && (
        <div className="mb-2 rounded-xl bg-amber-500/15 px-3 py-2 text-xs leading-snug text-amber-300 ring-1 ring-amber-500/30">
          {note}
        </div>
      )}

      {/* Card stack */}
      <div className="relative flex-1">
        {loading && (
          <div className="absolute inset-0 flex animate-pulse flex-col items-center justify-center gap-3 rounded-3xl bg-white/5 ring-1 ring-white/10">
            <span className="text-5xl">🔎</span>
            <p className="px-8 text-center text-sm font-medium text-white/60">
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
                depth={i}
                forced={i === 0 ? forced : null}
                onSwiped={handleSwiped}
              />
            ))
            .reverse()}

        {deckEmpty && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-3xl bg-white/5 ring-1 ring-white/10">
            <span className="text-5xl">🎉</span>
            <p className="px-8 text-center text-sm font-medium text-white/60">
              You&apos;ve seen everything for now.
            </p>
            <button
              onClick={() => fetchEvents(filter, { append: true, refresh: true })}
              className="rounded-full bg-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-fuchsia-500"
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
          className="rounded-full bg-white/10 p-3.5 text-amber-400 transition hover:bg-white/20 disabled:opacity-30"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 0 0-15-6.7L3 13" />
          </svg>
        </button>
        <button
          onClick={() => swipe(-1)}
          aria-label="Skip event"
          className="rounded-full bg-white/10 p-5 text-rose-500 shadow-lg transition hover:scale-105 hover:bg-white/20"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        <button
          onClick={() => swipe(1)}
          aria-label="Save event"
          className="rounded-full bg-gradient-to-br from-fuchsia-600 to-purple-700 p-5 text-white shadow-lg shadow-fuchsia-900/50 transition hover:scale-105"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21s-7.5-4.7-10-9.3C.3 8.6 2.2 5 5.6 5c2 0 3.4 1.1 4.4 2.5A5.3 5.3 0 0 1 14.4 5c3.4 0 5.3 3.6 3.6 6.7C15.5 16.3 12 21 12 21z" />
          </svg>
        </button>
      </div>

      <SavedPanel
        open={panelOpen}
        saved={saved}
        onClose={() => setPanelOpen(false)}
        onRemove={(id) => setSaved((prev) => prev.filter((e) => e.id !== id))}
      />
    </div>
  );
}
