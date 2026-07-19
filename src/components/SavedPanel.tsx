"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { PerthEvent } from "@/lib/types";
import { Theme } from "@/lib/themes";
import { calendarReady, downloadICS } from "@/lib/ics";
import { getSupabase } from "@/lib/supabase";
import {
  CoGoer,
  WaveSets,
  eventKey,
  fetchCoGoers,
  fetchContact,
  fetchMyWaves,
  getCalendarToken,
  sendWave,
  wavePair,
} from "@/lib/social";

interface SavedPanelProps {
  open: boolean;
  saved: PerthEvent[];
  theme: Theme;
  user: User | null;
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

interface PersonRowProps {
  person: CoGoer;
  evKey: string;
  waves: WaveSets;
  theme: Theme;
  onWave: (evKey: string, toUser: string) => void;
  contact: string | null | undefined;
  onNeedContact: (userId: string) => void;
}

function PersonRow({ person, evKey, waves, theme: t, onWave, contact, onNeedContact }: PersonRowProps) {
  const pair = wavePair(evKey, person.userId);
  const sent = waves.sent.has(pair);
  const received = waves.received.has(pair);
  const matched = sent && received;

  useEffect(() => {
    if (matched && contact === undefined) onNeedContact(person.userId);
  }, [matched, contact, onNeedContact, person.userId]);

  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className={`truncate text-xs font-medium ${t.panelTitle}`}>
        {person.name}
        {received && !matched && <span className={`ml-1.5 ${t.panelMuted}`}>waved at you 👋</span>}
      </span>
      {matched ? (
        <span className={`shrink-0 text-xs font-semibold ${t.panelLink}`}>
          🎉 Match{contact ? ` · ${contact}` : ""}
        </span>
      ) : sent ? (
        <span className={`shrink-0 text-xs ${t.panelMuted}`}>Waved ✓</span>
      ) : (
        <button
          onClick={() => onWave(evKey, person.userId)}
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${t.primaryBtn}`}
        >
          👋 Wave
        </button>
      )}
    </div>
  );
}

export default function SavedPanel({ open, saved, theme: t, user, onClose, onRemove }: SavedPanelProps) {
  const sb = getSupabase();
  const exportable = calendarReady(saved);
  const [coGoers, setCoGoers] = useState<Map<string, CoGoer[]>>(new Map());
  const [waves, setWaves] = useState<WaveSets>({ sent: new Set(), received: new Set() });
  const [contacts, setContacts] = useState<Record<string, string | null>>({});
  const [webcalUrl, setWebcalUrl] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Load social + feed data whenever the panel opens signed-in.
  useEffect(() => {
    if (!open || !sb || !user) return;
    const keys = saved.map((e) => eventKey(e.title));
    fetchCoGoers(sb, user.id, keys).then(setCoGoers).catch(() => {});
    fetchMyWaves(sb, user.id).then(setWaves).catch(() => {});
    getCalendarToken(sb, user.id)
      .then((token) =>
        setWebcalUrl(`webcal://${window.location.host}/api/calendar/feed?token=${token}`)
      )
      .catch(() => setWebcalUrl(null));
  }, [open, sb, user, saved]);

  const handleWave = (evKey: string, toUser: string) => {
    if (!sb || !user) return;
    sendWave(sb, user.id, evKey, toUser).catch(() => {});
    setWaves((prev) => ({
      sent: new Set(prev.sent).add(wavePair(evKey, toUser)),
      received: prev.received,
    }));
  };

  const loadContact = (userId: string) => {
    if (!sb || contacts[userId] !== undefined) return;
    fetchContact(sb, userId).then((c) =>
      setContacts((prev) => ({ ...prev, [userId]: c }))
    );
  };

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
            className={`fixed right-0 top-0 z-50 flex h-dvh w-full max-w-md flex-col shadow-2xl pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)] ${t.panelBg}`}
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
                className={`-my-1 rounded-full p-3 ${t.panelClose}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {saved.length > 0 && (
              <div className={`space-y-2 border-b p-5 ${t.panelBorder}`}>
                {user && webcalUrl && (
                  <>
                    <a
                      href={webcalUrl}
                      className={`block w-full rounded-full px-5 py-3 text-center text-sm font-bold transition ${t.primaryBtn}`}
                    >
                      🔁 Auto-sync with Apple Calendar
                    </a>
                    <p className={`text-center text-[11px] ${t.panelMuted}`}>
                      Subscribes Apple Calendar to your personal feed — saves and
                      removals sync automatically.
                    </p>
                  </>
                )}
                <button
                  onClick={() => downloadICS(exportable, "eventsmeet-perth.ics")}
                  disabled={exportable.length === 0}
                  className={`w-full rounded-full px-5 py-3 text-sm font-bold transition disabled:opacity-40 ${
                    user && webcalUrl ? `${t.panelCard} ${t.panelTitle}` : t.primaryBtn
                  }`}
                >
                  <CalendarIcon />{" "}
                  {exportable.length > 0
                    ? ` One-off download (.ics)`
                    : " No events with confirmed dates yet"}
                </button>
                {sb && !user && (
                  <p className={`text-center text-[11px] ${t.panelMuted}`}>
                    Sign in (👤 in the header) for automatic calendar sync and to see
                    who else is going.
                  </p>
                )}
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
              {saved.map((event) => {
                const evKey = eventKey(event.title);
                const people = coGoers.get(evKey) ?? [];
                return (
                  <div
                    key={event.id}
                    className={`rounded-2xl p-4 ${t.panelCard}`}
                  >
                    <div className="flex items-start gap-3">
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
                            View ↗
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
                              <CalendarIcon /> Calendar
                            </button>
                          ) : (
                            <span className={`text-xs ${t.panelMuted}`} title="No confirmed date/time for this event">
                              <CalendarIcon /> Date TBC
                            </span>
                          )}
                          {user && people.length > 0 && (
                            <button
                              onClick={() => setExpanded(expanded === evKey ? null : evKey)}
                              className={`text-xs font-semibold ${t.panelLink}`}
                            >
                              👥 {people.length} also going
                            </button>
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
                    {user && expanded === evKey && people.length > 0 && (
                      <div className={`mt-3 border-t pt-2 ${t.panelBorder}`}>
                        {people.map((p) => (
                          <PersonRow
                            key={p.userId}
                            person={p}
                            evKey={evKey}
                            waves={waves}
                            theme={t}
                            onWave={handleWave}
                            contact={contacts[p.userId]}
                            onNeedContact={loadContact}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
