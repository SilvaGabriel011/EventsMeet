"use client";

import { useState } from "react";
import { WhenFilter } from "@/lib/types";
import { Theme } from "@/lib/themes";
import { ALL_CHIPS, ChipDef, chipById, isChipActive } from "@/lib/chips";

interface FilterBarProps {
  theme: Theme;
  filter: string;
  when: WhenFilter;
  freeOnly: boolean;
  favorites: string[];
  onApply: (chip: ChipDef, active: boolean) => void;
  onToggleFav: (id: string) => void;
}

interface ChipProps {
  def: ChipDef;
  active: boolean;
  fav: boolean;
  theme: Theme;
  onApply: () => void;
  onFav: () => void;
}

function Chip({ def, active, fav, theme, onApply, onFav }: ChipProps) {
  return (
    <div
      className={`flex shrink-0 items-center whitespace-nowrap rounded-full py-0.5 pl-1 pr-1.5 text-xs font-semibold transition-colors ${
        active ? theme.chipActive : theme.chipIdle
      }`}
    >
      <button onClick={onApply} className="py-1.5 pl-2.5 pr-1">
        {def.label}
      </button>
      <button
        onClick={onFav}
        aria-label={fav ? `Unpin ${def.label}` : `Pin ${def.label} to the top row`}
        className={`px-1 py-1.5 text-[13px] leading-none ${fav ? "" : "opacity-50"}`}
      >
        {fav ? "★" : "☆"}
      </button>
    </div>
  );
}

/**
 * iOS-friendly filter bar: a pinned row with favorited + currently-active
 * chips, above an auto-scrolling alphabetical carousel of every option.
 * The carousel pauses while touched (or hovered) so chips are easy to tap.
 */
export default function FilterBar({
  theme,
  filter,
  when,
  freeOnly,
  favorites,
  onApply,
  onToggleFav,
}: FilterBarProps) {
  const [paused, setPaused] = useState(false);

  const active = (c: ChipDef) => isChipActive(c, filter, when, freeOnly);

  // Active chips first, then remaining favorites, deduped.
  const favSet = new Set(favorites);
  const pinnedIds = [
    ...ALL_CHIPS.filter(active).map((c) => c.id),
    ...favorites.filter((id) => !ALL_CHIPS.find((c) => c.id === id && active(c))),
  ];
  const pinned = [...new Set(pinnedIds)]
    .map(chipById)
    .filter((c): c is ChipDef => Boolean(c));

  const chip = (def: ChipDef, keySuffix = "") => (
    <Chip
      key={def.id + keySuffix}
      def={def}
      active={active(def)}
      fav={favSet.has(def.id)}
      theme={theme}
      onApply={() => onApply(def, active(def))}
      onFav={() => onToggleFav(def.id)}
    />
  );

  return (
    <div className="space-y-2 py-2">
      {/* Pinned row: favorites + whatever is currently active */}
      {pinned.length > 0 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
          {pinned.map((c) => chip(c, "-pin"))}
        </div>
      )}

      {/* Auto-scrolling alphabetical carousel with every option */}
      <div
        className="marquee-viewport -mx-4 overflow-hidden px-4"
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setTimeout(() => setPaused(false), 1500)}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className="marquee-track flex w-max gap-2"
          style={{ animationPlayState: paused ? "paused" : "running" }}
        >
          {ALL_CHIPS.map((c) => chip(c, "-a"))}
          {ALL_CHIPS.map((c) => chip(c, "-b"))}
        </div>
      </div>
    </div>
  );
}
