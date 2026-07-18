"use client";

import { motion, useAnimation, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { useEffect, useState } from "react";
import { PerthEvent } from "@/lib/types";
import { Theme } from "@/lib/themes";

export type SwipeDir = 1 | -1;

interface SwipeCardProps {
  event: PerthEvent;
  theme: Theme;
  /** 0 = top of the stack (draggable), 1–2 = cards peeking behind it. */
  depth: number;
  /** Set by the action buttons to fly the top card out programmatically. */
  forced: { dir: SwipeDir; nonce: number } | null;
  onSwiped: (dir: SwipeDir) => void;
}

const SWIPE_THRESHOLD = 110;
const FLY_X = 900;

export default function SwipeCard({ event, theme, depth, forced, onSwiped }: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 250], [-14, 14]);
  const likeOpacity = useTransform(x, [30, 130], [0, 1]);
  const nopeOpacity = useTransform(x, [-130, -30], [1, 0]);
  const controls = useAnimation();
  const [imgFailed, setImgFailed] = useState(false);
  const isTop = depth === 0;
  const showImage = Boolean(event.image) && !imgFailed;

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
        className={`flex h-full w-full flex-col overflow-hidden bg-gradient-to-br shadow-2xl shadow-black/40 ${theme.cardBase} ${theme.cardRadius} ${theme.cardRing} ${theme.gradients[event.category]}`}
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

        {/* Event photo (og:image) — falls back to the emoji hero on error */}
        {showImage && (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary external domains; next/image needs an allowlist
          <img
            src={event.image as string}
            alt=""
            draggable={false}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        {/* Emoji hero */}
        <div className="relative z-10 flex flex-1 items-center justify-center">
          <span className="absolute left-4 top-4 rounded-full bg-black/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/90 backdrop-blur">
            {event.category}
          </span>
          {!showImage && (
            <span className="text-8xl drop-shadow-[0_8px_24px_rgba(0,0,0,0.4)]">{event.emoji}</span>
          )}
        </div>

        {/* Info */}
        <div
          className={`relative z-10 space-y-2 bg-gradient-to-t p-5 pt-10 ${
            showImage ? "from-black/90 via-black/60 to-transparent" : theme.infoOverlay
          }`}
        >
          <h2 className="text-2xl font-bold leading-tight text-white">{event.title}</h2>
          <p className="text-sm font-medium text-white/90">
            📅 {event.date} · 📍 {event.venue}
          </p>
          <p className="text-sm leading-snug text-white/75">{event.description}</p>
          <div className="flex items-center justify-between pt-1">
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${theme.priceChip}`}>
              {event.price}
            </span>
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              draggable={false}
              className={`text-sm font-semibold underline underline-offset-4 ${theme.viewLink}`}
            >
              View event ↗
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
