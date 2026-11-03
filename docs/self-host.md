# Installing Forgeron on your own Cloudflare account

This guide describes `forgeron platform install` as it is implemented today. Where a step does not exist yet, it says so.

## Before you start

- A Cloudflare account on the **Workers Paid** plan (D-009).
- The `forgeron` CLI.
- The gateway Worker as one bundled ES module file (`worker.js`). Publishing it with the platform packages is not done yet, so for now you build it from `apps/gateway` in this repository.
- The account id of the Cloudflare account (the id shown in the dashboard).

## 1. Create the API token

In the Cloudflare dashboard, create an API token whose permissions are limited to:

- Workers (scripts)
- D1
- Workers KV storage
- R2 storage

Give it nothing else. Scope it to the single account you install on.

**This token is the most sensitive secret of the installation** (D-009): the platform keeps it to create and update the Workers, databases, namespaces and buckets of your tools. Anyone who holds it can change what runs on the account within those permissions.

How Forgeron handles it:

- The command reads it from the environment variable `CLOUDFLARE_API_TOKEN` only. It is never an argument, so it does not land in your shell history or the process list.
- It is sent to Cloudflare as a **secret binding** of the gateway Worker, and nowhere else.
- The command never prints it, in its output or in its errors.

Keep it out of the repository and out of logs. Rotate it by creating a new token, running the install again, then revoking the old one.

### Alternative: use your wrangler login (`--auth wrangler`)

If you would rather not create a token for the installation, sign in with `wrangler login` and add `--auth wrangler`. The command runs `wrangler auth token` and uses the session token it prints for the installation's calls only (D-026). It is never printed, never an argument.

What this does **not** change: that token is short-lived, so it is **not** stored in the gateway. The gateway still needs an API token (limited as above) to deploy tools later. Either export it as `GATEWAY_CLOUDFLARE_API_TOKEN` when you run the command, or the command skips the binding and tells you; set the secret `CLOUDFLARE_API_TOKEN` on the gateway Worker yourself (for example with `wrangler secret put`). Tools cannot be deployed before that. Without `--auth`, nothing changes; `--auth oauth` is reserved and refused. If wrangler is missing or not signed in, the command asks you to run `wrangler login`.

## 2. Run the installation

```bash
export CLOUDFLARE_API_TOKEN=...   # the token from step 1
forgeron platform install --account <account-id> --domain <base-domain> --gateway ./worker.js [--name forgeron]
```

- `--domain`: the base domain the gateway serves (`BASE_DOMAIN`), as in `forgeron.app` for the cloud.
- `--name`: prefix of the created resources, `forgeron` by default.

The command does, in order:

1. **Platform D1.** Creates a D1 database named `<name>-platform`, or reuses the one that has this name.
2. **Schema.** Applies the registry migrations to it (tools, builds, versions, environments, approvals, deployments, secrets). Already applied migrations are skipped.
3. **Gateway.** Creates the Worker `<name>-gateway` if needed, uploads your bundle as a version with these bindings, then deploys that version to all traffic:
   - `DB`: the platform D1;
   - `BASE_DOMAIN` and `CLOUDFLARE_ACCOUNT_ID`: plain values;
   - `CLOUDFLARE_API_TOKEN`: the token, as a secret.

Running it again is safe: the D1 and the Worker are reused, and a new version of the gateway is deployed.

## Bindings the gateway reads

This is the exact list read from `apps/gateway/src/gateway.ts` (`GatewayEnv`). It is the input of FOR-120 (the install command generating and storing them). `forgeron platform install` sets only the first four today.

| Binding                 | Kind                 | Meaning                                                                                                                                                                                                                                                                            |
| ----------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DB`                    | D1                   | The platform D1. Required.                                                                                                                                                                                                                                                         |
| `BASE_DOMAIN`           | var                  | The base domain (`forgeron.app`); a workspace is the one label in front of it. Required.                                                                                                                                                                                           |
| `CLOUDFLARE_ACCOUNT_ID` | var                  | The account `POST /deploy` deploys tools to. Without it and the token, `/deploy` answers `501`.                                                                                                                                                                                    |
| `CLOUDFLARE_API_TOKEN`  | **secret**           | Limited to Workers, D1, KV and R2. Deploys tools without the person present.                                                                                                                                                                                                       |
| `AUTH_SECRET`           | **secret**           | Signs sessions, sign-in state and every token (HMAC-SHA256). Random, at least 32 bytes, base64. Without it identity is off: `/auth`, `/whoami`, `/deploy` and `/deploy-tokens` answer `404` and every console call is `401`. Changing it signs everyone out and voids every token. |
| `SECRETS_KEY`           | **secret**           | Encrypts tool secrets and connection tokens at rest (AES-256-GCM): 32 random bytes, base64. Without it the secret routes refuse to run. Changing it makes stored secrets unreadable.                                                                                               |
| `OIDC_ISSUER`           | var                  | The identity provider's issuer URL (any OIDC provider, D-019).                                                                                                                                                                                                                     |
| `OIDC_CLIENT_ID`        | var                  | The client id registered at the provider.                                                                                                                                                                                                                                          |
| `OIDC_CLIENT_SECRET`    | **secret**, optional | The client secret; omit it for a public client (PKCE alone).                                                                                                                                                                                                                       |
| `ADMIN_EMAIL`           | var                  | The email that becomes the administrator of a workspace when it first signs in (D-027).                                                                                                                                                                                            |
| `MEMBER_EMAIL_DOMAINS`  | var, optional        | Comma-separated email domains whose people become members, with no role, when they first sign in (D-027). Without it only `ADMIN_EMAIL` can sign in.                                                                                                                               |
| `DISPATCHER`            | dispatch namespace   | Forgeron Cloud only: the namespace tool Workers are uploaded to.                                                                                                                                                                                                                   |
| `DISPATCH_NAMESPACE`    | var                  | Forgeron Cloud only: the name of that namespace, for `POST /deploy`.                                                                                                                                                                                                               |
| `TOOL_<WORKER>`         | service binding      | Self-host: one per tool Worker (D-017).                                                                                                                                                                                                                                            |
| `ASSETS`                | assets               | The built console, when there is one.                                                                                                                                                                                                                                              |

Register this redirect URI at the identity provider, for each workspace: `https://<workspace>.<BASE_DOMAIN>/auth/callback`.

What the gateway serves at a workspace origin once these are set: `/auth/login`, `/auth/callback`, `/auth/logout`, `POST /auth/token` (a signed-in person's token for one tool, 1 to 30 days), `GET /whoami`, `POST /deploy-tokens` (administrators), `POST /deploy` (a deployment token), `/console-api/*`, `/t/<tool>`.

## What is not done yet

- **The console is not deployed.** There is no console build yet; the command says so when it finishes.
- **No route or custom domain is attached** to the gateway Worker, and DNS is yours to set up.
- **Tools are not reachable until they are bound.** The gateway reaches each tool's Worker through a service binding, added when a tool is created or deleted; this installation does not add any.
- The identity settings and the two keys listed above (`AUTH_SECRET`, `SECRETS_KEY`, `OIDC_*`, `ADMIN_EMAIL`) are not part of this command yet (FOR-120): set them on the gateway Worker yourself for now.
- `/mcp`, `/api` and `/cli` of a workspace answer `404` (admin MCP, FOR-107). `forgeron login` cannot sign in yet: the gateway has no `/auth/cli` and `/auth/cli/token`.
- Members are added only at sign-in, by the two rules of D-027; there is no way to list, remove or change the roles of a member.
- The gateway bundle is not published as a package.
