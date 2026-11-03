# @forgeron/gateway

The only public Worker of the platform.

## Planned contents

- `dispatch/`: subdomain → workspace, `/t/<tool>` → the tool's Worker
- `identity/`: SSO, OAuth 2.1 (MCP), audience-bound tokens
- `registry/`: tools, builds, versions, environments (D1)
- `deploy/`: receives a build, calls `@forgeron/hosting`
- `admin-mcp/`: administration MCP (`sdk.md` §17)
- `console-api/`: console API (`secrets.ts`: `PUT`/`GET /api/tools/<tool>/environments/<env>/secrets`, admin only, names out and values in)
- `audit/`: log

## Notes

Planned stack: Hono, `workers-oauth-provider`, Kysely on D1. See `docs/ARCHITECTURE.md`, "The platform".
