"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { CATEGORIES, WHEN_OPTIONS, WhenFilter } from "@/lib/types";
import { Theme } from "@/lib/themes";

export type CategoryFilter = "All" | (typeof CATEGORIES)[number];

export interface FilterState {
  filter: CategoryFilter;
  when: WhenFilter;
  freeOnly: boolean;
}

interface FilterSheetProps {
  open: boolean;
  theme: Theme;
  current: FilterState;
  favorites: string[];
  onToggleFav: (id: string) => void;
  onApply: (next: FilterState) => void;
  onClose: () => void;
}

export const favId = (category: string) => `cat:${category}`;

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/** Inner component so draft state re-initializes each time the sheet opens. */
function SheetBody({
  theme: t,
  current,
  favorites,
  onToggleFav,
  onApply,
  onClose,
}: Omit<FilterSheetProps, "open">) {
  const [draft, setDraft] = useState<FilterState>(current);
  const favSet = new Set(favorites);

  const apply = () => {
    onApply(draft);
    onClose();
  };

  // Starred categories first, then alphabetical.
  const cats = [...CATEGORIES].sort(
    (a, b) =>
      (favSet.has(favId(b)) ? 1 : 0) - (favSet.has(favId(a)) ? 1 : 0) ||
      a.localeCompare(b)
  );

  const sectionTitle = `mb-2 mt-4 text-[11px] font-bold uppercase tracking-widest ${t.panelMuted}`;
  const row = (selected: boolean) =>
    `flex w-full items-center rounded-xl text-sm font-semibold transition-colors ${
      selected ? t.pickerItemActive : t.pickerItem
    }`;

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={apply}
      />
      <motion.div
        className={`fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[82dvh] w-full max-w-md flex-col rounded-t-3xl pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl ${t.panelBg}`}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 350, damping: 35 }}
      >
        <div className={`flex items-center justify-between border-b px-5 py-4 ${t.panelBorder}`}>
          <h2 className={`text-lg font-bold ${t.panelTitle}`}>Filters</h2>
          <button
            onClick={() =>
              setDraft({ filter: "All", when: "any", freeOnly: false })
            }
            className={`text-xs font-semibold ${t.panelMuted} hover:opacity-80`}
          >
            Clear all
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          <p className={sectionTitle}>Category</p>
          <div className="space-y-1.5">
            <div className={row(draft.filter === "All")}>
              <button
                onClick={() => setDraft((d) => ({ ...d, filter: "All" }))}
                className="flex flex-1 items-center justify-between px-3 py-2.5 text-left"
              >
                All categories {draft.filter === "All" && <Check />}
              </button>
            </div>
            {cats.map((c) => (
              <div key={c} className={row(draft.filter === c)}>
                <button
                  onClick={() => setDraft((d) => ({ ...d, filter: c }))}
                  className="flex flex-1 items-center justify-between px-3 py-2.5 text-left"
                >
                  {c} {draft.filter === c && <Check />}
                </button>
                <button
                  onClick={() => onToggleFav(favId(c))}
                  aria-label={favSet.has(favId(c)) ? `Unstar ${c}` : `Star ${c}`}
                  className={`px-3 py-2.5 text-sm ${favSet.has(favId(c)) ? "" : "opacity-40"}`}
                >
                  {favSet.has(favId(c)) ? "★" : "☆"}
                </button>
              </div>
            ))}
          </div>

          <p className={sectionTitle}>When</p>
          <div className="space-y-1.5">
            {WHEN_OPTIONS.map((w) => (
              <div key={w.id} className={row(draft.when === w.id)}>
                <button
                  onClick={() => setDraft((d) => ({ ...d, when: w.id }))}
                  className="flex flex-1 items-center justify-between px-3 py-2.5 text-left"
                >
                  {w.label} {draft.when === w.id && <Check />}
                </button>
              </div>
            ))}
          </div>

          <p className={sectionTitle}>Price</p>
          <div className={row(draft.freeOnly)}>
            <button
              onClick={() => setDraft((d) => ({ ...d, freeOnly: !d.freeOnly }))}
              className="flex flex-1 items-center justify-between px-3 py-2.5 text-left"
            >
              Free events only {draft.freeOnly && <Check />}
            </button>
          </div>
        </div>

        <div className="px-5 pt-4">
          <button
            onClick={apply}
            className={`w-full rounded-full px-5 py-3.5 text-sm font-bold ${t.primaryBtn}`}
          >
            Show events
          </button>
        </div>
      </motion.div>
    </>
  );
}

export default function FilterSheet(props: FilterSheetProps) {
  return (
    <AnimatePresence>
      {props.open && <SheetBody {...props} />}
    </AnimatePresence>
  );
}
