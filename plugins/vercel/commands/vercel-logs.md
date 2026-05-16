---
description: View logs for a Vercel deployment or project
argument-hint: [deployment-url-or-id] [--follow]
allowed-tools: Bash(vercel:*), Bash(npx vercel:*)
---

Fetch and display logs for a Vercel deployment.

If MCP tools from the `vercel` server are available, prefer them. Otherwise, use the `vercel` CLI.

## Steps

1. **Determine what to inspect**:
   - If `$ARGUMENTS` contains a deployment URL or ID, use it directly.
   - If `--follow` or `-f` is present, tail logs in real time: `vercel logs <deployment> --follow`
   - Otherwise, fetch the latest deployment logs: `vercel logs` (uses the most recent deployment for the linked project).

2. **Run the command** and display the output.

3. **Analyze errors** if the user asks or if the logs contain obvious failures:
   - Look for runtime errors, unhandled promise rejections, missing environment variables, or cold-start timeouts.
   - Summarize the root cause and suggest a fix.

## Notes

- Logs are available for Serverless Functions and Edge Functions; static assets have no runtime logs.
- If the project is not linked, prompt the user to run `vercel link` first.
