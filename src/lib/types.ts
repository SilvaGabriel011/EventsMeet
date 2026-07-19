export type EventCategory =
  | "Music"
  | "Nightlife"
  | "Food & Drink"
  | "Arts & Culture"
  | "Comedy"
  | "Sports & Fitness"
  | "Markets"
  | "Family";

export const CATEGORIES: EventCategory[] = [
  "Music",
  "Nightlife",
  "Food & Drink",
  "Arts & Culture",
  "Comedy",
  "Sports & Fitness",
  "Markets",
  "Family",
];

export interface PerthEvent {
  id: string;
  title: string;
  category: EventCategory;
  date: string;
  /** ISO 8601 start date-time (Perth time), or null when the exact date is unknown. */
  start: string | null;
  venue: string;
  price: string;
  description: string;
  url: string;
  emoji: string;
  /** og:image scraped from the event page, or null to fall back to emoji art. */
  image: string | null;
}

export type WhenFilter = "any" | "today" | "weekend" | "week" | "custom";

/** Preset options — "custom" is handled by the date-range picker. */
export const WHEN_OPTIONS: { id: Exclude<WhenFilter, "custom">; label: string }[] = [
  { id: "any", label: "Any time" },
  { id: "today", label: "Today" },
  { id: "weekend", label: "Weekend" },
  { id: "week", label: "Next 7 days" },
];

/** "any", "free", or a maximum ticket price in dollars. */
export type PriceFilter = "any" | "free" | number;

export const PRICE_OPTIONS: { id: PriceFilter; label: string }[] = [
  { id: "any", label: "Any price" },
  { id: "free", label: "Free only" },
  { id: 25, label: "Under $25" },
  { id: 50, label: "Under $50" },
  { id: 100, label: "Under $100" },
];

export type CategoryFilter = "All" | EventCategory;

export interface FilterState {
  filter: CategoryFilter;
  when: WhenFilter;
  /** YYYY-MM-DD bounds, only meaningful when `when` is "custom". */
  dateFrom: string | null;
  dateTo: string | null;
  price: PriceFilter;
}

/** Solid accent per category — used for calendar pills and legends across all themes. */
export const CATEGORY_COLORS: Record<EventCategory, string> = {
  Music: "bg-fuchsia-500",
  Nightlife: "bg-violet-500",
  "Food & Drink": "bg-orange-500",
  "Arts & Culture": "bg-cyan-500",
  Comedy: "bg-amber-400",
  "Sports & Fitness": "bg-emerald-500",
  Markets: "bg-lime-500",
  Family: "bg-sky-500",
};

/** Compact swipe-history summary sent to the AI to personalize the search. */
export interface TasteProfile {
  liked: string[];
  skipped: string[];
  topCategories: string[];
}

export interface EventsResponse {
  events: PerthEvent[];
  live: boolean;
  note?: string;
}

