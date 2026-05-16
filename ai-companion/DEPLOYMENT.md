# Deployment

The app lives in the `ai-companion/` subfolder of the repo. Recommended host
is **Vercel** (zero-config for Next.js). It deploys and runs even without
OpenAI/Stripe (placeholder image, demo chat, billing shows "not configured"),
so you can get a public preview with only Supabase configured.

## 1. Deploy to Vercel

1. [vercel.com](https://vercel.com) → sign in with GitHub → **Add New… → Project**.
2. Import `akozulovic-droid/anthropics-claude-code`.
3. **Set Root Directory to `ai-companion`** (Edit → select the folder).
   Framework auto-detects as Next.js; no build overrides needed.
4. Add environment variables (see table below).
5. Deploy → you get a public URL.
6. Set `NEXT_PUBLIC_APP_URL` to that URL and **redeploy**.

### Environment variables

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | same page |
| `SUPABASE_SERVICE_ROLE_KEY` | for Stripe | server-only; used by the webhook |
| `NEXT_PUBLIC_APP_URL` | yes | final deployed URL, no trailing slash |
| `OPENAI_API_KEY` | optional | placeholders/demo used if absent |
| `OPENAI_IMAGE_MODEL` / `OPENAI_CHAT_MODEL` | optional | sensible defaults |
| `STRIPE_SECRET_KEY` | for billing | |
| `STRIPE_PRICE_ID` | for billing | recurring Pro price id |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | for billing | |
| `STRIPE_WEBHOOK_SECRET` | for billing | from the Stripe webhook endpoint |

## 2. Wire up the backends

### Supabase
1. SQL editor → run migrations in order: `0001_profiles.sql`,
   `0002_companion.sql`, `0003_credits.sql`.
2. Auth → Providers → Email: keep **Confirm email** enabled.
3. Auth → URL Configuration:
   - Site URL: your deployed URL
   - Redirect URLs: add `https://<your-domain>/auth/callback`
4. Confirm the private `companion-images` bucket exists (created by `0002`).

### Stripe (only if you want paid Pro)
1. Create a recurring **Price** for Pro → put its id in `STRIPE_PRICE_ID`.
2. Developers → **Webhooks → Add endpoint**:
   `https://<your-domain>/api/stripe/webhook`. Subscribe to:
   `checkout.session.completed`, `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`,
   `invoice.payment_failed`.
3. Copy the endpoint's **signing secret** → `STRIPE_WEBHOOK_SECRET`.
4. Settings → Billing → enable the **Customer Portal**.
5. Redeploy after setting/changing env vars.

## 3. Custom domain (optional)

Vercel → Project → **Domains** → add your domain and follow the DNS steps.
Then update `NEXT_PUBLIC_APP_URL` and the Supabase/Stripe URLs to match and
redeploy.

## Operational notes

- Image generation sets `maxDuration = 60`. Vercel Hobby allows up to 60s
  for Node functions; very slow generations may time out — Pro raises the
  ceiling.
- The rate limiter is per-process in-memory. On serverless each instance has
  its own counters — acceptable for an MVP; move to Upstash/Redis before
  serious traffic.
- Replace the placeholder legal pages (`/terms`, `/privacy`,
  `/ai-disclaimer`) with professionally reviewed copy before launch.

## Other hosts

Any Node host works: build with `npm run build`, run with `npm start`
(set the same env vars). Netlify, Render, and Railway all support Next.js;
on those, set the project/base directory to `ai-companion`.
