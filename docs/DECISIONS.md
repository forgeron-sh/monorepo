# Decision log

Every architecture or tooling decision is recorded here, in the order it is made.

Rules of the log:

- A new entry is **added** at the end; a past decision is never rewritten.
- To reverse a decision, add a new one and set the old one's status to "Replaced by D-0xx".
- Each entry says what was decided, why, what was rejected, and where it is applied (files, sections of `sdk.md` or `ARCHITECTURE.md`).
- An external source (Cloudflare doc, trial) is cited with its date.

## Index

| No.   | Date       | Decision                                                                                                                         | Status            |
| ----- | ---------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| D-001 | 22/10/2026 | Adopt the tooling and conventions of siages                                                                                      | Active            |
| D-002 | 22/10/2026 | TypeScript 6, not 7                                                                                                              | Active            |
| D-003 | 22/10/2026 | The CLI is an app (`apps/cli`), the SDK a package (`packages/sdk`)                                                               | Active            |
| D-004 | 22/10/2026 | A tool is built in the CI of its repository                                                                                      | Active            |
| D-005 | 22/10/2026 | Build, version and release are three distinct notions                                                                            | Active            |
| D-006 | 22/10/2026 | One `forgeron.config.ts` = one tool                                                                                              | Active            |
| D-007 | 22/10/2026 | Catalog templates use `forgeron release`                                                                                         | Active            |
| D-008 | 22/10/2026 | Run tools with Dynamic Workers                                                                                                   | Replaced by D-009 |
| D-009 | 22/10/2026 | Two hosting modes behind a single interface: Workers for Platforms (cloud), classic Workers (self-host)                          | Active            |
| D-010 | 22/10/2026 | One D1 database per tool and per environment, bound directly to the tool's Worker                                                | Active            |
| D-011 | 02/11/2026 | All repository files are written in English                                                                                      | Active            |
| D-012 | 02/11/2026 | An action is atomic through one D1 batch, not through a transaction                                                              | Active            |
| D-013 | 02/11/2026 | The gateway builds its OAuth authorization server from the registry, and caches it                                               | Active            |
| D-014 | 03/11/2026 | Migrations are SQL applied in one batch; a rename is a hard rename; no expand and contract                                       | Active            |
| D-015 | 03/11/2026 | API and CLI tokens are signed, carry a `<workspace>/<tool>` audience, and have no default lifetime                               | Active            |
| D-016 | 03/11/2026 | Views are served with a sandbox CSP and call their tool with a 15-minute token                                                   | Active            |
| D-017 | 03/11/2026 | The gateway reaches tool Workers through a dispatch namespace in cloud, `TOOL_<WORKER>` bindings in self-host                    | Active            |
| D-018 | 03/11/2026 | In cloud mode the script is sent at `activate`, after the migration, not at `upload`                                             | Active            |
| D-019 | 03/11/2026 | Workspace sign-in is OpenID Connect with PKCE; the session is a signed `__Host-` cookie                                          | Active            |
| D-020 | 03/11/2026 | Views are a statically served React app that calls actions, not server-rendered pages                                            | Active            |
| D-021 | 03/11/2026 | Pilot and production share one database, with a strict compatibility check at deployment                                         | Active            |
| D-022 | 03/11/2026 | D1 only for now; a Postgres option through Hyperdrive is not offered                                                             | Active            |
| D-023 | 03/11/2026 | No tool owner role: workspace roles only                                                                                         | Active            |
| D-024 | 03/11/2026 | A seat is a person who made an authenticated call in the workspace during a calendar month                                       | Active            |
| D-025 | 03/11/2026 | `forgeron login` signs in through the browser on a loopback address with PKCE and stores the token in the keychain or a 600 file | Active            |
| D-027 | 03/11/2026 | Members live in the registry; sign-in admits the configured administrator and allowed email domains, nobody else                 | Active            |
| D-029 | 03/11/2026 | In self-host the gateway is redeployed with `inherit` bindings to add or remove a tool's `TOOL_<WORKER>` binding                 | Active            |
| D-031 | 03/11/2026 | `forgeron login` gets a CLI token scoped `cli` for the platform, one-time PKCE code, 30 days                                     | Active            |
| D-032 | 03/11/2026 | The gateway keeps its own code in the platform D1, and `platform install` carries the tool bindings over                         | Active            |

---

## D-001 — Adopt the tooling and conventions of siages

- **Date**: 22/10/2026 · **Status**: Active
- **Decision**: the repository adopts the tooling of siages (Epitech project, October 2026): proto, Bun, moon, oxlint, oxfmt, Vitest, knip, dependency-cruiser, lefthook, commitlint (Conventional Commits), release-please; the same GitHub workflows (CI, Release, Deploy), issue and PR templates, `CONTRIBUTING`, `SECURITY`, `CODE_OF_CONDUCT`. Also taken from the Odoo SDK: `.editorconfig`, a workaround for a global `core.hooksPath` in `prepare`.
- **Why**: so that all our repositories look alike.
- **Rejected**: the mirror workflow to the Epitech repository (specific to siages).
- **Added**: a PR title check in CI, because the title becomes the merged commit that release-please reads.
- **Applied in**: root files, `.github/`, `.moon/`, `ARCHITECTURE.md` ("Tooling").

## D-002 — TypeScript 6, not 7

- **Date**: 22/10/2026 · **Status**: Active
- **Decision**: `typescript` pinned to `6.0.3`.
- **Why**: dependency-cruiser only accepts TypeScript `<7`. With 7, it analyzes **no** module ("0 modules cruised") without failing: the import rules would always pass. Observed on 22/10/2026 with dependency-cruiser 18.6.0.
- **Rejected**: TypeScript 7.0.2, used by the Odoo SDK and toolbox-poc (toolbox-poc is probably affected by the same problem, not verified).
- **Applied in**: `package.json`, `ARCHITECTURE.md` ("Tooling").

## D-003 — The CLI is an app, the SDK a package

- **Date**: 22/10/2026 · **Status**: Active
- **Decision**: the `forgeron` binary lives in `apps/cli` (`@forgeron/cli`); what a tool imports lives in `packages/sdk` (`@forgeron/sdk`). `sdk.md` §18 planned a single `forgeron` package containing both.
- **Why**: the SDK stays light and free of Node dependencies; the CLI evolves without republishing the SDK. The CLI depends on the SDK, never the other way around.
- **Still open**: the public npm name (lead: publish the CLI as `forgeron` to keep `npx forgeron`).
- **Applied in**: `apps/cli`, `packages/sdk`, `ARCHITECTURE.md`.

## D-004 — A tool is built in the CI of its repository

