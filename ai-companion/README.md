# Aura — AI Companion (MVP)

A web app where an adult (18+) user creates one fictional AI companion, chats
with her, and generates images. Built with Next.js 16, Supabase, Stripe and an
AI provider.

> **Safety:** Companions are fictional, adult AI characters. The app must not
> generate minors, real-person lookalikes, celebrities, or explicit /
> non-consensual content. See `/ai-disclaimer`.

## Status

**Phase 1 complete:** project setup, Supabase auth, landing page, signup,
email confirmation → login redirect, protected dashboard, automatic Free-plan
provisioning, legal placeholder pages.

**Phase 2 complete:** full database schema (companion / images / chat /
subscriptions), private Supabase Storage bucket, safety moderation, backend
prompt generation, main image generation, atomic one-time companion creation
(enforced in DB + UI), and the dashboard creation form + permanent profile
display.

**Phase 3 complete:** persisted chat with the companion. Safety-guarded
system prompt (never claims to be real, discourages emotional dependency),
context-aware replies (recent history sent to the model), input moderation,
in-memory per-user rate limiting, and a polished chat UI with history,
optimistic send, typing indicator, and empty/error states.

Phases 4–6 (extra image generation, Stripe, polish) are scaffolded as
dashboard placeholders.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
Shadcn-style UI · Supabase (Auth/DB/Storage) · Stripe · OpenAI.

> Next.js 16 note: `middleware` is renamed to `proxy` (`src/proxy.ts`), and
> `cookies()` / `headers()` / `searchParams` are async. The code follows the
> v16 conventions.

## Prerequisites

- Node.js 20.9+ (uses Node 22 here)
- A free [Supabase](https://supabase.com) project

## Setup

```bash
cd ai-companion
npm install
cp .env.example .env.local
```

### 1. Configure Supabase

1. Create a project at supabase.com.
2. **Project Settings → API**: copy the Project URL and `anon` public key
   into `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Also copy the `service_role` key into
   `SUPABASE_SERVICE_ROLE_KEY` (needed in later phases).
3. **SQL Editor**: run the migrations **in order**:
   - `supabase/migrations/0001_profiles.sql` — `profiles` table, signup
     trigger (every new user → **Free** plan), RLS.
   - `supabase/migrations/0002_companion.sql` — `ai_girls`, `images`,
     `chat_messages`, `subscriptions` tables, RLS, the atomic
     `create_ai_girl()` function, and the private `companion-images`
     Storage bucket + storage policies.
4. **Authentication → Providers → Email**: keep "Confirm email" enabled.
5. **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: add `http://localhost:3000/auth/callback`
6. Set `NEXT_PUBLIC_APP_URL=http://localhost:3000` in `.env.local`.

### 2. Run

```bash
npm run dev
```

Open http://localhost:3000.

### 3. AI image generation (optional for testing)

Set `OPENAI_API_KEY` to generate real portraits via the OpenAI Images API.
**If left unset**, the app generates a deterministic local SVG placeholder so
the entire creation flow still works without a paid key.

## Manual configuration checklist

- [ ] `.env.local` filled with Supabase URL + anon key
- [ ] `0001_profiles.sql` then `0002_companion.sql` run in Supabase SQL editor
- [ ] `companion-images` bucket exists and is **private** (created by 0002)
- [ ] Email confirmation enabled in Supabase
- [ ] `http://localhost:3000/auth/callback` added to Supabase redirect URLs
- [ ] (Optional) `OPENAI_API_KEY` set for real image generation

## How to test Phase 1 locally

1. **Landing page** — visit `/`. Works even before Supabase is configured.
2. **Sign up** — go to `/signup`, enter email + password, tick the 18+ box.
   You should see "Check your inbox…". (Without the 18+ box or with a short
   password you get a backend validation error.)
3. **Email confirmation** — open the email, click the link. You are redirected
   to `/login?confirmed=1` with a success toast (you are intentionally signed
   out so you must log in).
4. **Login** — log in at `/login`. You land on `/dashboard`.
5. **Free plan** — the dashboard shows plan **free** and **3** image credits;
   confirm a `profiles` row exists in Supabase with `plan = 'free'`.
6. **Route protection** — open `/dashboard` in a private window → redirected
   to `/login`. While logged in, visiting `/login` → redirected to
   `/dashboard`.
7. **Logout** — click "Log out"; you return to `/login`.
8. **Legal pages** — `/terms`, `/privacy`, `/ai-disclaimer` render.

## How to test Phase 2 locally

1. **Creation form** — on `/dashboard` with no companion, the form shows
   with name, age (18+ only), and the styling selects.
2. **Moderation** — try name `teen girl` or `celebrity lookalike` → blocked
   with a safety message (no image generated, nothing saved).
3. **Create** — fill valid fields, submit. A loading overlay shows while the
   image generates (~20s with a real key; instant placeholder otherwise).
4. **Permanent display** — the page now shows the fixed main image area and
   the read-only profile. The form is gone.
5. **One-time enforcement** — reload, navigate away/back: still the profile,
   never the form. The `ai_girls` row has `UNIQUE(user_id)`, the profile has
   `ai_girl_created = true`, and `create_ai_girl()` rejects a second attempt
   server-side.
6. **Ownership** — confirm the object exists under
   `companion-images/<your-user-id>/main.*` and the bucket is private (the
   image renders via a short-lived signed URL).

## How to test Phase 3 locally

1. **Chat** — with a companion created, the chat panel shows on
   `/dashboard`. Send a message; the reply appears (real LLM if
   `OPENAI_API_KEY` is set, otherwise a clearly-labelled demo reply).
2. **History persists** — reload the page; the conversation is still there
   (stored in `chat_messages`, owner-only via RLS).
3. **Context** — the last 20 turns are sent to the model, so follow-up
   questions keep context.
4. **Moderation** — send disallowed content (e.g. minor/explicit terms);
   the request is rejected with a safety message and nothing is saved.
5. **Rate limiting** — sending 20+ messages within 60s returns a
   "too fast" error (HTTP 429).
6. **Safety persona** — ask "are you a real person?"; the companion
   clarifies it is a fictional AI character.

## Project structure

```
ai-companion/
  src/
    proxy.ts                     # Next 16 proxy (route protection)
    app/
      page.tsx                   # landing
      (auth)/
        actions.ts               # signUp / signIn / signOut server actions
        layout.tsx
        login/page.tsx
        signup/page.tsx
      auth/callback/route.ts     # email-confirmation handler -> /login
      api/chat/route.ts          # chat endpoint (rate-limited, moderated)
      dashboard/                 # protected (page, layout, actions.ts)
      terms|privacy|ai-disclaimer/
    components/
      dashboard/                 # create form, profile, chat panel
      ui|auth|legal|site-footer
    lib/
      supabase/                  # client / server / proxy / config
      ai/                        # prompt / moderation / image / chat
      companion/options.ts       # allowed params + strict server parsing
      rate-limit.ts storage.ts validation.ts types.ts
  supabase/migrations/
    0001_profiles.sql
    0002_companion.sql
  .env.example
```
