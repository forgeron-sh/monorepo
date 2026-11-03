# Installing Forgeron on your own Cloudflare account

This guide describes `forgeron platform install` as it is implemented today. Where a step does not exist yet, it says so.

## Before you start

- A Cloudflare account on the **Workers Paid** plan (D-009).
- The `forgeron` CLI.
- The gateway Worker as one bundled ES module file (`worker.js`). Publishing it with the platform packages is not done yet, so you build it in this repository (after `bun install`):

  ```bash
  bun run --cwd apps/gateway build   # writes apps/gateway/dist/worker.js
  ```

- The console's build, the files of the console that the gateway serves (Vite):

  ```bash
  bun run --cwd apps/console build   # writes apps/console/dist
  ```

- The account id of the Cloudflare account (the id shown in the dashboard).

## 1. Create the API token

In the Cloudflare dashboard, create an API token whose permissions are limited to:

- Workers (scripts)
- D1
- Workers KV storage
- R2 storage
- Zone > Zone > Read, Zone > DNS > Edit and Zone > Workers Routes > Edit (Cloudflare lists them as `Zone Read`, `DNS Write` and `Workers Routes Write`), scoped to the zone of `--domain`

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
forgeron platform install --account <account-id> --domain <base-domain> --gateway apps/gateway/dist/worker.js --console apps/console/dist [--name forgeron]
```

- `--domain`: the base domain the gateway serves (`BASE_DOMAIN`), as in `forgeron.app` for the cloud.
- `--console`: the console's build directory. Its files are uploaded as the static assets of the gateway Worker, served at `https://<workspace>.<domain>/`. Without it the gateway is deployed without the console, and the command says so.
- `--oidc-issuer`, `--oidc-client-id`, `--admin-email`, `--member-email-domains`: your identity provider (any OIDC provider, D-019) and who may sign in (D-027). Give the issuer and the client id together, and at least one of the admin email and the member domains: without one of them nobody could sign in. They are checked before anything is sent: the issuer is an `https` URL without query or fragment, the client id has no spaces, the email and the domains have the usual shape. Without any of them the gateway has no sign-in, and the command says so.
- `OIDC_CLIENT_SECRET` (environment variable, never an argument): the client secret, for a confidential client. Leave it unset for a public client (PKCE alone). Like the API token it is sent as a secret binding and never printed.
- `--sign-in email[,oidc]` and `--mail-from <address>`: sign-in by an emailed code, on its own or beside OIDC (see "Sign-in by email" below). The OIDC flags are then needed only if `oidc` is named. The flag is not `--auth`, which chooses the Cloudflare credential.
- `--name`: prefix of the created resources, `forgeron` by default.

The command does, in order:

