"use client";

import { motion, useAnimation, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { useEffect } from "react";
import { CATEGORY_GRADIENTS, PerthEvent } from "@/lib/types";

export type SwipeDir = 1 | -1;

interface SwipeCardProps {
  event: PerthEvent;
  /** 0 = top of the stack (draggable), 1–2 = cards peeking behind it. */
  depth: number;
  /** Set by the action buttons to fly the top card out programmatically. */
  forced: { dir: SwipeDir; nonce: number } | null;
  onSwiped: (dir: SwipeDir) => void;
}

const SWIPE_THRESHOLD = 110;
const FLY_X = 900;

export default function SwipeCard({ event, depth, forced, onSwiped }: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 250], [-14, 14]);
  const likeOpacity = useTransform(x, [30, 130], [0, 1]);
  const nopeOpacity = useTransform(x, [-130, -30], [1, 0]);
  const controls = useAnimation();
  const isTop = depth === 0;

  const flyOut = (dir: SwipeDir) =>
    controls
      .start({
        x: dir * FLY_X,
        opacity: 0,
        transition: { duration: 0.35, ease: "easeIn" },
      })
      .then(() => onSwiped(dir));

  useEffect(() => {
    if (isTop && forced) flyOut(forced.dir);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forced, isTop]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD || info.velocity.x > 600) {
      flyOut(1);
    } else if (info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -600) {
      flyOut(-1);
    } else {
      controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 30 } });
    }
  };

  return (
    <motion.div
      className="absolute inset-0 select-none"
      style={{ x, rotate, zIndex: 10 - depth }}
      animate={controls}
      initial={false}
      drag={isTop ? "x" : false}
      dragElastic={0.9}
      dragMomentum={false}
      onDragEnd={isTop ? handleDragEnd : undefined}
    >
      <motion.div
        className={`flex h-full w-full flex-col overflow-hidden rounded-3xl bg-gradient-to-br shadow-2xl shadow-black/50 ring-1 ring-white/10 ${CATEGORY_GRADIENTS[event.category]}`}
        animate={{ scale: 1 - depth * 0.05, y: depth * 14 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Stamps */}
        {isTop && (
          <>
            <motion.div
              style={{ opacity: likeOpacity }}
              className="absolute left-5 top-6 z-20 -rotate-12 rounded-lg border-4 border-emerald-400 px-3 py-1 text-3xl font-black tracking-widest text-emerald-400"
            >
              LIKE
            </motion.div>
            <motion.div
              style={{ opacity: nopeOpacity }}
              className="absolute right-5 top-6 z-20 rotate-12 rounded-lg border-4 border-rose-500 px-3 py-1 text-3xl font-black tracking-widest text-rose-500"
            >
              NOPE
            </motion.div>
          </>
        )}

        {/* Emoji hero */}
        <div className="relative flex flex-1 items-center justify-center">
          <span className="absolute left-4 top-4 rounded-full bg-black/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/90 backdrop-blur">
            {event.category}
          </span>
          <span className="text-8xl drop-shadow-[0_8px_24px_rgba(0,0,0,0.4)]">{event.emoji}</span>
        </div>

        {/* Info */}
        <div className="space-y-2 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-5 pt-10">
          <h2 className="text-2xl font-bold leading-tight text-white">{event.title}</h2>
          <p className="text-sm font-medium text-white/90">
            📅 {event.date} · 📍 {event.venue}
          </p>
          <p className="text-sm leading-snug text-white/75">{event.description}</p>
          <div className="flex items-center justify-between pt-1">
            <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-white">
              {event.price}
            </span>
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              draggable={false}
              className="text-sm font-semibold text-white/90 underline decoration-white/40 underline-offset-4 hover:text-white"
            >
              View event ↗
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
