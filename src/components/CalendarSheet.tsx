"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  CATEGORY_COLORS,
  EventCategory,
  FilterState,
  PerthEvent,
} from "@/lib/types";
import { Theme } from "@/lib/themes";
import { eventMatchesFilters } from "@/lib/filters";
import { openExternal } from "@/lib/openExternal";

interface CalendarSheetProps {
  open: boolean;
  /** Everything the app currently knows about — deck + saved (deduped here). */
  events: PerthEvent[];
  /** Active filters — the calendar respects them too. */
  filters: FilterState;
  /** Human-readable summary of the active filters, e.g. "Music · Under $25". */
  filterSummary: string | null;
  theme: Theme;
  onClose: () => void;
}

const PERTH_OFFSET_MS = 8 * 3600_000;
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

/** Calendar day (YYYY-MM-DD) an instant falls on in Perth (UTC+8, no DST). */
const perthDayKey = (iso: string) =>
  new Date(Date.parse(iso) + PERTH_OFFSET_MS).toISOString().slice(0, 10);

const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Australia/Perth",
  });

function Body({
  events,
  filters,
  filterSummary,
  theme: t,
  onClose,
}: Omit<CalendarSheetProps, "open">) {
  // Captured once when the sheet opens (the Body remounts each open).
  const [todayKey] = useState(() =>
    new Date(Date.now() + PERTH_OFFSET_MS).toISOString().slice(0, 10)
  );
  const [cursor, setCursor] = useState(() => {
    const perthNow = new Date(Date.now() + PERTH_OFFSET_MS);
    return { y: perthNow.getUTCFullYear(), m: perthNow.getUTCMonth() };
  });
  const [selected, setSelected] = useState<string | null>(null);

  const { byDay, undated } = useMemo(() => {
    const byDay = new Map<string, PerthEvent[]>();
    const undated: PerthEvent[] = [];
    const seenTitles = new Set<string>();
    for (const e of events) {
      if (seenTitles.has(e.title)) continue;
      seenTitles.add(e.title);
      if (!eventMatchesFilters(e, filters)) continue;
      if (e.start) {
        const k = perthDayKey(e.start);
        byDay.set(k, [...(byDay.get(k) ?? []), e]);
      } else {
        undated.push(e);
      }
    }
    for (const list of byDay.values()) {
      list.sort((a, b) => Date.parse(a.start as string) - Date.parse(b.start as string));
    }
    return { byDay, undated };
  }, [events, filters]);

  const startPad = (new Date(Date.UTC(cursor.y, cursor.m, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(cursor.y, cursor.m + 1, 0)).getUTCDate();
  const monthPrefix = `${cursor.y}-${String(cursor.m + 1).padStart(2, "0")}`;
  const dayKey = (d: number) => `${monthPrefix}-${String(d).padStart(2, "0")}`;
  const monthTitle = new Date(Date.UTC(cursor.y, cursor.m, 1)).toLocaleDateString("en-AU", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  // Categories present in the visible month, for the color legend.
  const monthCategories = useMemo(() => {
    const cats = new Set<EventCategory>();
    for (const [k, list] of byDay) {
      if (k.startsWith(monthPrefix)) list.forEach((e) => cats.add(e.category));
    }
    return [...cats].sort();
  }, [byDay, monthPrefix]);

  const nav = (delta: number) => {
    setSelected(null);
    setCursor((c) => {
      const d = new Date(Date.UTC(c.y, c.m + delta, 1));
      return { y: d.getUTCFullYear(), m: d.getUTCMonth() };
    });
  };

  const selectedEvents = selected ? (byDay.get(selected) ?? []) : [];
  const selectedTitle = selected
    ? new Date(`${selected}T00:00:00`).toLocaleDateString("en-AU", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : null;

  const navBtn = `rounded-full p-2 ${t.panelClose}`;

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className={`fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88dvh] w-full max-w-md flex-col rounded-t-3xl pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl ${t.panelBg}`}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 350, damping: 35 }}
      >
        {/* Month navigation */}
        <div className={`border-b px-4 py-3 ${t.panelBorder}`}>
          <div className="flex items-center justify-between">
            <button onClick={() => nav(-1)} aria-label="Previous month" className={navBtn}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <h2 className={`text-base font-bold ${t.panelTitle}`}>{monthTitle}</h2>
            <div className="flex items-center gap-1">
              <button onClick={() => nav(1)} aria-label="Next month" className={navBtn}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </button>
              <button onClick={onClose} aria-label="Close calendar" className={navBtn}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          {filterSummary && (
            <p className={`mt-1 text-center text-[11px] font-medium ${t.panelMuted}`}>
              Filtered: {filterSummary}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-2">
          {/* Weekday header */}
          <div className="mt-3 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((w) => (
              <span key={w} className={`text-center text-[10px] font-bold uppercase ${t.panelMuted}`}>
                {w}
              </span>
            ))}
          </div>

          {/* Day grid — events show up on their day as category-colored emoji pills */}
          <div className="mt-1 grid grid-cols-7 gap-1">
            {Array.from({ length: startPad }, (_, i) => (
              <span key={`pad-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const d = i + 1;
              const k = dayKey(d);
              const list = byDay.get(k) ?? [];
              const count = list.length;
              const isToday = k === todayKey;
              const isSelected = k === selected;
              return (
                <motion.button
                  key={k}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (startPad + i) * 0.007, duration: 0.15 }}
                  onClick={() => count > 0 && setSelected(isSelected ? null : k)}
                  disabled={count === 0}
                  aria-label={`${k}: ${count} events`}
                  className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-semibold transition-colors ${
                    isSelected
                      ? t.pickerItemActive
                      : count > 0
                        ? t.pickerItem
                        : `opacity-35 ${t.panelMuted}`
                  } ${isToday ? "ring-2 ring-current" : ""}`}
                >
                  {d}
                  {count > 0 && (
                    <span className="flex items-center gap-0.5">
                      {list.slice(0, 2).map((e) => (
                        <span
                          key={e.id}
                          className={`rounded-full p-[2px] text-[9px] leading-none ${CATEGORY_COLORS[e.category]}`}
                          title={e.title}
                        >
                          {e.emoji}
                        </span>
                      ))}
                      {count > 2 && (
                        <span className={`text-[8px] font-bold ${t.panelMuted}`}>+{count - 2}</span>
                      )}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Category color legend for the visible month */}
          {monthCategories.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1">
              {monthCategories.map((c) => (
                <span key={c} className={`flex items-center gap-1 text-[10px] font-medium ${t.panelMuted}`}>
                  <span className={`h-2 w-2 rounded-full ${CATEGORY_COLORS[c]}`} />
                  {c}
                </span>
              ))}
            </div>
          )}

          {/* Selected day's events */}
          {selectedTitle && (
            <p className={`mt-4 text-xs font-bold uppercase tracking-widest ${t.panelMuted}`}>
              {selectedTitle}
            </p>
          )}
          {!selected && (
            <p className={`mt-4 text-center text-xs ${t.panelMuted}`}>
              Tap a highlighted day to see its events.
            </p>
          )}
          <AnimatePresence initial={false}>
            <div className="mt-2 space-y-2">
              {selectedEvents.map((e, i) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, type: "spring", stiffness: 400, damping: 30 }}
                  className={`flex items-center gap-3 overflow-hidden rounded-2xl p-3 ${t.panelCard}`}
                >
                  <span className={`-my-3 -ml-3 w-1.5 self-stretch ${CATEGORY_COLORS[e.category]}`} />
                  <span className="text-2xl">{e.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-semibold ${t.panelTitle}`}>{e.title}</p>
                    <p className={`truncate text-xs ${t.panelMuted}`}>
                      {timeLabel(e.start as string)} · {e.venue} · {e.price}
                    </p>
                  </div>
                  <a
                    href={e.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(ev) => {
                      ev.preventDefault();
                      openExternal(e.url);
                    }}
                    className={`shrink-0 text-xs font-semibold ${t.panelLink}`}
                  >
                    View ↗
                  </a>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>

          {/* Events without a confirmed date */}
          {undated.length > 0 && (
            <>
              <p className={`mt-4 text-xs font-bold uppercase tracking-widest ${t.panelMuted}`}>
                Date to be confirmed
              </p>
              <div className="mt-2 space-y-2">
                {undated.map((e) => (
                  <div key={e.id} className={`flex items-center gap-3 overflow-hidden rounded-2xl p-3 ${t.panelCard}`}>
                    <span className={`-my-3 -ml-3 w-1.5 self-stretch ${CATEGORY_COLORS[e.category]}`} />
                    <span className="text-2xl">{e.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-semibold ${t.panelTitle}`}>{e.title}</p>
                      <p className={`truncate text-xs ${t.panelMuted}`}>
                        {e.date} · {e.venue}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </>
  );
}

export default function CalendarSheet(props: CalendarSheetProps) {
  return (
    <AnimatePresence>
      {props.open && <Body {...props} />}
    </AnimatePresence>
  );
}
