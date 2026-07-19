import { FilterState, PerthEvent } from "./types";

const PERTH_OFFSET_MS = 8 * 3600_000;
const perthDayIndex = (ms: number) => Math.floor((ms + PERTH_OFFSET_MS) / 86_400_000);

/**
 * Client-side mirror of the server's filter rules, so views like the
 * calendar can apply the active filters to events they already hold
 * (e.g. saved events that were fetched under different filters).
 */
export function eventMatchesFilters(e: PerthEvent, f: FilterState): boolean {
  if (f.filter !== "All" && e.category !== f.filter) return false;

  const free = e.price.toLowerCase().includes("free");
  if (f.price === "free" && !free) return false;
  if (typeof f.price === "number" && !free) {
    const m = e.price.match(/(\d+(?:\.\d+)?)/);
    if (!m || parseFloat(m[1]) > f.price) return false;
  }

  if (f.when === "any") return true;
  if (!e.start) return false;
  const start = Date.parse(e.start);
  const now = Date.now();
  const notPast = start >= now - 3600_000;

  if (f.when === "today") return notPast && perthDayIndex(start) === perthDayIndex(now);
  if (f.when === "week") return notPast && perthDayIndex(start) <= perthDayIndex(now) + 7;
  if (f.when === "weekend") {
    if (!notPast || perthDayIndex(start) > perthDayIndex(now) + 7) return false;
    const dow = new Date(start + PERTH_OFFSET_MS).getUTCDay();
    return dow === 5 || dow === 6 || dow === 0;
  }
  if (f.when === "custom" && f.dateFrom && f.dateTo) {
    return (
      start >= Date.parse(`${f.dateFrom}T00:00:00+08:00`) &&
      start <= Date.parse(`${f.dateTo}T23:59:59+08:00`)
    );
  }
  return true;
}
