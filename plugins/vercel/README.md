# Vercel Plugin

Deploy and manage Vercel projects directly from Claude Code. Integrates with the Vercel CLI and the official Vercel MCP server for deployments, environment variables, logs, and domain management.

## Features

| Component | Name | Description |
|-----------|------|-------------|
| **MCP Server** | `vercel` | Official Vercel MCP server — gives Claude direct access to Vercel's API |
| **Command** | `/vercel:deploy` | Deploy the current project (preview or production) |
| **Command** | `/vercel:env` | List, add, remove, or pull environment variables |
| **Command** | `/vercel:logs` | View logs for a deployment and diagnose errors |
| **Agent** | `vercel-deploy-checker` | Diagnoses deployment failures and configuration issues |
| **Skill** | `vercel-deployment` | Auto-invoked expertise on Vercel config, Edge/Serverless functions, ISR, and domains |

## Requirements

- [Vercel CLI](https://vercel.com/docs/cli): `npm install -g vercel`
- Authenticated Vercel account: `vercel login`
- For MCP server: set the `VERCEL_TOKEN` environment variable (create a token at [vercel.com/account/tokens](https://vercel.com/account/tokens))

## Setup

### 1. Install the Vercel CLI and authenticate

```bash
npm install -g vercel
vercel login
```

### 2. Link your project

Run this once per project:

```bash
vercel link
```

This creates `.vercel/project.json`. Add `.vercel` to your `.gitignore`.

### 3. Configure the MCP server (optional but recommended)

Set your Vercel token so Claude can call the Vercel API directly:

```bash
export VERCEL_TOKEN=your_token_here
```

Or add it to your shell profile (`.zshrc`, `.bashrc`) for persistence.

## Commands

### `/vercel:deploy`

Deploys the current project. Pass `--prod` to deploy to production.

```
/vercel:deploy          # preview deployment
/vercel:deploy --prod   # production deployment
```

### `/vercel:env`

Manages environment variables.

```
/vercel:env list                        # list all variable names
/vercel:env add DATABASE_URL production # add a variable
/vercel:env remove OLD_KEY preview      # remove a variable
/vercel:env pull                        # pull dev vars to .env.local
```

### `/vercel:logs`

Fetches deployment logs.

```
/vercel:logs                          # latest deployment
/vercel:logs https://my-app.vercel.app  # specific deployment
/vercel:logs --follow                   # tail in real time
```

## Automatic Skill Activation

The `vercel-deployment` skill activates automatically when you discuss:

- Deploying to Vercel
- Configuring `vercel.json`
- Edge Functions or Serverless Functions
- Environment variables on Vercel
- Preview deployments or custom domains
- Incremental Static Regeneration (ISR)

## Troubleshooting

If a deployment fails, ask Claude to diagnose it — the `vercel-deploy-checker` agent will investigate the build output, configuration, and environment variables to find the root cause.

Example: *"My Vercel deployment is failing with a build error, can you check what's wrong?"*
