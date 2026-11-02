# @forgeron/gateway

Le seul Worker public de la plateforme.

## Contenu prévu

- `dispatch/` : sous-domaine → espace, `/t/<tool>` → Worker du tool
- `identity/` : SSO, OAuth 2.1 (MCP), jetons à audience
- `registry/` : tools, builds, versions, environnements (D1)
- `deploy/` : réception d'un build, appel de `@forgeron/hosting`
- `admin-mcp/` : MCP d'administration (`sdk.md` §17)
- `console-api/` : API de la console
- `audit/` : journal

## Notes

Stack prévue : Hono, `workers-oauth-provider`, Kysely sur D1. Voir `docs/ARCHITECTURE.md`, « La plateforme ».
