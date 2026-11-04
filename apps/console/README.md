# @forgeron/console

The console of a workspace: tools, versions, access, secrets.

## Screens

A sidebar shell with path routing; the screens are the route table (`src/shell/routes.ts`, D-056, D-057). The sidebar has a workspace switcher, Home, Tools, then Members, Approvals and Audit log for admins, Settings, and the person's menu (theme, documentation, sign out). `g` then a letter goes to a section, `/` searches. A member only sees what they may use.

- Home: first-run checklist computed from `/api/workspace`, with the CLI commands to copy, and the workspace endpoint
- Tools: versions per environment; one tool's access matrix (roles × actions) and secrets status (set or missing; values are never read back)
- Members, Approvals, Audit log: also in Settings
- Settings (`/settings/...`, its own sidebar): Account (Profile, Preferences, Security, Connected accounts, Personal secrets), Workspace (General, Members, Roles and access, Sign-in, Domains), Administration (Audit log, Approvals, Usage and seats, Install information). Pages the platform has no data for yet say so.

## Local harness

`bun run --cwd apps/console harness` serves the console on port 5174 against an in-memory gateway (`src/mock/install.ts`). `?mock=fresh`, `member`, `signedout`, `error` and `slow` pick a scenario. It is never part of a build.

## Notes

React, Vite, `@forgeron/ui`. `vite build` writes `dist/`, which the gateway serves as assets on the workspace origin (`assets` in `apps/gateway/wrangler.jsonc`); the console reads the gateway's API at `/console-api/` on that same origin. It is the only app code served there.
