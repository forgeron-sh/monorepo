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
4. **DNS and route.** Looks up the zone of `--domain` on the account (a usage error if it is not there), then creates, or reuses, the proxied wildcard record `*.<domain>` and the route `*.<domain>/*` to `<name>-gateway`. The record is `AAAA 100::`, the placeholder Cloudflare documents for a proxied record with no origin; the route is what answers. A route that already exists for that pattern but points to another Worker stops the command instead of being overwritten. Certificates are not handled: the zone's own certificate coverage applies (a wildcard needs a certificate that covers `*.<domain>`).

Running it again is safe: the D1 and the Worker are reused, and a new version of the gateway is deployed.

## What is not done yet

- **The console is not deployed.** There is no console build yet; the command says so when it finishes.
- **Custom customer domains** (Cloudflare for SaaS, FOR-78) are not attached.
- **Tools are not reachable until they are bound.** The gateway reaches each tool's Worker through a service binding, added when a tool is created or deleted; this installation does not add any.
- Several settings the gateway needs for identity (single sign-on, token signing) and the key that encrypts tool secrets are not part of this command yet.
- The gateway bundle is not published as a package.
