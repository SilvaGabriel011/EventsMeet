"use client";

import { AnimatePresence, motion } from "framer-motion";
import { PerthEvent } from "@/lib/types";

interface SavedPanelProps {
  open: boolean;
  saved: PerthEvent[];
  onClose: () => void;
  onRemove: (id: string) => void;
}

export default function SavedPanel({ open, saved, onClose, onRemove }: SavedPanelProps) {
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
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-zinc-950 shadow-2xl ring-1 ring-white/10"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
          >
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <h2 className="text-lg font-bold text-white">
                My events <span className="text-white/50">({saved.length})</span>
              </h2>
              <button
                onClick={onClose}
                aria-label="Close saved events"
                className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {saved.length === 0 && (
                <p className="pt-10 text-center text-sm text-white/50">
                  Nothing saved yet.
                  <br />
                  Swipe right on events you like! 💜
                </p>
              )}
              {saved.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"
                >
                  <span className="text-3xl">{event.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-white">{event.title}</h3>
                    <p className="mt-0.5 text-xs text-white/60">
                      {event.date} · {event.venue}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <a
                        href={event.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-fuchsia-400 hover:text-fuchsia-300"
                      >
                        View event ↗
                      </a>
                      <button
                        onClick={() => onRemove(event.id)}
                        className="text-xs font-medium text-white/40 hover:text-rose-400"
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
