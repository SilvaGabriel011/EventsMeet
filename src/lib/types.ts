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
}

export interface EventsResponse {
  events: PerthEvent[];
  live: boolean;
  note?: string;
}

