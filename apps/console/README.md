# @forgeron/console

The console of a workspace: tools, versions, access, secrets.

## Planned contents

- Tools, versions and environments
- Roles × actions, resource approval
- Secrets: status per environment, set or missing (`secrets-status.tsx`); values are never read back

## Notes

Planned stack: React, Vite, `@forgeron/ui`. Served by the gateway, on the workspace origin.
