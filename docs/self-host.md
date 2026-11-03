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

## What is not done yet

- **The console is not deployed.** There is no console build yet; the command says so when it finishes.
- **No route or custom domain is attached** to the gateway Worker, and DNS is yours to set up.
- **Tools are not reachable until they are bound.** The gateway reaches each tool's Worker through a service binding, added when a tool is created or deleted; this installation does not add any.
- Several settings the gateway needs for identity (single sign-on, token signing) and the key that encrypts tool secrets are not part of this command yet.
- The gateway bundle is not published as a package.
