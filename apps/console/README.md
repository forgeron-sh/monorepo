# @forgeron/console

The console of a workspace: tools, versions, access, secrets.

## Planned contents

- Tools, versions and environments
- Roles × actions, resource approval
- Secrets: status per environment, set or missing (`secrets-status.tsx`); values are never read back

## Notes

React, Vite, `@forgeron/ui`. `vite build` writes `dist/`, which the gateway serves as assets on the workspace origin (`assets` in `apps/gateway/wrangler.jsonc`); the console reads the gateway's API at `/console-api/` on that same origin. It is the only app code served there.
