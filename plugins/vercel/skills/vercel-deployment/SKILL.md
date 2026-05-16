---
name: vercel-deployment
description: |
  Use this skill when the user is working on deploying a project to Vercel, configuring vercel.json, setting up environment variables for Vercel, or asks about Vercel-specific features like Edge Functions, Serverless Functions, ISR, or preview deployments.

  Trigger phrases: "deploy to vercel", "vercel deploy", "vercel.json", "vercel environment variables", "preview deployment", "vercel edge function", "vercel serverless", "ISR on vercel", "vercel domain", "vercel project settings"
version: 1.0.0
---

# Vercel Deployment Skill

You have deep knowledge of the Vercel platform. Apply this expertise when helping users deploy and configure their projects.

## Key Concepts

### Project Linking
Before deploying, a project must be linked: `vercel link`. This creates `.vercel/project.json` with the project and org IDs. Add `.vercel` to `.gitignore`.

### Deployment Targets
- **Preview** (default): `vercel` — creates a unique URL, great for testing PRs.
- **Production**: `vercel --prod` — deploys to the production domain.

### `vercel.json` Configuration
Common fields:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm ci",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "api/*.js": { "maxDuration": 30 }
  },
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [{ "source": "/(.*)", "headers": [{ "key": "X-Frame-Options", "value": "DENY" }] }]
}
```

### Environment Variables
- Set per-environment (production / preview / development).
- Pull to local: `vercel env pull .env.local`
- System env vars (always available): `VERCEL`, `VERCEL_ENV`, `VERCEL_URL`, `VERCEL_GIT_COMMIT_SHA`.

### Serverless vs Edge Functions
| | Serverless | Edge |
|---|---|---|
| Runtime | Node.js | V8 / Web APIs only |
| Cold start | ~100–500 ms | ~0 ms |
| Execution limit | Up to 300 s | Up to 30 s |
| File path | `api/` | `api/` with `export const config = { runtime: 'edge' }` |
| Use for | DB queries, heavy compute | Auth, redirects, geo |

### Incremental Static Regeneration (ISR)
Next.js only. Add `revalidate` to `getStaticProps` or use the `fetch` cache in the App Router. Pages are regenerated in the background after the stale period.

### Domains
- Add a custom domain: Vercel dashboard → Project → Domains, or `vercel domains add example.com`.
- DNS: point an A record to `76.76.21.21` or a CNAME to `cname.vercel-dns.com`.
- SSL is automatic.

## Guidance

When helping with Vercel:
1. Always check if the project is already linked before suggesting deployment commands.
2. Prefer `vercel env pull` over manually creating `.env.local` — it ensures variable names match exactly.
3. For monorepos, set `rootDirectory` in `vercel.json` or in the Vercel dashboard to point to the package being deployed.
4. Remind users that environment variables added after a deployment require a redeploy to take effect.
5. For Next.js, recommend keeping `next.config.js` minimal — Vercel auto-detects most settings.
