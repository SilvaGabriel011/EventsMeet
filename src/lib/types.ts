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

export type WhenFilter = "any" | "today" | "weekend" | "week";

export const WHEN_OPTIONS: { id: WhenFilter; label: string }[] = [
  { id: "any", label: "Any time" },
  { id: "today", label: "Today" },
  { id: "weekend", label: "Weekend" },
  { id: "week", label: "Next 7 days" },
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

