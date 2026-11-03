# @forgeron/gateway

The only public Worker of the platform.

## Planned contents

- `dispatch/`: subdomain → workspace, `/t/<tool>` → the tool's Worker
- `identity/`: SSO, OAuth 2.1 (MCP), audience-bound tokens
- `registry/`: tools, builds, versions, environments (D1)
- `pages/`: the page shell (`renderPage`, notices, buttons, error pages) every HTML page of the gateway uses, its stylesheet generated from `assets/design-system/tokens.json`; sign-in, CLI authorization and error pages (D-053)
- `deploy/`: receives a build from CI (`POST /deploy`, authenticated by `FORGERON_TOKEN`), calls `@forgeron/hosting`; issues deployment tokens (`POST /deploy-tokens`, administrators)
- `admin-mcp/`: administration MCP (`sdk.md` §17)
- `console-api/`: console API (`secrets.ts`: `PUT`/`GET /api/tools/<tool>/environments/<env>/secrets`, admin only, names out and values in; `secrets-status.ts`: `GET /api/tools/<tool>/secrets-status`, set or missing per declared secret)
- `audit/`: log (deployments are recorded in the registry's `deployments` history: who, when, which version)

## Notes

Planned stack: Hono, `workers-oauth-provider`, Kysely on D1. See `docs/ARCHITECTURE.md`, "The platform".

## Deployment tokens

A deployment token has the same shape as the audience-bound tokens (`fgt.<claims>.<signature>`, `identity/tokens.ts`) plus a `scp` claim, `deploy`. It is bound to one `<workspace>/<tool>` and expires (1 to 365 days, `forgeron token create --days`). A token with a scope is refused where no scope is asked for, so it cannot call a tool's API, and a person's token cannot deploy. There is no revocation or listing yet: a token ends at its expiry.
