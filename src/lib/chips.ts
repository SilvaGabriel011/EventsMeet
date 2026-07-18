import { CATEGORIES, WHEN_OPTIONS, WhenFilter } from "./types";

export type ChipKind = "cat" | "when" | "free";

export interface ChipDef {
  id: string;
  label: string;
  kind: ChipKind;
  value: string;
}

/**
 * Every filter option as a single flat, alphabetical list for the carousel.
 * The defaults ("All" categories, "Any time") are not chips — they're the
 * state you return to by toggling the active chip off.
 */
export const ALL_CHIPS: ChipDef[] = [
  ...CATEGORIES.map((c) => ({ id: `cat:${c}`, label: c, kind: "cat" as const, value: c })),
  ...WHEN_OPTIONS.filter((w) => w.id !== "any").map((w) => ({
    id: `when:${w.id}`,
    label: w.label,
    kind: "when" as const,
    value: w.id,
  })),
  { id: "free", label: "Free only", kind: "free" as const, value: "free" },
].sort((a, b) => a.label.localeCompare(b.label));

export function chipById(id: string): ChipDef | undefined {
  return ALL_CHIPS.find((c) => c.id === id);
}

export function isChipActive(
  chip: ChipDef,
  filter: string,
  when: WhenFilter,
  freeOnly: boolean
): boolean {
  if (chip.kind === "cat") return filter === chip.value;
  if (chip.kind === "when") return when === chip.value;
  return freeOnly;
}
