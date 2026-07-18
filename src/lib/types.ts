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

export const CATEGORY_GRADIENTS: Record<EventCategory, string> = {
  Music: "from-fuchsia-600 via-purple-700 to-indigo-900",
  Nightlife: "from-violet-600 via-indigo-800 to-slate-950",
  "Food & Drink": "from-orange-500 via-rose-600 to-purple-900",
  "Arts & Culture": "from-teal-500 via-cyan-700 to-blue-950",
  Comedy: "from-amber-400 via-orange-600 to-rose-900",
  "Sports & Fitness": "from-emerald-500 via-teal-700 to-cyan-950",
  Markets: "from-lime-500 via-emerald-700 to-teal-950",
  Family: "from-sky-400 via-blue-600 to-indigo-900",
};
