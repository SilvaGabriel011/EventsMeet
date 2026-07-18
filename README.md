# EventsMeet 🔥📍

**Tinder for events in Perth, WA.** Swipe through upcoming events discovered live by AI web search — right to save, left to skip.

## How it works

- The backend (`/api/events`) asks the **OpenAI Responses API with the `web_search` tool** to find real upcoming events in Perth (Fremantle, Northbridge, Swan Valley…) and return them as structured cards: title, date, venue, price, description and a link to the event page.
- The frontend shows them as a **swipeable card stack** (drag or use the buttons). Swipe **right** ❤️ to save an event to *My events*, **left** ✖️ to skip, and use ↩️ to undo.
- Saved events persist in your browser (localStorage) with a direct link to each event page.
- Filter by category (Music, Nightlife, Food & Drink…) — each filter triggers a fresh AI search, cached server-side for 30 minutes.
- "Find more events" asks the AI for new events, excluding ones you've already seen.
- **No API key?** The app still works, showing a built-in set of sample Perth events with a banner explaining how to go live.

## Getting started

```bash
npm install
cp .env.example .env.local   # then paste your OpenAI API key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `OPENAI_API_KEY` | For live events | Your OpenAI API key. The key is only used server-side — it is never exposed to the browser. |
| `OPENAI_MODEL` | No | Model for event search (default `gpt-4.1-mini`). Must support the Responses API `web_search` tool. |

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/) for the swipe gestures
- OpenAI Responses API with web search for live event discovery

## Deploy

Works out of the box on [Vercel](https://vercel.com) — set `OPENAI_API_KEY` in the project's environment variables. The events route sets `maxDuration = 60` since AI web search can take a while.
