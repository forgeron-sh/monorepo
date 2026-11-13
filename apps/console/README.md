# @forgeron/console

The console of a workspace: tools, versions, access, secrets.

## Screens

A sidebar shell with path routing; the screens are the route table (`src/shell/routes.ts`, D-056, D-058). The sidebar (D-128) has a workspace switcher, the person's own space (Home, My tools, Discover), the Administration section, as far as the person's permissions go (Tools, Marketplace, Members, Teams), Settings at the bottom, and the person's menu (theme, documentation, sign out). `g` then a letter goes to a section, `/` searches. A person only sees what they may use; an address that moved redirects to its new place (`src/shell/redirects.ts`).

- Home (`/`): the person's tools and a way to Discover; for an admin, the workspace's numbers and the first-run checklist
- My tools (`/library`), Discover (`/discover`), a tool's page in the library (`/library/<tool>`)
- Administration (`/admin/...`): Tools (every tool of the workspace: channels, releases, availability, access; for people who hold `tools:read`), Marketplace, Members, Teams (permissions on Forgeron per team)
- Settings (`/settings/...`, its own sidebar): Account (Profile, Preferences, Security, Connected accounts, Personal secrets), Workspace (General, Sign-in, Domains, GitHub), Operations (Audit log, Usage and seats, Sealing key, Install information). Pages the platform has no data for yet say so.

## Local harness

`bun run --cwd apps/console harness` serves the console on port 5174 against an in-memory gateway (`src/mock/install.ts`). `?mock=fresh`, `member` (a developer), `person` (in no team: their own space only), `signedout`, `error` and `slow` pick a scenario. It is never part of a build.

## Notes

React, Vite, `@forgeron/ui`. `vite build` writes `dist/`, which the gateway serves as assets on the workspace origin (`assets` in `apps/gateway/wrangler.jsonc`); the console reads the gateway's API at `/console-api/` on that same origin. It is the only app code served there.
