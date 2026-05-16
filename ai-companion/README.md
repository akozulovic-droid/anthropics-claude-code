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

**Phase 4 complete:** extra image generation with character-consistency
prompting, atomic server-side monthly credit accounting (Free 3 / Pro 20)
with automatic period reset and credit refund on failure, moderation +
rate limiting, an upgrade message when credits run out, and an owner-only
gallery (main + generated images, with dates).

**Phase 5 complete:** Stripe Pro subscription — Checkout, Customer Portal,
signature-verified webhooks (subscription created/updated/deleted, payment
failed) updating plan + credits via a service-role client, cancellation
that keeps Pro until period end then reverts to Free, plus billing and
account settings pages.

**Phase 6 complete:** security headers + `poweredByHeader` off, auth
rate limiting (brute-force brake on login/signup), and polished
error / not-found / loading states.

All six MVP phases are implemented.

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
   - `supabase/migrations/0003_credits.sql` — atomic credit functions
     (`sync_image_credits`, `consume_image_credit`, `refund_image_credit`)
     with automatic monthly reset.
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

### 3. Stripe (optional for testing)

The app runs without Stripe (billing UI shows a "not configured" notice).
To enable subscriptions:

1. Create a **recurring Price** for the Pro plan in the Stripe Dashboard;
   put its id in `STRIPE_PRICE_ID`.
2. Set `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
3. Enable the **Customer Portal** in the Stripe Dashboard
   (Settings → Billing → Customer portal).
4. Forward webhooks locally:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   Put the printed signing secret in `STRIPE_WEBHOOK_SECRET`.
5. `SUPABASE_SERVICE_ROLE_KEY` must be set — the webhook updates the
   database with no user session.

### 4. AI image generation (optional for testing)

Set `OPENAI_API_KEY` to generate real portraits via the OpenAI Images API.
**If left unset**, the app generates a deterministic local SVG placeholder so
the entire creation flow still works without a paid key.

## Manual configuration checklist

- [ ] `.env.local` filled with Supabase URL + anon key
- [ ] `0001` → `0002` → `0003` migrations run in order in Supabase SQL editor
- [ ] `companion-images` bucket exists and is **private** (created by 0002)
- [ ] Email confirmation enabled in Supabase
- [ ] `http://localhost:3000/auth/callback` added to Supabase redirect URLs
- [ ] (Optional) `OPENAI_API_KEY` set for real image generation
- [ ] (Optional) Stripe: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`,
      `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, Customer Portal
      enabled

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

## How to test Phase 4 locally

1. **Generate** — in the "Generate an image" panel, enter a scene and
   submit. The new image appears in the gallery (real or placeholder) and
   the credit count drops by one.
2. **Credit enforcement** — generate until credits hit 0 (Free = 3). The
   panel switches to an upgrade message; the API returns HTTP 402 and
   refuses further generation (enforced server-side, not in the UI).
3. **Refund on failure** — if generation fails, the credit is returned
   (the count does not drop).
4. **Monthly reset** — set a row's `credits_reset_date` to the past in
   Supabase, reload the dashboard; `image_credits_used_this_month` resets
   to 0 and the date moves to the start of next month.
5. **Gallery ownership** — images are listed newest-first with dates and a
   "Main" badge on the original; they load via short-lived signed URLs and
   RLS keeps them private to the owner.
6. **Moderation** — a disallowed prompt is rejected with no credit spent.

## How to test Phase 5 locally

1. **Billing page** — `/dashboard/billing` shows the current plan. Without
   Stripe env it shows a "not configured" notice.
2. **Upgrade** — with Stripe + `stripe listen` running, click "Upgrade to
   Pro", complete Checkout with test card `4242 4242 4242 4242`.
3. **Plan flips to Pro** — the webhook sets `plan=pro` and
   `monthly_image_limit=20`; the dashboard credit card and billing page
   update (refresh after a moment).
4. **Customer Portal** — "Manage subscription" opens the Stripe portal;
   cancel there.
5. **Cancellation** — after canceling, you keep Pro until the period end;
   when Stripe sends `customer.subscription.deleted`, plan reverts to Free
   (3 credits). Use `stripe trigger customer.subscription.deleted` to test.
6. **Payment failed** — `stripe trigger invoice.payment_failed` sets
   `subscription_status=past_due`.
7. **Security** — POST to `/api/stripe/webhook` without a valid signature
   returns HTTP 400.
8. **Settings** — `/dashboard/settings` shows email, plan, and billing
   link.

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
      api/images/route.ts        # image gen (credits + moderation + rate)
      api/stripe/webhook/route.ts# signature-verified Stripe webhook
      dashboard/                 # protected (page, layout, actions.ts)
        billing/                 # plan, checkout, portal (page + actions)
        settings/                # account settings
      terms|privacy|ai-disclaimer/
    components/
      dashboard/                 # create form, profile, chat, generator, gallery
      ui|auth|legal|site-footer
    lib/
      supabase/                  # client / server / admin / proxy / config
      ai/                        # prompt / moderation / image / chat
      companion/options.ts       # allowed params + strict server parsing
      stripe.ts credits.ts rate-limit.ts storage.ts validation.ts types.ts
  supabase/migrations/
    0001_profiles.sql
    0002_companion.sql
    0003_credits.sql
  .env.example
```

## Security

- **Route protection** in `proxy.ts` (Next 16 proxy) using
  `supabase.auth.getUser()` (revalidated, not the spoofable cookie), with a
  server-side session re-check in the dashboard layout (defense in depth).
- **Row Level Security** on every table — users can only read/write their
  own rows. The companion is created only via an atomic SECURITY DEFINER
  function; image credits are debited only via SECURITY DEFINER functions
  keyed to `auth.uid()` (the frontend count is display-only).
- **Storage** is a private bucket scoped to `<user-id>/…`; images are
  served via short-lived signed URLs.
- **Server-trust**: all validation, one-time-creation checks, credit
  accounting, and moderation run server-side. The service-role key is used
  **only** in the signature-verified Stripe webhook.
- **Moderation** (deterministic blocklist + optional provider check) gates
  companion creation, gallery prompts, and chat input. Prompts force an
  adult, non-explicit, original fictional character.
- **Abuse brakes**: in-memory rate limits on chat, image generation, and
  auth (login/signup).
- **Hardening**: security headers, `X-Powered-By` removed, secrets only in
  env vars, AI disclaimer surfaced throughout.

## Production notes & assumptions

- App lives in `ai-companion/` (the repo already contained other content).
- Without `OPENAI_API_KEY` the app uses a local placeholder image and a
  labelled demo chat reply, so every flow is testable without paid keys.
- Image identity consistency is text-prompt only (no image reference) —
  an accepted MVP limitation.
- Rate limiting is per-process in-memory; use Upstash/Redis when scaling
  to multiple instances.
- Legal pages (`/terms`, `/privacy`, `/ai-disclaimer`) are placeholders —
  replace with professionally reviewed copy before launch.
- 18+ only: companions are fictional adult characters; the app blocks
  minors, real-person/celebrity likenesses, and explicit/non-consensual
  content.