- **Date**: 22/10/2026 · **Status**: Active
- **Decision**: a reusable GitHub Action runs `forgeron test`, `forgeron change check` and `forgeron deploy` in the tool's repository. The Forgeron GitHub app will come later; it installs the action and shows deployments in PRs, but **builds nothing** on the platform side.
- **Why**: no build infrastructure to host (a bundler runs under Node, not in a Worker); the same path locally, in CI and in self-host.
- **Rejected**: a platform-side build on every push (build machines to operate).
- **Still open**: replacing `FORGERON_TOKEN` with GitHub Actions OIDC; name of the action.
- **Applied in**: `sdk.md` §15 ("Publishing from GitHub"), `ARCHITECTURE.md` ("Publishing a tool"), `.github/actions/deploy` (the action, until its name is confirmed), `forgeron deploy` and the workflow written by `forgeron init` (`apps/cli`).

## D-005 — Build, version and release are three distinct notions

- **Date**: 22/10/2026 · **Status**: Active
- **Decision**: a **build** is produced on every push (identified by the commit); the semver **version** only changes with `forgeron release`; what is deployed carries both (`v1.5.0+a41f9e0`).
- **Why**: the spec said both "every push creates a version" and "the version only changes with `forgeron release`".
- **Applied in**: `sdk.md` §1 and §16 ("Build, version, release").

## D-006 — One `forgeron.config.ts` = one tool

- **Date**: 22/10/2026 · **Status**: Active
- **Decision**: in a repository, every folder that contains a `forgeron.config.ts`, at any depth (excluding `node_modules`), is a tool. Two tools in the same repository cannot have the same `name`.
- **Why**: the CLI, the GitHub Action and the console discover tools without any other declaration.
- **Applied in**: `sdk.md` §2.

## D-007 — Catalog templates use `forgeron release`

- **Date**: 22/10/2026 · **Status**: Active
- **Decision**: the templates in `templates/` are tools; they are versioned by `forgeron release` (tags `crm@1.0.0`), not by release-please. They will be excluded from `release-please-config.json` when switching to multi-component mode.
- **Why**: it is the system customers will use; the repository tests it first.
- **Rejected**: release-please for templates.
- **Applied in**: `ARCHITECTURE.md` ("Versions").

## D-008 — Run tools with Dynamic Workers

- **Date**: 22/10/2026 · **Status**: Replaced by D-009
- **Decision**: the gateway loads each tool with the Worker Loader binding (`env.LOADER.get("<workspace>/<tool>@<build>", …)`).
- **Why**: works entirely locally. Trial of 22/10/2026 (wrangler 4.151.2): loading by build identifier, new code served without redeploying, per-tool database through an RPC binding, restricted `env`, filtered outbound network, SQLite through a Durable Object Facet. Only the CPU limit is not enforced locally.
- **Why replaced**: a dynamic Worker receives no D1, KV or R2 directly, only RPC bindings provided by the gateway. A homegrown data proxy would have been needed, and tools would not have run as ordinary Workers. See D-009 and D-010.

## D-009 — Two hosting modes behind a single interface

- **Date**: 22/10/2026 · **Status**: Active
- **Decision**: the gateway and the CLI deploy tools through a single interface, `@forgeron/hosting`, with three implementations:

  | Mode                                          | Implementation                                                                              | Cloudflare account |
  | --------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------ |
  | Forgeron Cloud (paid offer, hosting included) | Workers for Platforms: one user Worker per tool and per environment in a dispatch namespace | Forgeron's         |
  | Self-host                                     | Classic Workers created and updated through the Cloudflare API                              | the customer's     |
  | Local                                         | `forgeron dev`: local Worker (workerd)                                                      | none               |

  The interface creates the tool's Worker, creates its resources (D1, KV, R2), binds them to it, applies migrations, switches traffic and deletes it all.

