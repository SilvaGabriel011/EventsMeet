"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { PerthEvent } from "@/lib/types";
import { Theme } from "@/lib/themes";
import { downloadICS } from "@/lib/ics";

interface DetailsSheetProps {
  event: PerthEvent | null;
  theme: Theme;
  onClose: () => void;
  /** 1 = save, -1 = skip — animates the card out via the deck. */
  onDecide: (dir: 1 | -1) => void;
}

function Body({ event, theme: t, onClose, onDecide }: DetailsSheetProps & { event: PerthEvent }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = Boolean(event.image) && !imgFailed;
  const mapsUrl = `https://maps.apple.com/?q=${encodeURIComponent(`${event.venue}, Perth WA`)}`;

  const decide = (dir: 1 | -1) => {
    onClose();
    onDecide(dir);
  };

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
        className={`fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl ${t.panelBg}`}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 350, damping: 35 }}
      >
        {/* Hero */}
        <div className="relative h-44 shrink-0">
          {showImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary external domains
            <img
              src={event.image as string}
              alt=""
              onError={() => setImgFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br text-7xl ${t.gradients[event.category]}`}>
              {event.emoji}
            </div>
          )}
          <span className="absolute left-4 top-4 rounded-full bg-black/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur">
            {event.category}
          </span>
          <button
            onClick={onClose}
            aria-label="Close details"
            className="absolute right-3 top-3 rounded-full bg-black/40 p-2 text-white backdrop-blur"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          <h2 className={`text-2xl font-bold leading-tight ${t.panelTitle}`}>
            {event.emoji} {event.title}
          </h2>
          <div className={`space-y-1 text-sm ${t.panelMuted}`}>
            <p>📅 {event.date}</p>
            <p>
              📍{" "}
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={`font-semibold underline underline-offset-2 ${t.panelLink}`}>
                {event.venue}
              </a>
            </p>
            <p>💵 {event.price}</p>
          </div>
          <p className={`text-sm leading-relaxed ${t.panelTitle}`}>{event.description}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-sm font-semibold ${t.panelLink}`}
            >
              Open event page ↗
            </a>
            {event.start && (
              <button
                onClick={() =>
                  downloadICS([event], `${event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.ics`)
                }
                className={`text-sm font-semibold ${t.panelLink}`}
              >
                📅 Add to Calendar
              </button>
            )}
          </div>
        </div>

        {/* Decide */}
        <div className="flex gap-3 px-5 pt-3">
          <button
            onClick={() => decide(-1)}
            className={`flex-1 rounded-full px-5 py-3.5 text-sm font-bold ${t.nopeBtn}`}
          >
            ✖ Skip
          </button>
          <button
            onClick={() => decide(1)}
            className={`flex-1 rounded-full px-5 py-3.5 text-sm font-bold ${t.likeBtn}`}
          >
            ❤ Save
          </button>
        </div>
      </motion.div>
    </>
  );
}

export default function DetailsSheet(props: DetailsSheetProps) {
  return (
    <AnimatePresence>
      {props.event && <Body {...props} event={props.event} />}
    </AnimatePresence>
  );
}
