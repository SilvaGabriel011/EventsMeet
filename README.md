# EventsMeet 🔥📍

**Tinder for events in Perth, WA.** Swipe through upcoming events discovered live by AI web search — right to save, left to skip.

## How it works

- The backend (`/api/events`) asks the **OpenAI Responses API with the `web_search` tool** to find real upcoming events in Perth (Fremantle, Northbridge, Swan Valley…) and return them as structured cards: title, date, venue, price, description and a link to the event page.
- The frontend shows them as a **swipeable card stack** (drag or use the buttons). Swipe **right** ❤️ to save an event to *My events*, **left** ✖️ to skip, and use ↩️ to undo.
- Saved events persist in your browser (localStorage) with a direct link to each event page.
- Filter by category (Music, Nightlife, Food & Drink…) — each filter triggers a fresh AI search, cached server-side for 30 minutes.
- "Find more events" asks the AI for new events, excluding ones you've already seen.
- **Apple Calendar integration** 📅 — add a single saved event or all of them at once as an `.ics` download that opens straight in Apple Calendar (also compatible with Google Calendar and Outlook). Events carry real ISO start times from the AI search; events without a confirmed date are marked "Date TBC" and skipped from export.
- **4 switchable designs** 🎨 — Neon Night (dark, vivid), Sunset Coast (light, warm), Minimal Mono (black & white editorial) and Aurora Glass (dark glassmorphism). Pick via the palette button in the header; the choice persists in the browser.
- **Real event photos** 📸 — the server scrapes each event page's `og:image` and shows it full-bleed on the card, Tinder-style, falling back to the emoji artwork when a page has no usable image.
- **Date & price filters** 🗓️ — Any time / Today / Weekend / Next 7 days, plus a Free-only toggle. Filters are pushed into the AI search itself (and applied to the sample events).
- **Taste personalization** ❤️ — your likes and skips build a local taste profile (favourite categories + recent examples) that is fed into the AI prompt, so the deck gets more *you* the more you swipe. Stays in your browser.
- **Installable PWA** 📱 — web app manifest, icons and iOS meta tags: open in Safari on iPhone → Share → "Add to Home Screen" and it runs full-screen like a native app.
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
| `OPENAI_MODEL` | No | Model for event search (default `gpt-5.6-luna`). Must support the Responses API `web_search` tool. |
| `NEXT_PUBLIC_SUPABASE_URL` | For accounts/social | Supabase project URL (Project Settings → API). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | For accounts/social | Supabase anon/public key. Safe for the browser — access is enforced by Row Level Security. |
| `SUPABASE_SERVICE_ROLE_KEY` | For the webcal feed | Supabase service-role key. **Server-side only**; mark as Sensitive in Vercel. |

## Supabase setup (accounts, auto calendar sync, social)

Without Supabase the app runs fully in localStorage-only mode. To enable accounts, cross-device sync, the auto-updating Apple Calendar feed and "who else is going":

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine).
2. **SQL Editor → New query** → paste the contents of [`supabase/schema.sql`](supabase/schema.sql) → **Run**. This creates the tables and Row Level Security policies (safe to re-run).
3. **Authentication → Email Templates → Magic Link**: make sure the template includes the `{{ .Token }}` variable (the 6-digit code the app asks for), e.g. `Your EventsMeet code: {{ .Token }}`.
4. **Project Settings → API**: copy the URL, anon key and service-role key into `.env.local` / Vercel env vars (see table above), then redeploy.

What signing in unlocks:

- **Cross-device saves** — liked events live in Postgres; your local list is merged into the account on first sign-in.
- **🔁 Auto-sync with Apple Calendar** — the saved panel offers a `webcal://` subscription to your personal tokenized feed (`/api/calendar/feed?token=…`); Apple Calendar refreshes it automatically, so saves/removals just show up. The one-off `.ics` download still works for everyone.
- **👥 Also going + matches** — each saved event shows other signed-in users who saved it. Wave 👋 at someone; if they wave back it's a match 🎉 and only then is your contact handle (set in the account sheet) revealed to each other — enforced by RLS, not just UI.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/) for the swipe gestures
- OpenAI Responses API with web search for live event discovery

## Deploy

Works out of the box on [Vercel](https://vercel.com) — set `OPENAI_API_KEY` in the project's environment variables. The events route sets `maxDuration = 60` since AI web search can take a while.
