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

Phases 2–6 (companion creation, chat, image generation, Stripe, polish) are
scaffolded as dashboard placeholders.

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
3. **SQL Editor**: paste and run `supabase/migrations/0001_profiles.sql`.
   This creates the `profiles` table, the signup trigger that puts every new
   user on the **Free** plan, and Row Level Security policies.
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

## Manual configuration checklist

- [ ] `.env.local` filled with Supabase URL + anon key
- [ ] `0001_profiles.sql` run in Supabase SQL editor
- [ ] Email confirmation enabled in Supabase
- [ ] `http://localhost:3000/auth/callback` added to Supabase redirect URLs

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
      dashboard/                 # protected
      terms|privacy|ai-disclaimer/
    components/                  # UI + auth + legal components
    lib/
      supabase/                  # client / server / proxy / config
      validation.ts
      types.ts
  supabase/migrations/0001_profiles.sql
  .env.example
```
