"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Theme } from "@/lib/themes";

interface GestureHintProps {
  show: boolean;
  theme: Theme;
  onDismiss: () => void;
}

/** One-time overlay teaching the swipe gestures on first use. */
export default function GestureHint({ show, theme: t, onDismiss }: GestureHintProps) {
  const reduceMotion = useReducedMotion();
  const wiggle = (dx: number) =>
    reduceMotion
      ? undefined
      : { x: [0, dx, 0], transition: { repeat: Infinity, duration: 1.2, ease: "easeInOut" as const } };

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
          <motion.p
            className="text-lg font-bold"
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            How it works
          </motion.p>
          <div className="space-y-3 text-sm font-medium">
            <p>
              <motion.span className="inline-block" animate={wiggle(8)}>👉</motion.span>{" "}
              Swipe right to <span className="font-bold text-emerald-400">save</span> an event
            </p>
            <p>
              <motion.span className="inline-block" animate={wiggle(-8)}>👈</motion.span>{" "}
              Swipe left to <span className="font-bold text-rose-400">skip</span> it
            </p>
            <p>
              <motion.span
                className="inline-block"
                animate={reduceMotion ? undefined : { y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
              >
                👆
              </motion.span>{" "}
              Tap a card for <span className="font-bold">full details</span>
            </p>
            <p>↩️ Changed your mind? Undo below</p>
          </div>
          <motion.span
            className={`mt-2 rounded-full px-6 py-2.5 text-sm font-bold ${t.primaryBtn}`}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.35, type: "spring", stiffness: 400, damping: 20 }}
          >
            Got it
          </motion.span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
