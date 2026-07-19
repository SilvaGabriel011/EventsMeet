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

