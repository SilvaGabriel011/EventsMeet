"use client";

import { AnimatePresence, motion } from "framer-motion";
import { PerthEvent } from "@/lib/types";
import { Theme } from "@/lib/themes";
import { calendarReady, downloadICS } from "@/lib/ics";

interface SavedPanelProps {
  open: boolean;
  saved: PerthEvent[];
  theme: Theme;
  onClose: () => void;
  onRemove: (id: string) => void;
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block align-[-2px]">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

export default function SavedPanel({ open, saved, theme: t, onClose, onRemove }: SavedPanelProps) {
  const exportable = calendarReady(saved);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col shadow-2xl ${t.panelBg}`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
          >
            <div className={`flex items-center justify-between border-b p-5 ${t.panelBorder}`}>
              <h2 className={`text-lg font-bold ${t.panelTitle}`}>
                My events <span className={t.panelMuted}>({saved.length})</span>
              </h2>
              <button
                onClick={onClose}
                aria-label="Close saved events"
                className={`rounded-full p-2 ${t.panelClose}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {saved.length > 0 && (
              <div className={`border-b p-5 ${t.panelBorder}`}>
                <button
                  onClick={() => downloadICS(exportable, "eventsmeet-perth.ics")}
                  disabled={exportable.length === 0}
                  className={`w-full rounded-full px-5 py-3 text-sm font-bold transition disabled:opacity-40 ${t.primaryBtn}`}
                >
                  <CalendarIcon />{" "}
                  {exportable.length > 0
                    ? ` Add ${exportable.length === 1 ? "event" : `all ${exportable.length}`} to Apple Calendar`
                    : " No events with confirmed dates yet"}
                </button>
                <p className={`mt-2 text-center text-[11px] ${t.panelMuted}`}>
                  Downloads an .ics file that opens straight in Apple Calendar
                  (also works with Google/Outlook).
                  {exportable.length < saved.length &&
                    ` ${saved.length - exportable.length} event${saved.length - exportable.length === 1 ? "" : "s"} without a confirmed date will be skipped.`}
                </p>
              </div>
            )}

            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {saved.length === 0 && (
                <p className={`pt-10 text-center text-sm ${t.panelMuted}`}>
                  Nothing saved yet.
                  <br />
                  Swipe right on events you like! 💜
                </p>
              )}
              {saved.map((event) => (
                <div
                  key={event.id}
                  className={`flex items-start gap-3 rounded-2xl p-4 ${t.panelCard}`}
                >
                  <span className="text-3xl">{event.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className={`truncate font-semibold ${t.panelTitle}`}>{event.title}</h3>
                    <p className={`mt-0.5 text-xs ${t.panelMuted}`}>
                      {event.date} · {event.venue}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <a
                        href={event.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-xs font-semibold ${t.panelLink}`}
                      >
                        View event ↗
                      </a>
                      {event.start ? (
                        <button
                          onClick={() =>
                            downloadICS(
                              [event],
                              `${event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.ics`
                            )
                          }
                          className={`text-xs font-semibold ${t.panelLink}`}
                        >
                          <CalendarIcon /> Add to Calendar
                        </button>
                      ) : (
                        <span className={`text-xs ${t.panelMuted}`} title="No confirmed date/time for this event">
                          <CalendarIcon /> Date TBC
                        </span>
                      )}
                      <button
                        onClick={() => onRemove(event.id)}
                        className={`text-xs font-medium ${t.panelMuted} hover:text-rose-400`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
