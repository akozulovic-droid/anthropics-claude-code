---
description: Manage Vercel environment variables for the current project
argument-hint: [list|add|remove|pull] [name] [environment]
allowed-tools: Bash(vercel:*), Bash(npx vercel:*)
---

Manage environment variables for the current Vercel project.

If MCP tools from the `vercel` server are available, prefer them. Otherwise, use the `vercel` CLI.

## Operations

Parse `$ARGUMENTS` to determine intent. If no argument is given, default to listing all variables.

### List variables
```
vercel env ls [environment]
```
Environments: `production`, `preview`, `development`. Show the variable names (never values).

### Add a variable
```
vercel env add <NAME> [environment]
```
The CLI will prompt for the value interactively. Remind the user not to commit secrets to source control and to add sensitive keys to `.gitignore` / `.vercelignore`.

### Remove a variable
```
vercel env rm <NAME> [environment]
```
Confirm with the user before removing.

### Pull variables to `.env.local`
```
vercel env pull [filename]
```
Pulls development variables to `.env.local` (default). Remind the user this file should be in `.gitignore`.

## Notes

- Never print variable values to the terminal output.
- After adding or removing variables, remind the user to redeploy for changes to take effect in deployed environments.