1. **Platform D1.** Creates a D1 database named `<name>-platform`, or reuses the one that has this name.
2. **Schema.** Applies the registry migrations to it (tools, builds, versions, environments, approvals, deployments, secrets). Already applied migrations are skipped. Then stores your `worker.js` in it: the gateway needs its own code to upload a new version of itself when a tool is bound (D-032).
3. **Gateway.** Creates the Worker `<name>-gateway` if needed, uploads your bundle as a version with these bindings, then deploys that version to all traffic:
   - `DB`: the platform D1;
   - `BASE_DOMAIN` and `CLOUDFLARE_ACCOUNT_ID`: plain values; `GATEWAY_WORKER`: the gateway's own name, plain;
   - `CLOUDFLARE_API_TOKEN`: the token, as a secret;
   - `ASSETS`: the console's files, when `--console` is given. They are uploaded first, through the Workers direct-upload API (a manifest of path, hash and size; only the files Cloudflare does not hold yet are sent), and the version carries the completion token. The gateway runs first for every request and falls back to the console's `index.html` for a path that is not a file (`run_worker_first`, `not_found_handling: single-page-application`). `.vite/` (Vite's own manifest) is not uploaded.
   - `AUTH_SECRET` and `SECRETS_KEY`: **generated by the command**, 32 random bytes each from the system's cryptographically secure generator, stored as secrets and never printed. A key that the gateway already has is **kept** (the new version asks Cloudflare to copy it; no value is sent), because replacing it would sign everyone out and make the stored secrets unreadable. Only a key that is missing is generated. Keep your own copy of neither: they cannot be read back, and rotation is not done yet;
   - `SIGN_IN_METHODS`, `MAIL_FROM` and the `send_email` binding `SEND_EMAIL`, when `--sign-in email` is given;
   - the identity settings above, when given. A re-run without any identity flag keeps those of the previous version; a re-run with flags replaces them, so give them all again (and `OIDC_CLIENT_SECRET`).
4. **DNS and route.** Looks up the zone of `--domain` on the account (a usage error if it is not there), then creates, or reuses, the proxied wildcard record `*.<domain>` and the route `*.<domain>/*` to `<name>-gateway`. The record is `AAAA 100::`, the placeholder Cloudflare documents for a proxied record with no origin; the route is what answers. A route that already exists for that pattern but points to another Worker stops the command instead of being overwritten. Certificates are not handled: the zone's own certificate coverage applies (a wildcard needs a certificate that covers `*.<domain>`).

Running it again is safe: the D1 and the Worker are reused, and a new version of the gateway is deployed. The `TOOL_<WORKER>` service bindings of the tools already deployed (the registry lists their environments) are carried over to it. A binding Cloudflare cannot carry over is left out and named in the output: that tool is not reachable until it is deployed again.

## Sign-in by email

Without an identity provider, or beside one, the gateway signs people in by a code sent to their email (D-049). No password is stored.

1. In the Cloudflare dashboard (Compute, Email Service, Email Sending) onboard the domain the mail comes from; it must use Cloudflare DNS, and sending to any address needs the Workers Paid plan. Email Sending is in beta.
2. Install with `--sign-in email --mail-from login@<your-domain> --admin-email you@<your-company> [--member-email-domains <domain,…>]`. Add `oidc` to `--sign-in` (and the OIDC flags) to offer both.
3. Open `https://<workspace>.<domain>/auth/login`, enter `--admin-email`, type the 8-digit code from the mail. The first administrator is that address and nobody else: the first person to arrive is not.

What the page does, in order: with both methods on, the OIDC button ("Continue with your company account") first, then the email form; with email alone, the email form; with OIDC alone, a redirect to the provider as before. `/auth/login?method=oidc` always starts the provider. The session is the same signed `__Host-fg_session` cookie and `forgeron login` is unchanged: it opens `/auth/login` when the browser has no session.

The code is 8 digits, valid 10 minutes, usable once, five tries, tied to the browser that asked (a cookie), and at most 5 requests per address and 20 per source address per hour. The answer to a request is the same whether or not the address may sign in, and nothing is mailed to an address that is not allowed in. A mail that cannot be sent (domain not onboarded, plan) is not shown to the person: it is logged by the gateway (`sign-in mail not sent`, no address), so check the Worker's logs first when a code never arrives.

Who may sign in: an existing member; an invited address; the `--admin-email`; an address of an allowed domain. In the console (Members), an admin lists members, invites an address with roles (it joins by signing in with it, by email code or OIDC; invitations last 14 days), changes roles, removes a member (sessions stop at once), and sets the allowed domains and the role those people join with (never `admin`). Domains saved in the console replace `--member-email-domains`. The last administrator cannot be removed or demoted. Every change is in the audit log.

## How tools get bound

When a tool is deployed (`POST /deploy`) the gateway uploads a new version of itself, with every binding it holds carried over (`inherit`, no value sent) plus `TOOL_<WORKER>`, then deploys it; deleting an environment removes the binding first (D-029, D-032). A Worker already bound uploads nothing. This needs `GATEWAY_WORKER`, the account id and the API token on the gateway, and the code stored by the install: a gateway installed before this change must run `platform install` once more.

## Bindings the gateway reads

This is the exact list read from `apps/gateway/src/gateway.ts` (`GatewayEnv`). `forgeron platform install` sets `DB`, `BASE_DOMAIN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `ASSETS`, `AUTH_SECRET`, `SECRETS_KEY` and, when you give the flags of step 2, the `OIDC_*`, `ADMIN_EMAIL` and `MEMBER_EMAIL_DOMAINS` settings (D-031).

| Binding                 | Kind                 | Meaning                                                                                                                                                                                                                                                                                                     |
| ----------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DB`                    | D1                   | The platform D1. Required.                                                                                                                                                                                                                                                                                  |
| `BASE_DOMAIN`           | var                  | The base domain (`forgeron.app`); a workspace is the one label in front of it. Required.                                                                                                                                                                                                                    |
| `CLOUDFLARE_ACCOUNT_ID` | var                  | The account `POST /deploy` deploys tools to. Without it and the token, `/deploy` answers `501`.                                                                                                                                                                                                             |
| `CLOUDFLARE_API_TOKEN`  | **secret**           | Limited to Workers, D1, KV and R2. Deploys tools without the person present.                                                                                                                                                                                                                                |
| `AUTH_SECRET`           | **secret**           | Signs sessions, sign-in state and every token (HMAC-SHA256). Random, at least 32 bytes, base64. Without it identity is off: `/auth`, `/whoami`, `/deploy`, `/promote`, `/rollback` and `/deploy-tokens` answer `404` and every console call is `401`. Changing it signs everyone out and voids every token. |
| `SECRETS_KEY`           | **secret**           | Encrypts tool secrets and connection tokens at rest (AES-256-GCM): 32 random bytes, base64. Without it the secret routes refuse to run. Changing it makes stored secrets unreadable.                                                                                                                        |
| `OIDC_ISSUER`           | var                  | The identity provider's issuer URL (any OIDC provider, D-019).                                                                                                                                                                                                                                              |
| `OIDC_CLIENT_ID`        | var                  | The client id registered at the provider.                                                                                                                                                                                                                                                                   |
| `OIDC_CLIENT_SECRET`    | **secret**, optional | The client secret; omit it for a public client (PKCE alone).                                                                                                                                                                                                                                                |
| `ADMIN_EMAIL`           | var                  | The email that becomes the administrator of a workspace when it first signs in (D-027).                                                                                                                                                                                                                     |
| `MEMBER_EMAIL_DOMAINS`  | var, optional        | Comma-separated email domains whose people become members, with no role, when they first sign in (D-027). Without it only `ADMIN_EMAIL` can sign in.                                                                                                                                                        |
| `SIGN_IN_METHODS`       | var, optional        | `email`, `oidc` or `email,oidc` (D-049). Unset: OIDC alone, as before. The email routes answer `404` unless `email` is named and `SEND_EMAIL` and `MAIL_FROM` are set.                                                                                                                                      |
| `SEND_EMAIL`            | `send_email` binding | Cloudflare Email Sending, through which the sign-in codes and invitations are mailed.                                                                                                                                                                                                                       |
| `MAIL_FROM`             | var                  | The address the mail comes from, on a domain onboarded to Email Sending.                                                                                                                                                                                                                                    |
| `DISPATCHER`            | dispatch namespace   | Forgeron Cloud only: the namespace tool Workers are uploaded to.                                                                                                                                                                                                                                            |
| `DISPATCH_NAMESPACE`    | var                  | Forgeron Cloud only: the name of that namespace, for `POST /deploy`.                                                                                                                                                                                                                                        |
| `TOOL_<WORKER>`         | service binding      | Self-host: one per tool Worker (D-017).                                                                                                                                                                                                                                                                     |
| `ASSETS`                | assets               | The built console, when there is one.                                                                                                                                                                                                                                                                       |

Register this redirect URI at the identity provider, for each workspace: `https://<workspace>.<BASE_DOMAIN>/auth/callback`.

What the gateway serves at a workspace origin once these are set: `/auth/login`, `/auth/callback`, `/auth/logout`, `POST /auth/token` (a signed-in person's token for one tool, 1 to 30 days), `GET /auth/cli` and `POST /auth/cli/token` (`forgeron login`), `GET /whoami`, `POST /deploy-tokens` (administrators), `POST /deploy` (a deployment token), `POST /promote` and `POST /rollback` (an administrator or a deployment token, D-033), `/console-api/*` (with `/api/groups` for the pilot group, D-034), `/t/<tool>`.

## What is not done yet

- **Custom customer domains** (Cloudflare for SaaS, FOR-78) are not attached.
- **Key rotation** is not done: the install never replaces an existing `AUTH_SECRET` or `SECRETS_KEY`.
- **Binding limits** (D-032): two tools deployed at the same moment can lose one binding (deploy the tool again); the console assets are kept with `keep_assets`, which Cloudflare documents for the upload endpoints and which was not tried on the versions endpoint; nothing was tried on a real account.
- `/mcp`, `/api` and `/cli` of a workspace answer `404` (admin MCP, FOR-107). A CLI token lives 30 days and cannot be revoked before; `forgeron login` was proven against the gateway handler with a simulated provider only, not on a real deployment.
- The sign-in provider can also be saved in the platform (an admin, `PUT /console-api/api/identity-provider`): Microsoft Entra ID (`kind: entra`, `tenant`), Google Workspace (`kind: google`, `hostedDomain`) or any OIDC issuer (`kind: oidc`, `issuer`), with `clientId`, an optional `clientSecret` and optional `groupRoles`; it wins over the `OIDC_*` bindings (D-041). SAML is not supported.
- Sign-in by email was proven against a simulated mail sender only: no real Email Sending domain or mailbox was tried (D-049, "Not verified").
- The gateway bundle is not published as a package.
