"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Theme } from "@/lib/themes";

interface GestureHintProps {
  show: boolean;
  theme: Theme;
  onDismiss: () => void;
}

/** One-time overlay teaching the swipe gestures on first use. */
export default function GestureHint({ show, theme: t, onDismiss }: GestureHintProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          onClick={onDismiss}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-black/75 px-8 text-white backdrop-blur-sm ${t.cardRadius}`}
        >
          <p className="text-lg font-bold">How it works</p>
          <div className="space-y-3 text-sm font-medium">
            <p>👉 Swipe right to <span className="font-bold text-emerald-400">save</span> an event</p>
            <p>👈 Swipe left to <span className="font-bold text-rose-400">skip</span> it</p>
            <p>👆 Tap a card for <span className="font-bold">full details</span></p>
            <p>↩️ Changed your mind? Undo below</p>
          </div>
          <span className={`mt-2 rounded-full px-6 py-2.5 text-sm font-bold ${t.primaryBtn}`}>
            Got it
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
