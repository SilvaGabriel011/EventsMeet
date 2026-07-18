import { PerthEvent } from "./types";

/**
 * Next occurrence of a weekday at a given hour, Perth time (UTC+8, no DST),
 * so sample events always carry a valid future start for calendar export.
 * Weekday: 0 = Sunday … 6 = Saturday.
 */
function upcoming(weekday: number, hour: number, minute = 0): string {
  const now = new Date();
  const perthNow = new Date(now.getTime() + 8 * 3600_000);
  const daysAhead = ((weekday - perthNow.getUTCDay() + 7) % 7) || 7;
  const d = new Date(
    Date.UTC(
      perthNow.getUTCFullYear(),
      perthNow.getUTCMonth(),
      perthNow.getUTCDate() + daysAhead,
      hour - 8,
      minute
    )
  );
  return d.toISOString();
}

// Shown when no OPENAI_API_KEY is configured (or the API call fails), so the
// app is fully usable out of the box. Details are representative, not live.
export const SAMPLE_EVENTS: PerthEvent[] = [
  {
    id: "sample-1",
    title: "Fremantle Markets Weekend",
    category: "Markets",
    date: "Every Fri–Sun, 9am–6pm",
    start: upcoming(5, 9),
    venue: "Fremantle Markets, South Terrace",
    price: "Free entry",
    description:
      "150+ stalls of local produce, street food and buskers inside a heritage-listed hall. A Freo institution since 1897.",
    url: "https://www.fremantlemarkets.com.au/",
    emoji: "🧺",
  },
  {
    id: "sample-2",
    title: "Live Jazz at The Ellington",
    category: "Music",
    date: "Tonight, 7:30pm",
    start: upcoming(4, 19, 30),
    venue: "The Ellington Jazz Club, Northbridge",
    price: "From $25",
    description:
      "Perth's dedicated jazz club serves up intimate live sets with dinner and cocktails seven nights a week.",
    url: "https://www.ellingtonjazz.com.au/",
    emoji: "🎷",
  },
  {
    id: "sample-3",
    title: "Twilight Hawkers Market",
    category: "Food & Drink",
    date: "Friday, 4:30pm–9pm",
    start: upcoming(5, 16, 30),
    venue: "Forrest Place, Perth CBD",
    price: "Free entry",
    description:
      "Street food from every corner of the globe with live music in the heart of the city. Perth's favourite Friday ritual.",
    url: "https://twilighthawkersmarket.com/",
    emoji: "🌮",
  },
  {
    id: "sample-4",
    title: "Kings Park Guided Bushland Walk",
    category: "Family",
    date: "Daily, 10am & 2pm",
    start: upcoming(6, 10),
    venue: "Kings Park & Botanic Garden",
    price: "Free",
    description:
      "Volunteer-guided walks through one of the world's largest inner-city parks, with skyline views over the Swan River.",
    url: "https://www.bgpa.wa.gov.au/kings-park",
    emoji: "🌿",
  },
  {
    id: "sample-5",
    title: "Comedy Lounge Thursday Showcase",
    category: "Comedy",
    date: "Thursday, 8pm",
    start: upcoming(4, 20),
    venue: "Comedy Lounge, Perth CBD",
    price: "From $20",
    description:
      "A rotating line-up of Australia's touring headliners and Perth's sharpest local acts in a dedicated comedy room.",
    url: "https://comedylounge.com.au/",
    emoji: "🎤",
  },
  {
    id: "sample-6",
    title: "Art Gallery of WA — Free Exhibitions",
    category: "Arts & Culture",
    date: "Wed–Mon, 10am–5pm",
    start: upcoming(3, 10),
    venue: "AGWA, Perth Cultural Centre",
    price: "Free",
    description:
      "Contemporary Australian and international art across six floors, topped by a rooftop sculpture walk with city views.",
    url: "https://artgallery.wa.gov.au/",
    emoji: "🖼️",
  },
  {
    id: "sample-7",
    title: "Sunset Cycle: South Perth Foreshore",
    category: "Sports & Fitness",
    date: "Saturday, 5pm",
    start: upcoming(6, 17),
    venue: "Sir James Mitchell Park, South Perth",
    price: "Free / BYO bike",
    description:
      "An easy social ride along the Swan River with the best golden-hour view of the Perth skyline. All levels welcome.",
    url: "https://www.perth.wa.gov.au/",
    emoji: "🚴",
  },
  {
    id: "sample-8",
    title: "Northbridge Night Out",
    category: "Nightlife",
    date: "Friday & Saturday, from 8pm",
    start: upcoming(5, 20),
    venue: "William St & James St, Northbridge",
    price: "Varies",
    description:
      "Perth's nightlife quarter: rooftop bars, small bars hidden down laneways and live music rooms all within a few blocks.",
    url: "https://www.visitperth.com/",
    emoji: "🍸",
  },
];