- **Why**: in all three modes, the tool receives **real** Cloudflare resources. The runtime and a tool's code are identical everywhere, with no data proxy. Self-host only requires the Workers Paid plan; only the cloud pays for Workers for Platforms.
- **Rejected**: Dynamic Workers (D-008); Workers for Platforms alone (forces the purchase on the self-host customer); classic Workers alone (limit of 500 Workers per account, see below).
- **Known constraints**:
  - Classic Workers: 500 Workers per account on Workers Paid ("Limits" doc of 12/10/2026). Each tool uses one per environment, plus one per preview: previews must be deleted automatically when their branch is merged.
  - Classic Workers: a service binding is fixed when the gateway is deployed, and the script settings API we read does not allow changing it without resending the code. The gateway is therefore redeployed through the API **when a tool is added or removed**, not on every version (a tool's Worker keeps a stable name per environment).
  - Workers for Platforms: $25 per month, 20 million requests and 1,000 scripts included, then $0.02 per script ("Pricing" doc of 21/04/2026). Dedicated bindings per user Worker, declared when the code is uploaded ("Bindings" doc of 16/09/2026). Locally, the gateway can only call deployed user Workers (doc of 25/06/2026).
  - The self-host customer's Cloudflare API token is the most sensitive secret of the installation: permissions limited to Workers, D1, KV and R2.
- **Still open**: exposing self-host previews without redeploying the gateway for each branch (per-version preview URL, or HTTP access with an internal token); verifying the upload of a Worker with its D1 on Workers for Platforms (purchase required).
- **Applied in**: `packages/hosting`, `ARCHITECTURE.md` ("Hosting modes"), `sdk.md` §7, §19, §20, `white-paper.md`.

## D-010 — One D1 database per tool and per environment

- **Date**: 22/10/2026 · **Status**: Active
- **Decision**: each tool receives one D1 database per environment (and per preview), created by `@forgeron/hosting` and bound directly to its Worker. The SDK queries it with Kysely; migrations remain those of `sdk.md` §8.
- **Why**: isolation provided by Cloudflare, limits per tool rather than shared, SQL and migrations preserved. D1 limits (doc of 21/04/2026): 10 GB per database, not extensible; 50,000 databases per account; a database processes one request at a time (about 1,000 requests per second for 1 ms queries); 30-day restore.
- **Rejected**:
  - a single homegrown document database (for everyone or per workspace): shared limits, a query engine to reinvent, isolation relying on our code alone;
  - one SQL database per workspace with tables prefixed by tool: isolation by SQL parsing, fragile;
  - Durable Object SQLite (facets or RPC proxy): only useful with Dynamic Workers.
- **Kept for later**: an optional documents API (`ctx.docs`) on top of the tool's SQLite database, relying on JSON columns (`t.json`).
- **Still open**: the per-action transaction promised by `sdk.md` §6 and §9. D1 seems to offer only atomic batches, with no interactive transaction (to be verified); it may have to be replaced by `ctx.db.batch()`.
- **Applied in**: `sdk.md` §8 and §20, `ARCHITECTURE.md`.

## D-011 — All repository files are written in English

- **Date**: 02/11/2026 · **Status**: Active
- **Decision**: every file of the repository is written in English: documentation (`docs/`), READMEs, `CONTRIBUTING` and other community files, UI copy and code comments.
- **Why**: Forgeron targets an international open source audience; English is also the language of siages and of the tooling we use, so contributors and tools share the same language.
- **Rejected**: French, the language of the existing documentation before this change.
- **Applied in**: all docs, READMEs, UI copy, comments.

## D-012 — An action is atomic through one D1 batch, not through a transaction

- **Date**: 02/11/2026 · **Status**: Active
- **Decision**: the atomicity of an action is **one `ctx.db.batch([...])`**: every write of the action goes in a single batch, which D1 runs as one SQL transaction and rolls back entirely when a statement fails, across tables. There is no interactive transaction (`BEGIN`, `SAVEPOINT` are refused), so an action cannot read, decide in code, then write inside one transaction.
- **What follows**:
  - A statement of a batch can read what an earlier one wrote (`INSERT … SELECT`, `SELECT`), but code cannot branch between statements.
  - A read made before the batch is not isolated from concurrent writes. A write that depends on what was read carries its guard in the SQL (`UPDATE … WHERE version = ?`) and checks `changes`; no row changed means `CONFLICT`.
  - `sync` events (`sdk.md` §9) cannot run their own SQL "inside the action's transaction". A handler that writes has to contribute statements to the action's batch, which the runtime flushes once; this is designed with `@forgeron/sdk/db` (FOR-16). Until then, "an error cancels the action" is true of what the action and its handlers have not written yet.
- **Why**: measured on the local D1 of Miniflare 4.20260730.0 (`packages/hosting/src/d1-atomicity.test.ts`): a failing batch leaves 0 rows of the ones before it, with a not-null and a foreign-key failure; the same statements sent one by one leave the first write behind; `BEGIN TRANSACTION`, `SAVEPOINT` and `BEGIN; …; COMMIT;` through `exec` are all refused with "please use the state.storage.transaction() …". The Cloudflare D1 documentation (D1 Worker Binding API, last updated 22/06/2026) says batched statements are SQL transactions and that a failure aborts or rolls back the entire sequence; it does not mention interactive transactions.
- **Not verified**: a remote D1. The local database runs the same engine, and the documentation agrees, but the issue asked for a remote proof too and none was made (no Cloudflare account was connected). To repeat with a remote database before the first deployment.
- **Rejected**: promising "one transaction per action" as `sdk.md` did; transactions through Durable Object storage (`state.storage.transaction()`), which would give up D-010 (a D1 bound directly to the Worker).
- **Applied in**: `sdk.md` §6 (the `ctx.db` row), §9, §20; `ARCHITECTURE.md`, "Open decisions".

## D-013 — The gateway builds its OAuth authorization server from the registry, and caches it

- **Date**: 02/11/2026 · **Status**: Active
- **Decision**: per workspace, the gateway's `OAuthAuthorizationServer` (`@cloudflare/workers-oauth-provider` 1.2.4, split roles) is built from the **registry**: its `resources` are the workspace's admin MCP (`https://<workspace>.forgeron.app/mcp`, always declared) and one `https://<workspace>.forgeron.app/t/<tool>/mcp` per tool. Each tool request goes through an `OAuthResourceServer` for that tool, whose `validateToken` is the authorization server's. The authorization server is **cached per isolate, keyed by workspace and registry version**, and rebuilt when the version moves. Creating or deleting a tool is a registry write and a version bump: no redeploy.
- **What the gateway handles itself**:
  - A tool that is not in the registry answers `404` before any token check: for a resource it does not declare, the library fails closed with a `503`.
  - A workspace with no tool still declares the admin MCP, because the library refuses an empty list of resources.
- **Why**: the library fixes its resources at construction, as the Toolbox POC found, but nothing stops us constructing it from data. Proof in `apps/gateway/src/identity/oauth-dynamic-resources.test.ts`, on the real library in workerd: a tool created while the Worker runs gets a valid token through the full authorization-code flow with PKCE; a token is good for its own tool only (a token for one tool gets `401` on another, and conversely); a provider built once rejects a tool created after it with `invalid_target`, which is the risk. The library's own documentation says the registry is fixed at construction and that `validateToken()` rejects a resource that is not listed.
- **Cost, and why it is cached**: constructing the authorization server is quadratic in the number of resources. Measured once on workerd (Miniflare 4.20260730.0, 200 constructions each): 0.025 ms with 1 resource, 1.3 ms with 50, 103 ms with 500. Building it per request is fine for a few tools and not for hundreds, hence the cache. A workspace with several hundred tools needs another answer (patching the library, or sharding resources): revisit around 100 tools per workspace.
- **Know**: authorizing the same client again for the same tool revokes the previous grant (documented library behavior), so a client that re-runs the flow invalidates its older token for that tool.
- **Rejected**: one resource per workspace with the tool as a scope. MCP clients send `resource=<the MCP server URL>` (RFC 8707) and the library accepts it only if it is a configured resource, exactly or by its query; and a scope would let one token cover several tools, against `sdk.md` §7. Redeploying the gateway on every tool creation: not needed.
- **Not verified**: the Microsoft sign-in itself (FOR-82); a real Workers deployment (workerd is the same engine). The proof keeps the registry in KV for convenience; the platform registry is a D1 table (`ARCHITECTURE.md`), and KV's propagation delay is one more reason not to use it for this.
- **Applied in**: `ARCHITECTURE.md`, "Open decisions"; `apps/gateway/src/identity/`.

## D-014 — Migrations are SQL applied in one batch; a rename is a hard rename; no expand and contract

- **Date**: 03/11/2026 · **Status**: Active
- **Decision**:
  1. A migration is `db/migrations/NNNN_<name>.ts`, `export default migration({ up, down, destructive? })`, where `up` and `down` are lists of SQL statements (or a function that writes them with a Kysely that only compiles). `forgeron build` resolves them and records them, with the fingerprint of their file, in `migrations.json`.
  2. Hosting applies a migration and its row in `_forgeron_migrations` in **one batch**: applied and recorded, or neither (D-012). One migration at a time, in the order of their names; the first failure stops there. A file that changed after it was applied, a migration the build lacks, one numbered before an applied one, and a destructive one without `--allow-destructive` are refused before anything runs.
  3. `forgeron db generate` compares `db/schema.ts` with `db/migrations/meta/snapshot.json`, writes the next migration and the new snapshot. `forgeron build` fails when the schema moved since the last migration (`sdk.md` §14).
  4. **A rename is a hard rename**: the generator sees a column or a table that disappeared and another that appeared, and writes a drop and an add (marked `destructive`). It does not carry data across, and there is no `expand` then `contract`.
- **Why**: Forgeron is not in production and has no user: nothing is worth the machinery that keeps data alive across a rename, and a rename the generator would have to guess from a schema diff is ambiguous anyway. D1 has no interactive transaction, so a migration written as code that runs between statements could not be atomic; a list of statements can.
- **Table rebuilds**: SQLite cannot make some changes with `ALTER TABLE` (a new unique column, a changed type, nullability or default, a default that is the time). The generator then creates the new table, copies the rows over, drops the old, renames. **A table that other tables point at is not rebuilt**: measured on D1, dropping it deletes the rows of the tables that cascade from it, with no error, even with `PRAGMA defer_foreign_keys` (`packages/hosting/src/d1-atomicity.test.ts`). The generator refuses and says to write that migration by hand.
- **Reversible**: `down` is the diff the other way. What `up` dropped does not come back (a dropped column returns empty).
- **Rejected**: `expand`/`contract` migrations for renames and drops (FOR-114, cancelled); migration code that runs Kysely between statements (not atomic); a rebuild that silently deletes child rows.
- **Not done**: `forgeron db migrate | status | rollback | seed | shell` (FOR-115): `forgeron dev` applies the migrations, and `revertMigrations` exists in `@forgeron/hosting` for the rollback command; applying them on a remote account (self-host).
- **Applied in**: `sdk.md` §8; `@forgeron/sdk/db` (`migration`, snapshot), `@forgeron/compiler` (diff, generate, build), `@forgeron/hosting` (`applyMigrations`, `revertMigrations`, `Hosting.migrate`).

## D-015 — API and CLI tokens are signed, carry a `<workspace>/<tool>` audience, and have no default lifetime

- **Date**: 03/11/2026 · **Status**: Active
- **Decision**: a token for the API or the CLI is `fgt.<claims>.<signature>`: claims `{ sub, aud, iat, exp }` as base64url JSON, signature HMAC-SHA256 of `fgt.<claims>` under a gateway secret, through Web Crypto. `aud` is `<workspace>/<tool>` (`acme/crm`). Roles are not in the token: the gateway resolves them at each call. The tool's runtime refuses a token whose audience is not its own (`audience` option, `403 FORBIDDEN`); the signature is checked before anything in the token is read. MCP tokens are the OAuth tokens of D-013, whose audience is the tool's resource URL.
- **Lifetime**: `issueToken` takes a required `ttlSeconds` and has no default. The values (personal API token, `forgeron login`) belong to the flows that issue them and are not decided here.
- **Why**: `sdk.md` §7, Isolation point 5: all tools of a workspace share one origin, so a token for one tool must be useless on another. A signed token needs no lookup; a per-call role resolution keeps a role change effective at once.
- **Rejected**: roles inside the token (stale until expiry); one token per workspace with the tool as a scope (one token could cover several tools).
- **Not done**: revocation (a signed token is good until `exp`); the secret's storage and rotation; the endpoints that issue tokens (SSO sign-in, FOR-82); view tokens (out of scope of FOR-38).
- **Applied in**: `apps/gateway/src/identity/` (`audience.ts`, `tokens.ts`, `authenticate.ts`); `packages/runtime` (`audience`, `Authenticated`).

## D-016 — Views are served with a sandbox CSP and call their tool with a 15-minute token

- **Date**: 03/11/2026 · **Status**: Active
- **Decision**: the gateway answers `GET <view path>` with a page carrying `Content-Security-Policy: sandbox allow-scripts allow-forms allow-popups allow-downloads` (no `allow-same-origin`: the page has an opaque origin). The person must hold the view's `access` level before the page is rendered or a token issued. The page embeds a JSON bootstrap (`ViewBootstrap` in `@forgeron/runtime`): the person, their grants and a token of D-015 whose audience is `<workspace>/<tool>`, lifetime **15 minutes** (`VIEW_TOKEN_TTL_SECONDS`). The hooks of `@forgeron/sdk/react` call `POST <base>/_f/call/<action>` with it (`createHttpRuntime`); the runtime refuses it on any other tool. Built files are served at `/_f/views/<file>` with the same CSP and no authentication: a sandboxed page loads its scripts without cookies, and the files are static code, not data. The path under `_f/views/` is decoded, and refused if it has an empty, `.` or `..` segment or a backslash.
- **Why**: `sdk.md` §7, Isolation points 2 and 3. The ticket left the lifetime "to be defined"; 15 minutes is a starting value, to be revised with the refresh flow.
- **Rejected**: `allow-same-origin` (the page could read the workspace's cookies); authenticating the files by cookie (never sent by an opaque origin).
- **Not done**: refreshing a token before it expires (the hooks fail with "reload the page"); the browser script that mounts a view with `createHttpRuntime` (a wrapper generated by the build); reading the built files from the tool's version in the registry (`ViewAssets` is the seam); the dedicated views origin, the fallback if the sandbox gets in the way; wiring `serveView` into the dispatcher.
- **Applied in**: `apps/gateway/src/views/serve.ts`; `packages/sdk/src/react/http.ts`; `packages/runtime` (`ViewBootstrap`).

## D-017 — The gateway reaches tool Workers through a dispatch namespace in cloud, `TOOL_<WORKER>` bindings in self-host

- **Date**: 03/11/2026 · **Status**: Active
- **Decision**: the dispatcher asks for a Worker by name (`<workspace>--<tool>--production|pilot|pr-<n>`); `createGateway` finds it in the mode it runs in. With a `DISPATCHER` binding (a dispatch namespace, cloud), it calls `DISPATCHER.get(name)`; a script that no longer exists makes the Fetcher throw "Worker not found", which answers 502 like a missing binding. Without it (self-host), the Worker is the service binding named `TOOL_<NAME IN UPPER CASE, - → _>`: `acme--crm--production` is `TOOL_ACME__CRM__PRODUCTION`. Only a value that can `fetch` is taken for a tool, and no other binding (`DB`, `BASE_DOMAIN`) can match a name that starts with `TOOL_`.
- **Why**: `sdk.md` §7, "Routing on Cloudflare"; D-009. Worker names are `[a-z0-9-]`, so the binding name is one to one with the Worker name, and the existing check that a Worker belongs to the workspace and the tool still holds in both modes.
- **Rejected**: one binding name per tool in the registry (state to keep in sync with the gateway's configuration); falling back from the namespace to a binding (two ways in for one Worker).
- **Not done**: the `dispatch_namespaces` entry of `wrangler.jsonc` (the namespace name is the account's, left as a comment); redeploying the gateway with a new binding when a tool is created in self-host (hosting; see D-029 for the hosting side); custom domains.
- **Applied in**: `apps/gateway/src/dispatch/targets.ts`, `apps/gateway/src/gateway.ts`.

## D-018 — In cloud mode the script is sent at `activate`, after the migration, not at `upload`

- **Date**: 03/11/2026 · **Status**: Active
- **Decision**: `createCloudHosting` provisions the tool's D1, KV and R2 (same names as self-host: `<worker>--db|cache|files`), keeps the build at `upload` without sending anything, runs `migrate`, and sends the script at `activate`: `PUT /workers/dispatch/namespaces/<namespace>/scripts/<worker>`, multipart, a `metadata` part (`main_module`, `compatibility_date`, the `bindings` of the resources) and the module. `teardown` deletes the script, then the resources by name.
- **Why**: the Cloudflare documentation describes the upload to a namespace as an upload that serves at once (first uploads are deployed synchronously, changelog of 2025-02-20) and does not describe a version that waits for a deployment, as classic Workers have (used by self-host). Sending the script last keeps `sdk.md` §8, point 4: a failed migration leaves the previous script serving.
- **Not verified**: everything here is tested against a simulated API built from the documentation. Whether a user Worker with its own D1 can be uploaded and called in a real namespace is FOR-36, which has not been run; the delete endpoint of a script is assumed to mirror the upload one. If Workers for Platforms has a version and deployment split after all, `upload` should send a version, as self-host does.
- **Not done**: a queue resource (refused with a 501, as in self-host); the gateway side, which reaches the script through the namespace binding (D-017); custom limits and an outbound Worker.
- **Applied in**: `packages/hosting/src/cloud/`, `packages/hosting/src/resources.ts` (shared with self-host), `multipart` upload in `self-host/cloudflare.ts`.

## D-019 — Workspace sign-in is OpenID Connect with PKCE; the session is a signed `__Host-` cookie

- **Date**: 03/11/2026 · **Status**: Active
- **Decision**: the gateway signs a person in through the workspace's OIDC provider (authorization code with PKCE `S256`, `state`, `nonce`); Microsoft Entra ID and Google Workspace are OIDC providers. The ID token is accepted only if it is RS256, signed by a key of the provider's JWKS, from the expected issuer, for the client, unexpired, with the expected nonce; the discovery document must name the issuer that was asked. The provider's identity is then mapped to a person of the workspace (`resolvePerson`); a non-member is refused with no session. The session is `__Host-fg_session`: `HttpOnly; Secure; SameSite=Lax; Path=/`, no `Domain`, HMAC-signed, bound to its workspace, with a required lifetime (no default). It is not a tool token: tools take audience tokens (D-015).
- **Why**: `sdk.md` §7, Isolation point 4. `__Host-` stops a sibling subdomain from setting the cookie; binding the session to a workspace stops it from working in another.
- **Not done**: SAML; the per-workspace provider configuration and the person table (the hooks `providerFor` and `resolvePerson` are not backed by the registry); wiring `/auth` into the Worker; session lifetime values; revocation. Proven against a simulated provider only: no real Entra or Google sign-in was tried.
- **Applied in**: `apps/gateway/src/identity/` (`oidc.ts`, `session.ts`, `auth.ts`, `sealed.ts`).

## D-020 — Views are a statically served React app that calls actions, not server-rendered pages

- **Date**: 03/11/2026 · **Status**: Active
- **Decision**: a view is built into static files (`views/`, one ES module per view, `sdk.md` §14) and served by the gateway; it reads and writes through the hooks of `@forgeron/sdk/react`, which call `POST <base>/_f/call/<action>`. No server-side rendering.
- **Why**: this is what the code already does (FOR-52, FOR-56, FOR-59, D-016); the hook model (`useAction`, `useMutation`) is a client model, and a view then holds no more rights than the person's token (`sdk.md` §7, Isolation).
- **Rejected**: server-side rendering (a second rendering path, and developer code running on the workspace origin, against Isolation point 1).
- **Decided by**: the user delegated open decisions to the assistant on 03/11/2026 ("prend les décisions"); revisable.
- **Applied in**: FOR-35 closed; `sdk.md` §11, §14.

## D-021 — Pilot and production share one database, with a strict compatibility check at deployment

- **Date**: 03/11/2026 · **Status**: Active
- **Decision**: the pilot and production environments of a tool use the same D1 database. A version served to the pilot cannot ship a migration that is incompatible with the version currently in production; the check happens at deployment (`sdk.md` §8, point 5).
- **Why**: it is the current design, and the only one under which the pilot group sees real data, which is the point of a pilot. A separate pilot database would test against data that is not the real one.
- **Rejected**: a separate pilot database (kept as a possible later option if tools need destructive pilots; trade-offs were never specified).
- **Not done**: the compatibility check itself is not implemented (FOR-48 explicitly leaves it out).
- **Decided by**: delegated on 03/11/2026; revisable.
- **Applied in**: FOR-58 closed; `sdk.md` §8, §20.

## D-022 — D1 only for now; a Postgres option through Hyperdrive is not offered

- **Date**: 03/11/2026 · **Status**: Active
- **Decision**: the only database engine is D1 (`resources.db.engine` is the literal `d1`). A Postgres option through Hyperdrive is not offered in the first versions.
- **Why**: D-010, D-012 (atomic batch) and D-014 (migrations as SQL batches) are all written for D1; a second path doubles the migration, test and seed surface for a need no customer has expressed.
- **Rejected**: D1 and Postgres from the start.
- **Revisit when**: a customer brings an existing Postgres and the SDK database API is not yet frozen (the deadline given by the ticket).
- **Decided by**: delegated on 03/11/2026; revisable.
- **Applied in**: FOR-15 closed.

## D-023 — No tool owner role: workspace roles only

- **Date**: 03/11/2026 · **Status**: Active
- **Decision**: there is no "tool owner" role distinct from the workspace roles. Administering a tool (deployment tokens, approvals, secrets) requires the workspace's `admin` level. A developer who must administer a tool is given that level.
- **Why**: a second role axis changes role resolution and the minimum-role rules of the admin MCP (FOR-90, FOR-107) for a need that is not shown; the workspace roles are already enforced identically on every interface.
- **Rejected**: a per-tool owner role (more rules to prove on every interface).
- **Revisit when**: a developer must administer their tool without workspace admin rights.
- **Decided by**: delegated on 03/11/2026; revisable.
- **Applied in**: FOR-100 closed.

## D-024 — A seat is a person who made an authenticated call in the workspace during a calendar month

- **Date**: 03/11/2026 · **Status**: Active
- **Decision**: a seat is counted per workspace and per calendar month (UTC): a person is counted once if at least one authenticated call, through any interface (MCP, API, CLI, web), reached a tool of the workspace that month. Jobs and calls made by a tool on its own behalf do not count. The store keeps only the workspace, the person's identifier and the month, nothing the identity layer does not already hold.
- **Why**: the plan is "one seat gives access to all the tools" (white paper); counting activity rather than invitations means a person with access but no use is not billed. It needs no data beyond identity.
- **Rejected**: counting every member of the workspace (bills inactive accounts); counting per day or per tool (the plan is per seat, not per tool).
- **Not decided**: price and threshold (FOR-37), invoicing and payment.
- **Decided by**: delegated on 03/11/2026; this is a product definition and the most likely one to change.
- **Applied in**: FOR-83.

## D-025 — `forgeron login` signs in through the browser on a loopback address with PKCE

- **Date**: 03/11/2026 · **Status**: Active
- **Decision**: `forgeron login` starts a one-shot server on `127.0.0.1` (a random port, only `/callback`), opens `<endpoint>/auth/cli?redirect_uri&state&code_challenge&code_challenge_method=S256` in the browser (the URL is printed too), and waits for the workspace to send the person back with a one-time `code` and the same `state`. It then trades the code with the PKCE verifier at `POST <endpoint>/auth/cli/token` for the person's token, stores it, and never puts a token in a URL. A `state` that is not its own, or a refusal, stores nothing. `whoami` asks `GET <endpoint>/whoami`; `logout` forgets the token from the keychain and the file.
- **Storage**: the system keychain through a `Keychain` interface (`io.keychain`), else `~/.config/forgeron/credentials` created `600` in a `700` folder (an older, wider file is narrowed). A keychain that refuses falls back to the file; a token in the keychain removes the file.
- **Why**: `sdk.md` §4: a person's credentials are never in the project. The loopback redirect with PKCE is the usual way a CLI signs in through a browser, and keeps the token out of the browser's history and the command line.
- **Not done**: the gateway side of `/auth/cli`, `/auth/cli/token` and `/whoami` does not exist (these paths are what the CLI asks for, simulated in the tests); the OS keychain adapters were written afterwards (D-033); no real sign-in was tried.
- **Applied in**: `apps/cli/src/commands/login.ts`, `apps/cli/src/credentials.ts`, `apps/cli/src/io.ts`.

## D-026 — `--auth wrangler` installs with the wrangler session token and never stores it in the gateway

- **Date**: 03/11/2026 · **Status**: Active
- **Decision**: `forgeron platform install --auth <token|wrangler|oauth>` resolves the Cloudflare credential through a provider (`apps/cli/src/commands/cloudflare-auth.ts`). `token` (default) reads `CLOUDFLARE_API_TOKEN`. `wrangler` runs `wrangler auth token` (no shell, through `io.capture`) and uses its output for the installation's Cloudflare calls only. `oauth` is reserved and refused with exit 2.
- **Gateway secret**: the gateway's `CLOUDFLARE_API_TOKEN` binding is a durable credential it uses to deploy tools without the person present. A wrangler OAuth token is the person's short-lived session token (refreshed by wrangler), so it is never stored. With `--auth wrangler` the binding is set from `GATEWAY_CLOUDFLARE_API_TOKEN` (an API token limited to Workers, D1, KV and R2) when that variable is set; otherwise it is skipped, and the command says so and how to set it afterwards.
- **Why**: nobody has to create a token by hand for the installation, and the installation stays honest: a session token that expires would leave a gateway that silently cannot deploy.
- **Rejected**: storing the wrangler token (expires); making `GATEWAY_CLOUDFLARE_API_TOKEN` mandatory (blocks the installation for a binding that can be set later); a Forgeron-owned Cloudflare OAuth client (out of scope: not evaluated; whether refresh tokens are issued to self-managed clients is not verified).
- **Not changed**: the token handling (never an argument, never printed), the permissions the gateway needs, and the default behaviour without `--auth`. Not verified against a real wrangler: the exact output of `wrangler auth token` is assumed to be the token alone on one line (anything else is refused).
- **Applied in**: FOR-117.

## D-027 — Members live in the registry; sign-in admits the configured administrator and allowed email domains, nobody else

- **Date**: 03/11/2026 · **Status**: Active
- **Decision**: the people of a workspace are rows of a `members` table in the platform D1 (`workspace`, `id`, identity-provider `subject`, `email`, `name`, `roles` as JSON), unique per `(workspace, subject)`. At sign-in (`resolvePerson`, D-019) a known `subject` is that member; otherwise an email equal to `ADMIN_EMAIL` becomes a member with the role `admin`, an email whose domain is in `MEMBER_EMAIL_DOMAINS` becomes a member with no role, and anyone else is refused (`403`, no session). One resolver, `createCaller`, turns a session cookie or an audience-bound token issued for the workspace into the member and their roles, read at each call; it serves the console API, the dispatcher's `identify` (seats) and `canPreview` (administrators and developers), and `/deploy-tokens`. A deployment token resolves to nobody. `POST /auth/token {tool, days}` issues a personal token to a signed-in session only (not to another token), 1 to 30 days, for a tool that exists; the lifetime bound is a starting value.
- **Why**: D-019 left `providerFor` and `resolvePerson` unbacked, and roles had no source. The identity provider of a self-hosted install is the company's own, so its issuer and client come from bindings (FOR-120) and a domain allowlist is the simplest admission rule that fails closed.
- **Know**: the email is matched as the provider states it; `oidc.ts` does not check `email_verified`, so a provider that lets people claim unverified emails would admit them. One provider and one admin email for all workspaces of a gateway, which is right for self-host and wrong for a multi-tenant cloud.
- **Rejected**: first person to sign in becomes admin (anyone who reaches the sign-in page of a new workspace would); roles as a claim of the provider (a provider-specific mapping).
- **Not done**: `inPilot` (no pilot group data exists, so pilot is served to nobody); listing, removing or re-roling members; `/auth/cli`, `/auth/cli/token` (D-025 asks for a person's CLI token, but D-015 tokens are bound to one tool, so what audience a CLI token has needs a decision); revocation; `/mcp`, `/api`, `/cli` (FOR-107); preview URLs returned by `POST /deploy` do not carry `@<branch>`.
- **Applied in**: `packages/registry` (`0008_members`), `apps/gateway/src/gateway.ts`, `identity/caller.ts`, `identity/issue.ts`; `docs/self-host.md`.

## D-028 — The gateway is built with Rolldown into `apps/gateway/dist/worker.js`; the compatibility settings are named once in `@forgeron/hosting`

- **Date**: 03/11/2026 · **Status**: Active
- **Decision**: `bun run --cwd apps/gateway build` (`apps/gateway/scripts/build.ts`) bundles `src/worker.ts` with Rolldown (`platform: "neutral"`, conditions `workerd`, `worker`, `browser`, `node:*` left external) into one ES module, `dist/worker.js`. `worker.ts` re-exports only the default handler: workerd treats each named export of the main module as an entrypoint and refuses `DEPLOY_SCOPE` (a string) at startup. The compatibility date and flags are `GATEWAY_COMPATIBILITY_DATE` and `GATEWAY_COMPATIBILITY_FLAGS` in `packages/hosting/src/gateway-runtime.ts`; the build is independent of them, `forgeron platform install` reads them, and a test checks that `wrangler.jsonc` (kept for `wrangler dev`) states the same.
- **Compared** (measured 03/11/2026 on this repository, `wrangler` 4.157.0 fetched with `bunx`, not a dependency):
  - `wrangler deploy --dry-run --outdir`: works with the same entry (bundle 866 KB unminified, no `node:*` import) once `assets.directory` exists, since the dry run fails while `apps/console/dist` is missing and no console build exists. It adds a large tool to the repository and a second place that decides how the bundle is made.
  - Rolldown: already pinned (`rolldown` 1.2.16, used by `@forgeron/compiler` for tools, D-006), no new dependency, no assets requirement; 243 KB, no `node:*` import in the bundle.
- **Why Rolldown**: `docs/ARCHITECTURE.md` already chooses it; the gateway's bundle needs nothing wrangler adds (no assets, no bindings, the install sets those).
- **Rejected**: wrangler as the build (a dependency and an assets directory for a file the install uploads by itself).
- **Not verified**: the bundle runs in Miniflare (workerd of `miniflare` 4.20260730.0), which refuses a compatibility date after 2026-08-06, so the test loads it with that date, the older of the two; a real Cloudflare account was not tried. The bundle is not minified.
- **Applied in**: FOR-121.

## D-029 — In self-host the gateway is redeployed with `inherit` bindings to add or remove a tool's `TOOL_<WORKER>` binding

- **Date**: 03/11/2026 · **Status**: Active
- **Decision**: `createSelfHostHosting` takes an optional `gateway` (`createGatewayBindings`, `packages/hosting/src/self-host/gateway-bindings.ts`). After `activate` has deployed a tool Worker it calls `bind(worker)`; `teardown` calls `unbind(worker)` before it deletes the Worker (a service binding to a Worker that is gone cannot be deployed). Each uploads a new gateway version through `POST /workers/workers/<gateway>/versions` and deploys it at 100%. The version lists every binding the gateway has now as `{ type: "inherit", name }`, plus the new `{ type: "service", name: "TOOL_<WORKER>", service: "<worker>" }` (or minus the removed one). A Worker already bound, or an unbinding of a Worker that is not, uploads nothing.
- **What the Cloudflare documentation says** (read 03/11/2026, `workers/observability/errors` "Inherit binding errors (10057)", `workers/platform/infrastructure-as-code`, the 2025-09-03 changelog "new Workers API"): a version is an immutable snapshot of code and bindings, and creating a version never changes what is deployed; the bindings of a version are its own, so a new version that lists only `TOOL_X` would lose `DB`, the plain values and the gateway's secret. An `inherit` binding copies a binding "from an earlier version" without sending its value, which is how a secret survives (its value cannot be read back). Script upload endpoints inherit from "the most recently uploaded version of your Worker. That version is not always the deployed version"; the beta Versions endpoints used here take a `version_id` (an id, a prefix of 8 characters or more, or `"latest"`). An `inherit` that cannot be resolved fails the upload with error 10057, one error per binding, instead of dropping it.
- **How it is tested**: `FakeCloudflare` resolves `inherit` from the most recent earlier version and answers 400 (10057) for an unknown name; `gateway-bindings.test.ts` checks that the secret's value is in the deployed version and never in the upload, that other tools' bindings and the plain values stay, that a second deployment of a bound tool uploads nothing, that the gateway is deployed after the tool and unbound before its deletion, and that an unknown name fails loudly.
- **Why**: no secret to store or read back, no list to keep beside the Cloudflare account; the gateway's own `env` is the list of what it holds.
- **Not done / not verified**: (1) the code of the new gateway version comes from an injected `code()`; where the running gateway gets its own `worker.js` is not decided (the endpoint that returns a deployed script's content was not checked in the documentation), and nothing builds the `gateway` option into the gateway yet (that is `apps/gateway/src/index.ts`, FOR-123). (2) The names come from the gateway's `env` at the time of the call: two tool deployments in flight at once, each started from an `env` that predates the other's binding, can lose one binding (the other one's deployment fails or is retried, and a retry binds again). (3) No `version_id` is sent, so `inherit` copies from the latest uploaded version, which is the deployed one only because the gateway is always uploaded and deployed together; an upload left undeployed by someone else would be the source. (4) `inherit` of an `assets` binding was not checked. (5) Nothing was tried against a real account.
- **Applied in**: FOR-119.

## D-030 — `platform install` generates the gateway's two keys once and keeps them; the identity settings come from flags and the environment

- **Date**: 03/11/2026 · **Status**: Active
- **Decision**: the install sets `AUTH_SECRET` and `SECRETS_KEY` (32 bytes from `crypto.getRandomValues`, base64, `secret_text`; never printed, never an argument) and the identity settings read from flags `--oidc-issuer`, `--oidc-client-id`, `--admin-email`, `--member-email-domains` and the environment variable `OIDC_CLIENT_SECRET` (`apps/cli/src/commands/gateway-identity.ts`). The settings are checked before any call: an `https` issuer without query or fragment, a client id without spaces, an email and domains of the usual shape, issuer and client id together, and at least one of the admin email and the domains (the gateway admits nobody else, D-027). Without any identity flag nothing is stated and the previous version's settings are kept.
- **Keeping a key**: the value of a secret cannot be read back, so the new gateway version lists `{ type: "inherit", name }` for each key and each setting that is not stated, as D-029 does for `TOOL_<WORKER>`. When the Worker did not exist, the keys are generated. When it existed and Cloudflare answers 400 naming a binding (error 10057, "no binding with the inherited name"), that key is generated and that optional setting is left out, and the upload is made once more; any other 400 is raised.
- **Why**: replacing `AUTH_SECRET` signs everyone out and voids every token; replacing `SECRETS_KEY` makes stored tool secrets unreadable. A re-run must therefore never replace them, and reading nothing back means asking Cloudflare to copy.
- **Rejected**: reading the previous version's bindings first (the endpoint and the shape of a secret binding in its answer were not checked in the documentation); deriving the keys from the API token or a passphrase (a stolen deploy token would then give the keys); an `--auth-secret` flag (a secret in the shell history).
- **Not verified**: against a real account. (1) That the 10057 error of the beta versions endpoint names the failing binding in its message: the code looks for the binding name in the error message, and raises the error when none is found. (2) That an `inherit` of a name that the previous version lacks fails rather than being dropped on this endpoint (the documentation says so for the beta endpoints and the opposite, without `bindings_inherit=strict`, for the script upload endpoints). (3) A re-run replaces stated OIDC settings but cannot remove one (leaving `OIDC_CLIENT_SECRET` unset with a provider stated drops it, which is how a public client is set).
- **Known, not changed**: the install's own version lists only the bindings the install knows, so a re-run drops the `TOOL_<WORKER>` bindings of tools already bound (D-029); and with `--auth wrangler` and no `GATEWAY_CLOUDFLARE_API_TOKEN`, a re-run drops a `CLOUDFLARE_API_TOKEN` secret set by hand. Both need the same `inherit` treatment, which needs the names.
- **Applied in**: FOR-120.

## D-031 — `forgeron login` gets a CLI token scoped `cli` for the platform, one-time PKCE code, 30 days

- **Date**: 03/11/2026 · **Status**: Active
- **Decision**: the gateway side of D-025. `GET /auth/cli` checks `redirect_uri` is exactly `http://127.0.0.1:<port>/callback`, `state` and a `S256` `code_challenge`; without a session it sends the browser through `/auth/login?next=…` (the sign-in only returns to a `/auth/cli?…` path), with one it redirects to the loopback with `code` and `state`. The code is sealed (`fgc`): person, workspace, challenge, redirect URI, 60 seconds, a random id. `POST /auth/cli/token {code, code_verifier, redirect_uri}` checks the signature, expiry, workspace, that `SHA-256(verifier)` is the challenge and the redirect URI is the same, **spends the id** (`cli_codes` table, so a code works once), and that the person is still a member; then issues a token of 30 days. D-015 binds a token to `<workspace>/<tool>` and a CLI token has no tool: its audience is `<workspace>/platform` and it carries scope `cli`, so every tool refuses it (a scoped token is refused where no scope is asked) and only the platform's own routes accept it (`/whoami`, console API, `/deploy-tokens`); it cannot mint tokens (`/auth/token` is for a session) and is not counted as a seat at the dispatcher.
- **Why**: a token that works on tools would break `sdk.md` §7, Isolation point 5; a scope reuses the mechanism deployment tokens already have. The CLI's flow (apps/cli) matches D-025 and was not changed.
- **Rejected**: stateless codes (replayable inside their 60 seconds); a token without audience (D-015); letting a CLI token call tools (the CLI would then hold the person's reach over every tool).
- **Not done**: revocation (30 days to its expiry); a real browser and a real provider were not tried; the CLI cannot yet use the token to call tools or deploy beyond what the platform routes accept.
- **Applied in**: `apps/gateway/src/identity/cli.ts`, `caller.ts`, `auth.ts` (`next`); `packages/registry` (`0009_cli_codes`, `spendCode`).

## D-032 — The gateway keeps its own code in the platform D1, and `platform install` carries the tool bindings over

- **Date**: 03/11/2026 · **Status**: Active
- **Decision**: (1) `platform install` stores `worker.js` in the platform D1 (`gateway_code`, migration 0010, in chunks) and sets the plain binding `GATEWAY_WORKER` (the gateway's own name). The gateway's self-host hosting (`gatewayBindingsOf`, `apps/gateway/src/gateway.ts`) builds `createGatewayBindings` (D-029) from them: on `POST /deploy` it uploads a new version of itself from that code, `inherit`ing every key of its own `env`, adds the `TOOL_<WORKER>` service binding and deploys it; `teardown` removes it; a Worker already in `env` uploads nothing. (2) A re-run of the install reads the registry's `environments`, derives each `TOOL_<WORKER>` and sends it as `inherit`; if Cloudflare answers 10057 for one (an environment registered but never bound) the install retries without it and names it.
- **Why**: a version cannot be uploaded without code, and the Cloudflare documentation read on 03/11/2026 gives no way to read the bindings of a version back; the code of the deployed script is reachable at `GET .../workers/scripts/<name>/content/v2` (path confirmed in the API reference, response format and version served not), so the code is kept where the gateway can read it with certainty. The registry already holds the list of environments, so it is the list of bindings to keep.
- **Rejected**: reading the script back from Cloudflare (format unverified); storing the code in a secret or plain binding (size limit); an install that drops the tool bindings (tools unreachable after each install).
- **Not done / not verified**: the assets are kept with `keep_assets: true`, documented for the upload endpoints ("Direct Upload"), not tried on the beta versions endpoint, and their routing config (`not_found_handling`, `run_worker_first`) may not survive it; `Object.keys(env)` is the list of bindings (workerd's `env` enumerates them, not checked); two tool deployments at the same moment can lose a binding; a gateway installed before this change has no stored code until the install is run again; nothing was tried on a real account.
- **Applied in**: FOR-119.

## D-033 — The keychain is the macOS `security` tool or Linux `secret-tool`, fed on standard input; Windows uses the 600 file

- **Date**: 03/11/2026 · **Status**: Active
- **Decision**: `apps/cli/src/keychain.ts` implements the `Keychain` interface of D-025 on macOS (`security -i`, which reads its commands from standard input: `add-generic-password -U -s forgeron -a forgeron -w "<token>"`; reading is `find-generic-password -w`, forgetting `delete-generic-password`) and on Linux (`secret-tool store|lookup|clear service forgeron account forgeron`, the secret on standard input). The token is never an argument, so it is not in `ps`; a token with a character outside printable ASCII is refused rather than quoted. Programs are started through an injectable `Runner` (no shell, standard error discarded), so tests use a fake runner and never touch a keychain. On Windows (and any other system) there is no adapter and the `~/.config/forgeron/credentials` file (the folder is not locked down by Windows file modes; `600` is best-effort there) is used; the Windows Credential Manager has no command that takes a secret without an argument, and a native module is not worth it for now.
- **Fallbacks**: a keychain that fails (no `secret-tool`, no session bus on a headless Linux, locked keychain) falls back to the file, as D-025 says. A token found only in the file when a keychain exists is moved to the keychain on the next read, and the file is removed only once the keychain holds it.
- **Rejected**: `security add-generic-password -w <token>` (argument); `security ... -w` with no value (prompts on the terminal, not on a pipe); keytar-like native modules (build and distribution cost); a Windows adapter through PowerShell `PasswordVault` (not tried, no machine to test on).
- **Not verified**: no real macOS Keychain or libsecret was driven (the runner is faked): the exact `security -i` quoting and exit codes (44 for not found) come from the manual page and common use, and `secret-tool` exit codes for a missing entry are assumed non-zero.
- **Applied in**: FOR-85.

## D-034 — Each template deploys as a preview per pull request, announced by a comment, closed through `DELETE /deploy`

- **Date**: 03/11/2026 · **Status**: Active
- **Decision**: `.github/workflows/templates-preview.yml` runs on `opened, synchronize, reopened, closed`. For the first three, each template is tested, checked and deployed as a preview of the pull request's branch (the deploy action, one `FORGERON_TOKEN_<NAME>` secret per template) and, when an address came back and the pull request is not from a fork, a comment per template (found by a hidden marker, edited on each push) gives the address. On `closed` (merged or not) a `close` job runs `forgeron preview close` per template, through `DELETE /deploy {branch}` with the same deployment token: the gateway tears the preview down and forgets it (`closePreview`, already in the registry); a branch with no preview answers `closed: false`, not an error. The deploy action gained a `close` input and a `urls` output (one `<tool> <address>` line per deployed tool, read from the CLI's `Deployed … : <address>` line).
- **Skips**: without the repository variable `FORGERON_WORKSPACE` or the template's secret (forks, no workspace yet) the templates are only tested and checked, no comment is posted and the close job does not run; nothing fails for that.
- **Why**: the gateway had `closePreview` but no way to call it, and a preview uses a Worker out of 500 per account (D-009), so closing had to be reachable from CI with the credential CI already has. The tool is the token's, as for deploy, so a token cannot close another tool's preview.
- **Rejected**: a separate close workflow (the matrix would be written three times); a comment through a third-party action (a dependency for ten lines of `gh api`); closing with an administrator's token (CI would hold a person's reach).
- **Not verified**: no real workspace, so no real preview was deployed, commented or closed; the workflow was not run by GitHub (`actionlint` is not installed here: the YAML parses and the script is covered by tests); previews are empty until the gateway seed provider exists (FOR-46); the address shown is what the gateway returns (D-009: preview URLs do not carry `@<branch>` yet).
- **Applied in**: FOR-65; `apps/gateway/src/deploy/deploy.ts`, `apps/cli/src/commands/preview.ts`, `.github/actions/deploy`.
