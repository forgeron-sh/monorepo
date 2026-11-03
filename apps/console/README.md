# @forgeron/console

The console of a workspace: tools, versions, access, secrets.

## Screens

A sidebar shell with path routing (`router.ts`, D-054); members of the workspace only see the first two.

- Overview: first-run checklist computed from `/api/workspace`, with the CLI commands to copy, and the workspace endpoint
- Tools: versions per environment; one tool's access matrix (roles × actions) and secrets status (set or missing; values are never read back)
- Members: roles, status, invitations with expiry, change roles, remove, allowed domains and default role
- Approvals: versions that ask for more, approve or reject
- Audit log: the latest lines of the tools' audit log
- Settings: sign-in methods (email, OIDC, SAML), mail mode, install information

## Local harness

`bun run --cwd apps/console harness` serves the console on port 5174 against an in-memory gateway (`src/mock/install.ts`). `?mock=fresh`, `member`, `signedout`, `error` and `slow` pick a scenario. It is never part of a build.

## Notes

React, Vite, `@forgeron/ui`. `vite build` writes `dist/`, which the gateway serves as assets on the workspace origin (`assets` in `apps/gateway/wrangler.jsonc`); the console reads the gateway's API at `/console-api/` on that same origin. It is the only app code served there.
