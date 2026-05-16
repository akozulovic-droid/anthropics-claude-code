---
description: Deploy the current project to Vercel
argument-hint: [--prod] [--env <name>]
allowed-tools: Bash(vercel:*), Bash(npx vercel:*)
---

Deploy the current project to Vercel.

If MCP tools from the `vercel` server are available, prefer them. Otherwise, fall back to the `vercel` CLI.

## Steps

1. **Check prerequisites**: Verify the project has a `vercel.json` or is a recognized framework (Next.js, Vite, Create React App, etc.). If not linked yet, run `vercel link` first and explain what it does.

2. **Determine target environment**:
   - If `--prod` argument is provided, deploy to production: `vercel --prod`
   - Otherwise, deploy a preview: `vercel`

3. **Run the deployment** and stream the output to the user.

4. **Report results**:
   - On success: show the deployment URL and note whether it's a preview or production deployment.
   - On failure: analyze the build output, identify the root cause (missing env vars, build errors, framework misconfiguration), and suggest concrete fixes.

## Notes

- Never expose secret values when displaying environment variable names.
- If the user hasn't installed the Vercel CLI, suggest: `npm install -g vercel` and authenticate with `vercel login`.
- For monorepos, check for a `vercel.json` `rootDirectory` setting or ask which package to deploy.
