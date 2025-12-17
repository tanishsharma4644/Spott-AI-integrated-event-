<div align="center">
	<h1>Spott — Discover, Create, and Attend Events</h1>
	<p>AI‑assisted event creation, seamless registrations with QR tickets, and a fast explore experience — built with Next.js, Clerk, and Convex.</p>
</div>

---

## Overview

Spott is an end‑to‑end events platform:

- Create events with an AI assistant powered by Google Gemini.
- Authenticate with Clerk (email/passkeys/social) and sync users into Convex.
- Manage events, capacity, and ticketing (free or paid indicator) in Convex.
- Attendees register to get QR tickets; organizers can scan and check‑in.
- Explore events by category and location (city/state), with featured and popular sections.

Production‑ready foundations: App Router, React 19, Tailwind CSS v4, shadcn/ui, and a real‑time Convex backend.

## Features

- AI Event Creator using Gemini 2.0 Flash (`/api/generate-event`).
- Auth with Clerk (sign‑in, sign‑up, and protected routes via middleware).
- Convex models for `users`, `events`, and `registrations` with indexes.
- QR ticket generation and organizer check‑in scanner (camera‑based).
- Explore: featured, popular, by category, and by location (India‑focused).
- Unsplash image picker for attractive event cover images.
- Theming, responsive UI, and modern UX built with shadcn/ui + Tailwind.

## Tech Stack

- Next.js 16 (App Router) + React 19
- Tailwind CSS v4 + shadcn/ui + Radix Primitives
- Clerk (Next.js SDK) for auth & sessions
- Convex for realtime database, queries, and mutations
- Google Generative AI (Gemini) for AI event drafts
- Unsplash API for cover images

## Prerequisites

- Node.js 18.17+ (Node 20 recommended)
- npm (or yarn/pnpm/bun)
- Accounts/keys:
	- Clerk application (Frontend/API keys)
	- Convex project
	- Google AI Studio API key (Gemini)
	- Unsplash developer Access Key (public)

## Environment Variables

Create a `.env.local` in the project root with:

```env
# Clerk (Next.js)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_************************
CLERK_SECRET_KEY=sk_************************

# Convex (Next.js client)
NEXT_PUBLIC_CONVEX_URL=https://xxxxxxxx.convex.cloud

# Google Generative AI (server route)
GEMINI_API_KEY=************************

# Unsplash (public key is fine client-side)
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=************************
```

Additionally, configure this on the Convex project (Convex Dashboard → Settings → Environment Variables):

- `CLERK_JWT_ISSUER_DOMAIN` — the Clerk Issuer URL from your Clerk JWT template (used by Convex auth, see `convex/auth.config.js`).

## Quick Start (Local)

1) Install dependencies

```bash
npm install
```

2) Start Convex dev (gets you a dev URL for `NEXT_PUBLIC_CONVEX_URL`)

```bash
npx convex dev
```

Copy the printed Convex URL into `.env.local` as `NEXT_PUBLIC_CONVEX_URL` if not set yet.

3) Run the Next.js app

```bash
npm run dev
```

Visit http://localhost:3000 and sign in via Clerk.

## Seeding Sample Data (Events)

This repo includes a rich seed of India‑based sample events. To seed:

1) Open the Convex Dashboard for your project.
2) Go to Functions → `seed:run` → Run.

This inserts a default organizer and multiple upcoming events with realistic data. You can also clear with `seed:clear` in the same panel.

## Project Structure

```
app/                  # App Router pages and routes
	(auth)/             # Clerk sign-in and sign-up pages
	(main)/             # Authenticated app areas (create, my-events, tickets)
	(public)/           # Public explore and event details pages
	api/generate-event/ # AI event generation (Gemini)
components/           # UI, layout, and feature components (shadcn/ui)
convex/               # Convex schema, queries, mutations, and auth config
hooks/                # Custom hooks (Convex and onboarding helpers)
lib/                  # Utilities (location parsing, helpers)
proxy.js              # Clerk middleware protecting routes
```

Key files:

- `convex/schema.js` — tables and indexes for users, events, registrations
- `convex/events.js` — create, list, delete events
- `convex/registrations.js` — register, cancel, list, and check‑in with QR
- `convex/users.js` — sync Clerk users into Convex with onboarding fields
- `app/(main)/create-event/_components/ai-event-creator.jsx` — AI assist
- `app/api/generate-event/route.js` — Gemini 2.0 Flash integration
- `components/unsplash-image-picker.jsx` — cover image search via Unsplash
- `app/ConvexClientProvider.jsx` — Convex client configured via env URL
- `convex/auth.config.js` — Clerk issuer domain for Convex auth

## Protected Routes

Route protection is handled by Clerk middleware in `proxy.js`. The following routes require authentication:

- `/my-events/*`
- `/create-event/*`
- `/my-tickets/*`

Unauthenticated users are redirected to Clerk sign‑in.

## Available Scripts

```bash
# Start Next.js in dev
npm run dev

# Build for production
npm run build

# Start the production build
npm run start

# Lint
npm run lint
```

Convex useful commands (run separately):

```bash
# Start Convex local dev (prints the Convex URL)
npx convex dev

# Deploy Convex backend to the cloud
npx convex deploy
```

## Deployment

Recommended: Deploy the Next.js app on Vercel and Convex functions on Convex Cloud.

1) Convex
	 - Run `npx convex deploy`.
	 - In Convex Dashboard → Settings → Environment Variables, set `CLERK_JWT_ISSUER_DOMAIN` (and any other server‑side secrets you add later).

2) Vercel
	 - Import this repo and set these environment variables:
		 - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
		 - `CLERK_SECRET_KEY`
		 - `NEXT_PUBLIC_CONVEX_URL` (use the Convex production URL)
		 - `GEMINI_API_KEY`
		 - `NEXT_PUBLIC_UNSPLASH_ACCESS_KEY`
	 - Set the Image Optimization domain for `images.unsplash.com` (already configured in `next.config.mjs`).

## Troubleshooting

- Clerk redirect loop or 401 on protected routes
	- Ensure `proxy.js` is present at the project root and Clerk keys are in `.env.local`.

- Missing Convex URL
	- Run `npx convex dev` and copy the printed URL to `NEXT_PUBLIC_CONVEX_URL`.

- Gemini errors (429 / quota / invalid key)
	- Set `GEMINI_API_KEY` and check the Google AI Studio quota. The route includes a lightweight local fallback for 429s.

- Unsplash images not loading
	- Set `NEXT_PUBLIC_UNSPLASH_ACCESS_KEY` and confirm `images.unsplash.com` is allowed in `next.config.mjs`.

## License

No explicit license is included. If you plan to open‑source, consider adding an OSI‑approved license (e.g., MIT) and a `LICENSE` file.

## Contributing

Issues and PRs are welcome. Please open an issue to discuss significant changes before submitting a PR.

---

Built with ❤️ using Next.js, Clerk, Convex, and shadcn/ui.
