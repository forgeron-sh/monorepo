# Decision log

Every architecture or tooling decision is recorded here, in the order it is made.

Rules of the log:

- A new entry is **added** at the end; a past decision is never rewritten.
- To reverse a decision, add a new one and set the old one's status to "Replaced by D-0xx".
- Each entry says what was decided, why, what was rejected, and where it is applied (files, sections of `sdk.md` or `ARCHITECTURE.md`).
- An external source (Cloudflare doc, trial) is cited with its date.

## Index

| No.   | Date       | Decision                                                                                                                             | Status            |
| ----- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------- |
| D-001 | 22/10/2026 | Adopt the tooling and conventions of siages                                                                                          | Active            |
| D-002 | 22/10/2026 | TypeScript 6, not 7                                                                                                                  | Active            |
| D-003 | 22/10/2026 | The CLI is an app (`apps/cli`), the SDK a package (`packages/sdk`)                                                                   | Active            |
| D-004 | 22/10/2026 | A tool is built in the CI of its repository                                                                                          | Active            |
| D-005 | 22/10/2026 | Build, version and release are three distinct notions                                                                                | Active            |
| D-006 | 22/10/2026 | One `forgeron.config.ts` = one tool                                                                                                  | Active            |
| D-007 | 22/10/2026 | Catalog templates use `forgeron release`                                                                                             | Active            |
| D-008 | 22/10/2026 | Run tools with Dynamic Workers                                                                                                       | Replaced by D-009 |
| D-009 | 22/10/2026 | Two hosting modes behind a single interface: Workers for Platforms (cloud), classic Workers (self-host)                              | Active            |
| D-010 | 22/10/2026 | One D1 database per tool and per environment, bound directly to the tool's Worker                                                    | Active            |
| D-011 | 02/11/2026 | All repository files are written in English                                                                                          | Active            |
| D-012 | 02/11/2026 | An action is atomic through one D1 batch, not through a transaction                                                                  | Active            |
| D-013 | 02/11/2026 | The gateway builds its OAuth authorization server from the registry, and caches it                                                   | Active            |
| D-014 | 03/11/2026 | Migrations are SQL applied in one batch; a rename is a hard rename; no expand and contract                                           | Active            |
| D-015 | 03/11/2026 | API and CLI tokens are signed, carry a `<workspace>/<tool>` audience, and have no default lifetime                                   | Active            |
| D-016 | 03/11/2026 | Views are served with a sandbox CSP and call their tool with a 15-minute token                                                       | Active            |
| D-017 | 03/11/2026 | The gateway reaches tool Workers through a dispatch namespace in cloud, `TOOL_<WORKER>` bindings in self-host                        | Active            |
| D-018 | 03/11/2026 | In cloud mode the script is sent at `activate`, after the migration, not at `upload`                                                 | Active            |
| D-019 | 03/11/2026 | Workspace sign-in is OpenID Connect with PKCE; the session is a signed `__Host-` cookie                                              | Active            |
| D-020 | 03/11/2026 | Views are a statically served React app that calls actions, not server-rendered pages                                                | Active            |
| D-021 | 03/11/2026 | Pilot and production share one database, with a strict compatibility check at deployment                                             | Active            |
| D-022 | 03/11/2026 | D1 only for now; a Postgres option through Hyperdrive is not offered                                                                 | Active            |
| D-023 | 03/11/2026 | No tool owner role: workspace roles only                                                                                             | Active            |
| D-024 | 03/11/2026 | A seat is a person who made an authenticated call in the workspace during a calendar month                                           | Active            |
| D-025 | 03/11/2026 | `forgeron login` signs in through the browser on a loopback address with PKCE and stores the token in the keychain or a 600 file     | Active            |
| D-027 | 03/11/2026 | Members live in the registry; sign-in admits the configured administrator and allowed email domains, nobody else                     | Active            |
| D-029 | 03/11/2026 | In self-host the gateway is redeployed with `inherit` bindings to add or remove a tool's `TOOL_<WORKER>` binding                     | Active            |
| D-031 | 03/11/2026 | `forgeron login` gets a CLI token scoped `cli` for the platform, one-time PKCE code, 30 days                                         | Active            |
| D-032 | 03/11/2026 | The gateway keeps its own code in the platform D1, and `platform install` carries the tool bindings over                             | Active            |
| D-033 | 03/11/2026 | `promote` and `rollback` are `POST /promote` and `POST /rollback` on the gateway, for a workspace admin or a deployment token        | Active            |
| D-034 | 03/11/2026 | The pilot group is a named set of members in the registry, edited through the console API; the pilot version is served to it         | Active            |
| D-035 | 03/11/2026 | Tokens carry an id, are revoked from a list checked at each call, and the signing key rotates with an overlap                        | Active            |
| D-036 | 03/11/2026 | Per-person secrets are sealed in the platform D1, typed at the gateway, and handed to a call as the caller's own only                | Active            |
| D-039 | 03/11/2026 | The roles × actions matrix is a set of overrides in the platform D1, forwarded to the tool at each call in `x-forgeron-user`         | Active            |
| D-040 | 03/11/2026 | The matrix is edited by admins only, cell by cell, and every edit is audited                                                         | Active            |
| D-041 | 03/11/2026 | Sign-in presets for Entra ID and Google live in the platform D1 and the console API; SAML is deferred; consent is self-service       | Active            |
| D-044 | 03/11/2026 | The keychain is the macOS `security` tool or Linux `secret-tool`, fed on standard input; Windows uses the 600 file                   | Active            |
| D-045 | 03/11/2026 | Each template deploys as a preview per pull request, announced by a comment, closed through `DELETE /deploy`                         | Active            |
| D-043 | 03/11/2026 | Views and the playground honour the matrix: a view is a column `view:<name>`, one shared rule `mayAccess`, `useCanCall` for controls | Active            |
| D-047 | 03/11/2026 | The console saves the matrix in one request, applied with its audit lines in a single D1 batch                                       | Active            |
| D-046 | 03/11/2026 | A delegated connector gets the caller's own access token from the gateway, or the consent link as a 428                              | Active            |
| D-048 | 03/11/2026 | The build bundles the connector packages a tool declares; only an explicit OAuth refusal revokes a consent; grants are audited       | Active            |
| D-049 | 03/11/2026 | The gateway signs people in by email code beside OIDC; members, invitations and email domains are managed in the console             | Active            |
| D-050 | 03/11/2026 | SAML sign-in is verified by a small XML-DSig verifier on Web Crypto, trusting only the element a pinned signature covers             | Active            |

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
- **Not done**: the gateway side of `/auth/cli`, `/auth/cli/token` and `/whoami` does not exist (these paths are what the CLI asks for, simulated in the tests); the OS keychain adapters were written afterwards (D-044); no real sign-in was tried.
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

## D-033 — `promote` and `rollback` are `POST /promote` and `POST /rollback` on the gateway, for a workspace admin or a deployment token

- **Date**: 03/11/2026 · **Status**: Active
- **Decision**: `forgeron promote <version> --to <env> [--group] [--branch] [--allow-destructive]` and `forgeron rollback [--env production] [--branch]` call `POST /promote {tool, version, to, branch?, group?, allowDestructive?}` and `POST /rollback {tool, environment, branch?}` at the workspace endpoint of `.forgeron/project.json`, next to `/deploy`. The gateway runs `promoteVersion` and `rollbackEnvironment` of the registry (no rebuild: the code is the one recorded with the version's build; a rollback applies and reverts no migration). The caller is **a workspace administrator** (a session, or the CLI token of `forgeron login`, D-031) **or a deployment token of that tool** (D-025, scope `deploy`; it cannot name another tool). A developer or a plain member is refused (`403`), an anonymous call too (`401`). The CLI sends `FORGERON_TOKEN` when set (CI), else the token `forgeron login` stored. The audit line is the `deployments` row (kind `promote` or `rollback`, actor, time): the actor is the administrator's email or the token's `deploy:<name>`. Refusals keep their meaning in the status: a changelog that does not cover the change (FOR-64) `422`; a refused migration (destructive without `--allow-destructive`, compatibility, D-021) `409 MIGRATION_REFUSED`; an approval pending `409`; no earlier version `409`; unknown version or tool `404`. `forgeron deploy --env pilot --group <name>` sends `group` to `POST /deploy`, which only the pilot accepts.
- **Why**: the pieces (`promoteVersion`, `rollbackEnvironment`) existed in the registry and the D-031 token already authenticates the CLI on platform routes; moving production is an administrator's act, and CI needs the same without a person, which is what a deployment token is for. Putting the routes beside `/deploy` keeps one place that holds the hosting credentials.
- **Rejected**: letting developers promote (production is guarded by approvals for the same reason); a CLI token that works on tools (D-031); a new token scope for promotion (the deployment token is already limited to one tool and one workspace); rebuilding on promotion (the point of FOR-51).
- **Not done**: the console button for promotion (out of scope of FOR-51); the preview's URL does not carry `@<branch>` (as for `/deploy`); not run against a real Cloudflare account (the hosting is simulated in tests).
- **Applied in**: `apps/gateway/src/deploy/promote.ts`, `deploy.ts` (`group`), `gateway.ts`; `apps/cli/src/commands/promote.ts`, `deploy.ts`. FOR-51, FOR-54, FOR-57.

## D-034 — The pilot group is a named set of members in the registry, edited through the console API; the pilot version is served to it

- **Date**: 03/11/2026 · **Status**: Active
- **Decision**: a group is a name (`[a-z0-9-]`, up to 40) in a workspace and a set of its members (D-027): table `group_members (workspace, group_name, member_id)` (migration 0011, deleted with the member). The pilot environment of a tool carries the name (`pilot_group`, set by `deploy --env pilot --group` or `promote --to pilot --group`). The dispatcher gives its `inPilot` hook the group of the tool's pilot; the gateway answers yes when the caller, identified as for seats (session or tool token, D-024), is a member of that group. Anonymous callers, a pilot with no group, and a gateway with no identity get production. The group's members are read at each call, so a change is effective at once. The console API (admins only): `GET /api/groups`, `PUT /api/groups/<name> {members: [email…]}` (replaces the members; every email must be a member of the workspace, or `400 UNKNOWN_MEMBER` and nothing is written) and `GET /api/members`.
- **Why**: D-027 already stores members; groups of the SSO provider would tie the pilot to one provider and need a claim the sign-in does not read yet. Emails are what an administrator knows; ids stay internal.
- **Rejected**: a group per tool (one group serves several tools' pilots); storing the group in the token (stale until expiry, D-015).
- **Later**: emails, domains or groups from the SSO claims as a second source of members; a console screen over the groups API.
- **Applied in**: `packages/registry` (`0011_group_members`, `setGroupMembers`, `isGroupMember`, `listGroups`); `apps/gateway/src/dispatch`, `console-api/groups.ts`, `gateway.ts`. Replaces the "`inPilot`: not done" of D-027. FOR-57.

## D-035 — Tokens carry an id, are revoked from a list checked at each call, and the signing key rotates with an overlap

- **Date**: 03/11/2026 · **Status**: Active
- **Decision**: completes D-015 and D-031.
  - **Lifetimes** (already in the flows, now stated in one place): personal API token 1 to 30 days chosen by the caller (`POST /auth/token`), CLI token 30 days (D-031), view token 15 minutes (D-016), session 8 hours (D-019), deployment token 90 days by default. No token lives longer than 30 days, except a deployment token, which has its own route and is not covered here.
  - **Revocation**: a token carries a random `jti`. The registry keeps `token_revocations` (`0012`): one row per revoked `jti`, or, with no `jti`, "every token of this person issued up to `at`" (the second included: when in doubt it is refused). `createCaller` asks the registry at each call, so a revocation is immediate; a revoked token is nobody. Rows are forgotten once no token they cover can be valid (30 days). `POST /auth/token/revoke {id}` or `{all:true}` for a person's own tokens (session or CLI token; `POST /auth/token` now answers the `id`); `POST /console-api/api/people/<id>/tokens/revoke` for an admin.
  - **Rotation**: `AUTH_SECRET_PREVIOUS` (comma-separated) lists the keys `AUTH_SECRET` replaced. Tokens verify against the current key, then the previous ones; nothing is signed with a previous key. Drop a key 30 days after the rotation. Sessions (8 hours) and sign-in state use the current key only: a rotation signs people out of the browser, not out of their API tokens.
  - **Audience at the gateway**: the dispatcher asks `forward` before handing a request over; a token issued for another tool is refused there with `403` (before the Worker), on `api`, `mcp`, `cli` and `/secrets` alike. The dispatcher drops `x-forgeron-user`, `x-forgeron-user-secrets` and `x-forgeron-base-url` from what the caller sent and sets them itself: until now nothing set `x-forgeron-user` in cloud mode and a caller could have supplied it.
  - **MCP tokens**: an MCP client sends the same `fgt` token (`Authorization: Bearer`) to `/t/<tool>/mcp`; the audience, lifetime, revocation and rotation above apply unchanged, and it is refused by every other tool. The OAuth authorization server of D-013 is not mounted in the Worker: a client that needs the interactive OAuth flow waits for the admin MCP (FOR-107), and no MCP client was tried.
  - **CLI token audience** (open in the FOR-38 notes): settled by D-031, `<workspace>/platform` with scope `cli`; tools refuse it, and `/t/<tool>/secrets` accepts it (D-036).
- **Why**: a signed token needs no lookup, which is why revoking needs one; the lookup is one indexed read per authenticated call. A rotation that voided every token would force every CLI and CI to sign in again.
- **Rejected**: a `kid` in the token (two keys are tried at most; the signature stays checked first); revoking by changing a per-person counter in `members` (a second write path, and no way to revoke one token); a revocation list in KV (eventual consistency: a revoked token would still work for a while).
- **Not done**: a console screen (the routes exist); revoking deployment tokens; the OAuth server for MCP (see above); proven in tests against the in-memory D1 only.
- **Applied in**: `apps/gateway/src/identity/` (`tokens.ts`, `caller.ts`, `issue.ts`), `dispatch/dispatch.ts` (`forward`), `console-api/revocations.ts`, `gateway.ts`; `packages/registry` (`0012_token_revocations`).

## D-036 — Per-person secrets are sealed in the platform D1, typed at the gateway, and handed to a call as the caller's own only

- **Date**: 03/11/2026 · **Status**: Active
- **Decision**: `resources.userSecrets` (`sdk.md` §10). The gateway keeps them in `user_secrets` (`0013`), one row per tool, person and name, sealed with `SECRETS_KEY` (AES-GCM, the slot `user/<tool>/<person>/<name>` is the additional data). The person types them at `/t/<tool>/secrets`, which **the gateway serves itself**: the page (web), the same route with JSON (CLI, `forgeron secrets set <NAME> --user`: hidden prompt, never an argument), and the link every `428` and MCP error points to. For a call, the gateway adds the caller's own values to the request in `x-forgeron-user-secrets` and the compiler's Worker entry gives the runtime a store that reads only that header; the runtime answers `428 SECRET_REQUIRED` with the link when one is missing.
  - **MCP**: elicitation in URL mode (MCP 2025-11-25), the only mode meant for a secret: with `MCP-Protocol-Version` ≥ `2025-11-25` the call fails with the JSON-RPC error `-32042` carrying `elicitations: [{mode: "url", elicitationId, url, message}]`; older clients get the link in the text of the tool error. Form-mode elicitation is refused on purpose (the value would cross the client and the model's context).
  - **CLI**: `forgeron secrets set <NAME> --user` and `promptUserSecrets` (what a tool command calls on a `428`, with the tool's own label and reason). The commands `forgeron <tool> <group> <verb>` do not exist yet, so the on-demand prompt has no caller beyond this command.
  - **Never visible to the developer**: the form and the stored value never reach tool code except as `ctx.userSecrets` of the person who typed them, in that person's own call; no route returns a value (the page shows a field as set, the admin sees names), the platform key is not in a tool Worker, nobody can set the header, and the log of the runtime never prints one. The code of an action does see the caller's value while it runs, because that is its use; what it cannot do is read anyone else's.
  - **Revocation**: `GET /console-api/api/tools/<tool>/user-secrets` (names per person) and `DELETE …/user-secrets/<person>[/<NAME>]` for an admin. The person is asked again on the next call. The console screen is out of scope of FOR-95.
- **Why**: a Worker of the tool has no D1 of the platform (isolation) and the developer owns its code, so the store and the form cannot be in it; the header is safe because only the gateway reaches a tool Worker (D-017) and the dispatcher drops what callers send.
- **Rejected**: asking in the middle of an MCP call (a Worker answers plain JSON with no session; a Durable Object per client would be needed for it); form-mode elicitation for a secret; one secret per environment (the spec says per person and per tool); a value-returning route even for the owner (rotation is by typing again).
- **Not done**: elicitation completion notification (`notifications/elicitation/complete` needs a stream); proven in tests with the real runtime behind the gateway and the in-memory D1, no real MCP client, browser or Worker deployment was tried; the `x-forgeron-user` roles forwarded are the workspace's, the mapping to the tool's roles belongs to the access matrix work.
- **Applied in**: `apps/gateway/src/dispatch/user-secrets.ts`, `console-api/revocations.ts`; `packages/runtime` (`mcp.ts`); `packages/compiler/src/build.ts` (Worker entry); `apps/cli/src/commands/user-secrets.ts`, `secrets.ts`; `packages/registry` (`0013_user_secrets`).

## D-038 — A new preview's seed is run by the preview's own Worker on its first request; a branch's preview is removed by `DELETE /deploy`

- **Date**: 03/11/2026 · **Status**: Active
- **Decision**: (1) After migrating a fresh preview database, `deploy` fills it with `DeployOptions.seed` when the caller has one (in-process, as before). Without one (the gateway), `deploy` writes a marker row `pending` in the new database (`_forgeron_seed`, `seed-marker.ts`) and reports `database.pending: true`. The built Worker of a tool with a `db/seed.ts` (`packages/compiler/src/build.ts`) claims the marker on its first request in an isolate (`UPDATE … WHERE status = 'pending'`: one claimant), runs the seed on its own `env.DB`, then sets `done`. A seed that fails sets `failed` with the reason, and the preview answers `500 SEED_FAILED` until it is removed and deployed again (the database may be half filled, so it is never retried on it). A branch that deploys again, or `preview.data: empty`, leaves no marker. Same in both hosting modes. (2) `DELETE /deploy` `{ branch }` with the tool's deployment token removes a preview (`closePreview`: Worker, D1, KV, R2, registry entry); removing one that is already gone succeeds. CI calls it when a branch is merged or deleted. (3) `ensureDispatchNamespace` creates the cloud dispatch namespace if the account lacks it. (4) `preview.data: snapshot` stays refused.
- **Why**: the gateway is a Worker, it does not evaluate a tool's code; and in self-host it only holds a service binding to a new tool Worker after it has redeployed itself (D-029), so it cannot call the Worker during the deployment that creates it. The tool's Worker holds both the seed and the database, so it seeds itself with no coordination, whatever the mode. The first request waits for the seed, so no one sees an empty preview.
- **Rejected**: an internal `/__forgeron/seed` route the gateway calls (unreachable in self-host in the same request, and a path to protect); the gateway evaluating the seed (no `eval` in Workers); seeding from the CLI (the CLI has no access to the remote database for a tool deployed by the gateway). `snapshot` copies production data into a preview: it needs a data-protection decision (sdk.md §3 requires the admin's agreement) before any code.
- **Not done / not verified**: the preview is seeded at its first request, not at deploy; a seed that fails half way leaves the preview unusable until it is replaced; two isolates racing on the first request: the loser may answer before the seed finishes; the marker contract is split between `packages/hosting/src/seed-marker.ts` and the generated Worker entry; `meta.changes` on `.all()` of a real D1 was read in the documentation, not tried; nothing was tried on a real account. Cloud mode against Workers for Platforms: the upload endpoint `PUT /workers/dispatch/namespaces/<ns>/scripts/<name>` with a `metadata` part (`main_module`, `bindings` of type `d1` / `kv_namespace` / `r2_bucket`) and namespace creation `POST /workers/dispatch/namespaces` are confirmed by the Cloudflare documentation (WfP "Bindings", updated 31/10/2026; "Infrastructure as code"), read 03/11/2026. Not confirmed: that a user Worker can be uploaded with its own D1 on a real WfP account (FOR-36 stays a spike), the `keep_bindings` behaviour on a re-upload (the upload always sends every binding), and the queue binding (refused: 501).
- **Applied in**: FOR-46, FOR-69.

## D-039 — The matrix is a set of overrides in the platform D1, forwarded to the tool at each call in `x-forgeron-user`

- **Date**: 03/11/2026 · **Status**: Active
- **Decision**: the roles × actions matrix of a tool is the manifest's access levels (default) plus one `role_access` row per cell an admin set (`0006_role_access`); no version is involved. At each call the gateway (`forwardIdentity`, through the dispatcher's `forward` hook) resolves the caller, reads `registry.accessFor(tool, roles)` (the overrides of the caller's own roles) and sends `{ id, email, name, roles, access }` in `x-forgeron-user`; the runtime's one check (`mayCall`) gives an override priority over the levels, on MCP, API, CLI and Web alike. Nothing is cached, so an edit applies to the next call. The dispatcher always deletes `x-forgeron-user` from what the client sent (D-035's `INTERNAL_HEADERS`). The roles and actions of the matrix are those of the version production serves (else the latest): the console cannot add a role or an action, only move who may call.
- **Why**: the check stays in the runtime where FOR-90 put it, so no interface can skip it, and the override is read where the roles already are. A header the client could set would have let anyone choose their identity.
- **Rejected**: copying the matrix into each tool's environment (needs a deployment per edit); a per-interface check in the gateway (four copies to keep equal); caching the overrides in the gateway (a stale grant after a revoke).
- **Not done**: views were left to a later change (done in D-043); an override of a role or action that a later version removes stays in the table and is ignored.
- **Applied in**: FOR-43; `apps/gateway/src/dispatch/user-secrets.ts` (`forwardIdentity`); `packages/runtime` (`mayCall`).

## D-040 — The matrix is edited by admins only, cell by cell, and every edit is audited

- **Date**: 03/11/2026 · **Status**: Active
- **Decision**: `GET` and `PUT /console-api/api/tools/<tool>/access-matrix` are for the workspace's `admin` role (D-023). `PUT` takes `{ role, action, allowed }`, `allowed` being `true`, `false`, or `null` to give the cell back to the manifest's levels; it answers with the matrix. The registry writes the edit and an audit line (`kind: "access"`, subject `role:action`, detail `{ role, action, from, to }`, the admin as actor) in one batch (migration `0014_audit_access`, which rebuilds `audit_log` because SQLite cannot change a CHECK). The console drafts flips on the screen, marks each cell whose applied value differs from the manifest's default, and sends the drafted cells on Save, a cell back at its default as `null`.
- **Why**: a refused-by-default governance surface must not be writable by developers (D-023); the audit line and the write cannot disagree when they share a batch.
- **Rejected**: a whole-matrix replace (two admins editing different cells would overwrite each other); keeping an override equal to the default (it would hide a later change of the manifest's level).
- **Not done**: the admin MCP has no matrix tool. (Cell-by-cell Save and the single-cell body are replaced by D-047; views are in the matrix by D-043.)
- **Applied in**: FOR-43; `apps/gateway/src/console-api/access-matrix.ts`, `apps/console/src/access-matrix.tsx`, `packages/registry` (`0014_audit_access`).

## D-041 — Sign-in presets for Entra ID and Google live in the platform D1 and the console API; SAML is deferred; consent is self-service

- **Date**: 03/11/2026 · **Status**: Active
- **Decision**:
  1. A workspace's sign-in provider is a row of `identity_providers` (migration 0015, secret sealed with `SECRETS_KEY`), edited by an admin through `GET|PUT|DELETE /console-api/api/identity-provider`. The answer never contains the secret (`hasSecret`); a `PUT` without `clientSecret` keeps the one stored. A saved provider wins over the `OIDC_*` bindings, which remain the fallback (a gateway installed by `platform install` keeps working); removing it returns to them.
  2. Three kinds, all OIDC (D-019): `oidc` (any issuer), `entra` and `google`. `entra` needs the directory (tenant) id as a GUID (`common`, `organizations` and `consumers` are refused: they would admit other directories), derives the issuer `https://login.microsoftonline.com/<tenant>/v2.0`, requires the `tid` claim to equal it, and reads the email from `preferred_username` (the UPN: `email` is an optional claim) and the groups from `groups`. `google` needs the Workspace domain, uses the issuer `https://accounts.google.com`, requires the `hd` claim to equal it, and sends `hd` to the account chooser as a hint only. `emailClaim` and `groupsClaim` override the defaults. Any kind: an `email_verified: false` ID token is refused.
  3. `groupRoles` maps a group to a role. A person in a mapped group is admitted and gets those roles at their first sign-in; roles are then read from the registry as before (D-027), so a later change of group at the provider does not change them.
  4. The OAuth clients of delegated connectors (`connector_clients`, one per workspace and connector type, secret sealed) are edited through `GET|PUT|DELETE /console-api/api/connector-clients[/<type>]`. The consent routes are mounted under the console API: `GET …/tools/<t>/environments/<e>/consent/<name>` starts, `GET /console-api/api/consent/callback` completes, `GET …/consent` lists the person's own consents, `DELETE …/consent/<name>` withdraws one; the admin's `GET|DELETE …/connections[/<user>/<connector>]` lists and revokes (FOR-79). Scopes come from the tool's manifest, never from the request.
  5. SAML was **not built here**; it is built in D-050, which replaces this point. Verifying a SAML response in a Worker needs XML canonicalization (exclusive C14N) and XML signature validation with no DOM and no `node:*`; hand-rolling it is the classic source of signature-wrapping vulnerabilities, and a dependency heavy enough to do it safely does not fit the gateway's neutral bundle (D-028). Entra ID, Google Workspace, Okta and most SAML identity providers also speak OIDC, so OIDC stays the supported path.
- **Why**: D-019 left "the per-workspace provider configuration" undone; presets turn the two named providers into a few fields and make the restriction that keeps other organisations out mandatory instead of optional.
- **Rejected**: multi-tenant Entra (`common`): the issuer is templated per tenant and every directory could sign in; Google without `hd`: any Google account would pass the provider; groups as live roles (needs a role sync and revocation, not designed); a SAML parser written here.
- **Know**: the Entra `groups` claim carries group ids and is replaced by a link when a person is in too many groups (overage): such a person then has no groups and gets no role from the mapping. The UPN of Entra can differ from the mailbox address, which matters for `MEMBER_EMAIL_DOMAINS`.
- **Not done / not verified**: no real Entra or Google sign-in and no real connector consent was tried (simulated providers only: the claim names and issuers come from the providers' documentation, not from a live tenant); SAML (done in D-050); the callback of a consent answers JSON, not a page of the console; the console has no screen for these routes; the run-time use of `accessToken` by a connector's session (`ConnectorSession.token()`) in a tool Worker, and sharing the identity with MCP (FOR-107), are not part of this change; a provider change is not recorded in the audit log.
- **Applied in**: FOR-82, FOR-79; `packages/registry` (`0015_identity_config`, `identity-config.ts`), `apps/gateway/src/identity/presets.ts`, `console-api/identity.ts`, `consent/consent.ts`.

## D-044 — The keychain is the macOS `security` tool or Linux `secret-tool`, fed on standard input; Windows uses the 600 file

- **Date**: 03/11/2026 · **Status**: Active
- **Decision**: `apps/cli/src/keychain.ts` implements the `Keychain` interface of D-025 on macOS (`security -i`, which reads its commands from standard input: `add-generic-password -U -s forgeron -a forgeron -w "<token>"`; reading is `find-generic-password -w`, forgetting `delete-generic-password`) and on Linux (`secret-tool store|lookup|clear service forgeron account forgeron`, the secret on standard input). The token is never an argument, so it is not in `ps`; a token with a character outside printable ASCII is refused rather than quoted. Programs are started through an injectable `Runner` (no shell, standard error discarded), so tests use a fake runner and never touch a keychain. On Windows (and any other system) there is no adapter and the `~/.config/forgeron/credentials` file (the folder is not locked down by Windows file modes; `600` is best-effort there) is used; the Windows Credential Manager has no command that takes a secret without an argument, and a native module is not worth it for now.
- **Fallbacks**: a keychain that fails (no `secret-tool`, no session bus on a headless Linux, locked keychain) falls back to the file, as D-025 says. A token found only in the file when a keychain exists is moved to the keychain on the next read, and the file is removed only once the keychain holds it.
- **Rejected**: `security add-generic-password -w <token>` (argument); `security ... -w` with no value (prompts on the terminal, not on a pipe); keytar-like native modules (build and distribution cost); a Windows adapter through PowerShell `PasswordVault` (not tried, no machine to test on).
- **Not verified**: no real macOS Keychain or libsecret was driven (the runner is faked): the exact `security -i` quoting and exit codes (44 for not found) come from the manual page and common use, and `secret-tool` exit codes for a missing entry are assumed non-zero.
- **Applied in**: FOR-85.

## D-045 — Each template deploys as a preview per pull request, announced by a comment, closed through `DELETE /deploy`

- **Date**: 03/11/2026 · **Status**: Active
- **Decision**: `.github/workflows/templates-preview.yml` runs on `opened, synchronize, reopened, closed`. For the first three, each template is tested, checked and deployed as a preview of the pull request's branch (the deploy action, one `FORGERON_TOKEN_<NAME>` secret per template) and, when an address came back and the pull request is not from a fork, a comment per template (found by a hidden marker, edited on each push) gives the address. On `closed` (merged or not) a `close` job runs `forgeron preview close` per template, through `DELETE /deploy {branch}` (the route is D-038's) with the same deployment token: the gateway tears the preview down and forgets it (`closePreview`, already in the registry); a branch with no preview answers `closed: false`, not an error. The deploy action gained a `close` input and a `urls` output (one `<tool> <address>` line per deployed tool, read from the CLI's `Deployed … : <address>` line).
- **Skips**: without the repository variable `FORGERON_WORKSPACE` or the template's secret (forks, no workspace yet) the templates are only tested and checked, no comment is posted and the close job does not run; nothing fails for that.
- **Why**: the gateway had `closePreview` but no way to call it, and a preview uses a Worker out of 500 per account (D-009), so closing had to be reachable from CI with the credential CI already has. The tool is the token's, as for deploy, so a token cannot close another tool's preview.
- **Rejected**: a separate close workflow (the matrix would be written three times); a comment through a third-party action (a dependency for ten lines of `gh api`); closing with an administrator's token (CI would hold a person's reach).
- **Not verified**: no real workspace, so no real preview was deployed, commented or closed; the workflow was not run by GitHub (`actionlint` is not installed here: the YAML parses and the script is covered by tests); previews are empty until the gateway seed provider exists (FOR-46); the address shown is what the gateway returns (D-009: preview URLs do not carry `@<branch>` yet).
- **Applied in**: FOR-65; `apps/cli/src/commands/preview.ts`, `.github/actions/deploy`.

## D-043 — Views and the playground honour the matrix: a view is a column `view:<name>`, one shared rule, `useCanCall` for controls

- **Date**: 03/11/2026 · **Status**: Active
- **Decision**: the one access rule is `mayAccess` in `@forgeron/manifest` (a role may use a subject if the matrix says so, else if one of its levels is the subject's; the person may if one of their roles may); the runtime's `mayCall`, `serveView` and the playground's action list all call it. A view is a column of the matrix keyed `view:<name>` (an action name has no colon, so the keys cannot collide), checked against the view's `access` level; `accessMatrix` returns `views` and `subjects` (the columns, actions first) and `setRoleAccess` accepts a `view:<name>` the manifest declares. `serveView` and `servePlayground` take the overrides (`access`, from `registry.accessFor`). The bootstrap of a view page carries `callable`, the actions the person may call with the matrix applied; `useCanCall(action)` reads it, because `useCan(level)` cannot say what an override of one action does. `useCan(level)` stays what it was: levels only.
- **Why**: FOR-43 asks for the same check on every interface; a view was the one place that read levels alone. An action-level override cannot be expressed through a level, so the page needs the answer per action, computed where the overrides are.
- **Rejected**: one `can()` that takes a level or an action name (ambiguous); client-side evaluation of overrides (the page would need the manifest and the matrix); a separate table for views (a second place to edit and audit).
- **Not done**: `serveView` is not yet called by the gateway (views are served by the tool's Worker, FOR-56): when it is, it must pass `registry.accessFor(tool, person.roles)`; an override left behind by a view a later version removes is ignored, as for actions.
- **Applied in**: FOR-43; `packages/manifest/src/access.ts`, `apps/gateway/src/views/serve.ts`, `playground/serve.ts`, `packages/registry`, `packages/sdk/src/react`.

## D-047 — The console saves the matrix in one request, applied with its audit lines in a single D1 batch

- **Date**: 03/11/2026 · **Status**: Active
- **Decision**: `PUT /console-api/api/tools/<tool>/access-matrix` takes `{ changes: [{ role, action, allowed: true | false | null }] }` (1 to 500 cells; the single-cell body of D-040 is replaced) and answers with the matrix. `registry.setRoleAccessMany` checks every cell against the manifest first, then writes the cells and one audit line per cell in one `d1.batch`: a bad cell changes nothing. A cell named twice counts once, the last. The console sends the whole draft in one request.
- **Why**: a request that fails part-way left some cells applied (D-040's "not done"); D1 batches are transactions, so the audit lines and the writes cannot disagree.
- **Rejected**: keeping the single-cell body next to the batch one (two shapes to keep right, and nothing else calls it).
- **Applied in**: FOR-43; `apps/gateway/src/console-api/access-matrix.ts`, `packages/registry` (`setRoleAccessMany`), `apps/console/src/access-matrix.tsx`.

## D-046 — A delegated connector gets the caller's own access token from the gateway, or the consent link as a 428

- **Date**: 03/11/2026 · **Status**: Active
- **Decision**: on each call to a tool that declares a `delegated` connector, the gateway looks up the caller's consent for the tool, the environment the call is served from (preview, pilot or production) and the connector type. If there is one it hands the tool Worker the access token in the header `x-forgeron-connector-tokens` (a JSON map by connector name), after refreshing it with the sealed refresh token when it expires within a minute (the pattern of per-person secrets, D-036: headers only the gateway can set, dropped from the incoming request). The refresh token is never in a header, a listing or a log. If there is none (never given, revoked by an admin or the person, or the provider refuses the refresh token), the header `x-forgeron-connector-consent` carries the consent link by connector name (`/console-api/api/tools/<tool>/environments/<env>/consent/<name>`). A provider that cannot be reached is a `502 UPSTREAM` before the tool runs: asking the person to consent again would not help.
- **Runtime**: `Platform.connectorSessions` (`tokens(user)`, `consentUrl(name)`) gives a first-use check for the delegated connectors an action's tool declares: a missing consent is a `SECRET_REQUIRED` failure (HTTP 428, MCP URL elicitation `-32042` for protocol 2025-11-25, which already carries `inputUrl`) whose `details` has `consent: true`, `inputUrl` and the `missing` connectors. The compiled Worker builds the sessions from the two headers. No new error code: the person's next step is the same (open a link, then call again).
- **Audit**: one `access` audit line per token handed over (`connector-token:<type>`, actor the person, detail the environment and connector name), one per admin revocation (`connector-consent:<name>:revoke`), and one per change of the sign-in provider or of a connector's OAuth client (`identity-provider:set|delete`, `connector-client:<type>:set|delete`, with `secretChanged`, never a secret). Audit failures never block the call or the change.
- **Why**: the same shape as per-person secrets keeps one mechanism for what a person gives the platform, and keeps the refresh token (the durable credential) out of the tool Worker; the access token is short-lived and is what the connector needs to call the upstream.
- **Know**: the access token is in the tool Worker's memory during the call, so the tool's own code can read it; the connector package's host list (`createConnectorClient`) is what stops it from reaching other hosts, and a tool that reads `ctx` through a connector client does not see it. Every call to a tool with a delegated connector costs one registry read and, when the token is stale, one refresh call to the provider.
- **Not done / not verified**: nothing ran against a real provider. (The compiler import of connector packages, the 5xx handling of the token endpoint and the audit of grants and withdrawals, listed here at first, are D-048.)
- **Applied in**: FOR-79; `apps/gateway/src/dispatch/connector-tokens.ts`, `dispatch/user-secrets.ts`, `console-api/identity.ts`, `console-api/connections.ts`; `packages/runtime/src/engine.ts`; `packages/compiler/src/build.ts`.

## D-048 — The build bundles the connector packages a tool declares; only an explicit OAuth refusal revokes a consent; grants are audited

- **Date**: 03/11/2026 · **Status**: Active
- **Decision**: (1) `forgeron build` resolves `@forgeron/connector-<type>` from the tool's folder for each connector in `resources.connectors` and bundles its **default export** (the `defineConnector(...)` definition; every connector package has one) into the Worker. The Worker gives the runtime `platform.connectorClient`, which is the SDK's `createConnectorClient(definition, declaration, session)`: `ctx.connectors.<name>` is built per call from the session the gateway headers make (D-046). A declared connector whose package is not installed is a build error naming the package. (2) `createConsent` revokes a consent only when the token endpoint answers 4xx with `invalid_grant`, `invalid_client` or `unauthorized_client` (RFC 6749 section 5.2). A 5xx, a dropped connection, an answer that is not OAuth JSON, a 429, or another error (`invalid_request`, `invalid_scope`) throws `PROVIDER_UNAVAILABLE` (a network error is thrown as it is) and keeps the consent. The gateway answers `502 UPSTREAM` with `retryable: true` and `Retry-After: 30` before the tool runs, and `PROVIDER_UNAVAILABLE` on the consent callback is a `502` too. (3) A grant (`connector-consent:<type>:grant`, after the provider's code is swapped and the tokens kept) and a withdrawal by the person (`connector-consent:<type>:withdraw`) write an `access` audit line each (actor the person, detail the environment, and for a withdrawal the connector name); never a token. Audit failures never block the person.
- **Why**: a provider outage that answers instead of dropping the connection must not cost people their consent, which they would have to give again one by one; and the audit log must say who gave or withdrew access, as it does for who used it. A default export gives the compiler one name to import whatever the package's own export is called.
- **Know**: only `delegated` connectors get a client in the Worker today: the runtime builds `ctx.connectors.<name>` from the caller's token, and nothing gives a tool the `application` token yet. The declaration is checked against the definition (type, mode, scopes) when the client is built, so a bad scope is a `FORBIDDEN` on first use, not yet a build error. A tool's package manager must install the connector packages (they are `@forgeron/*` workspace packages today).
- **Not done / not verified**: `application` mode; checking the declaration at build; an audit line when the platform itself revokes a consent (the provider refuses the refresh token); nothing ran against a real provider.
- **Applied in**: FOR-125; `packages/compiler/src/build.ts`, `packages/registry/src/consent.ts`, `apps/gateway/src/consent/consent.ts`, `apps/gateway/src/dispatch/connector-tokens.ts`.

## D-049 — The gateway signs people in by a code sent to their email, beside OIDC; members, invitations and email domains are managed in the console

- **Date**: 03/11/2026 · **Status**: Active
- **Decision**:
  1. **Flow.** `GET /auth/login` is the sign-in page. `POST /auth/email/request {email}` answers one page whether or not the address may sign in, and sets `__Host-fg_email` (sealed, `HttpOnly; Secure; SameSite=Strict`, 10 minutes) carrying the id of the request. `POST /auth/email/verify {code}` weighs the code, then opens the same `__Host-fg_session` as the OIDC callback and redirects to `/` or to the CLI's own `/auth/cli?…` page (`next`, the only path allowed, checked at the request and again at the verification). A new session is minted at each sign-in; no incoming cookie is reused (no fixation). `forgeron login` is unchanged: `/auth/cli` sends an unauthenticated browser to `/auth/login?next=…`.
  2. **The code.** 8 digits from `crypto.getRandomValues` (rejection sampling), shown as `1234 5678`, valid 10 minutes, single use. The platform D1 keeps `HMAC-SHA256(AUTH_SECRET, "code:<id>:<code>")` only (`email_codes`, migration 0016), compared in constant time. Five tries per code, counted by the same statement that reads the row (`UPDATE … RETURNING`), so parallel guesses cannot exceed five; the code is spent by a second conditional `UPDATE`, so it opens one door once. The code is bound to the browser that asked by the cookie: no cookie, or another request's cookie, is refused.
  3. **No link.** The mail carries the code to type, not a link: a mail scanner that opens every link would consume or confirm it. (A link with a POST confirmation page was the alternative; a typed code needs no second page and cannot be prefetched.)
  4. **Anti-enumeration.** The answer, its headers and its cookie are the same for an address that may sign in and one that may not; a row is stored either way; the mail is sent after the answer (`ctx.waitUntil`, `createGateway`'s `defer`) so latency does not differ; a failed send is logged without the address and not shown. Nothing is mailed to an address that is neither a member, invited, `--admin-email`, nor of an allowed domain. A wrong code for an address that cannot sign in fails like a wrong code for one that can. The limits count every request alike (5 per address and 20 per source address per hour, the source being `cf-connecting-ip` hashed with the key), so a `429` says nothing about the account.
  5. **Who may sign in** (`admission`, decided again at verification): an existing member (found by email, case-insensitively); else an unexpired invitation (roles as invited); else `ADMIN_EMAIL` (role `admin`: the first administrator); else an address whose domain is an allowed domain exactly (no subdomain, no suffix) with the default role. Joining writes the member (subject `email:<address>`, or the provider's subject for OIDC), its audit line and the invitation's deletion in one batch.
  6. **Members, invitations, domains** (`GET /api/members`, `PATCH|DELETE /api/members/<id>`, `POST /api/invitations`, `DELETE /api/invitations/<email>`, `PUT /api/membership-settings`, console API, admins only, JSON only). Every change is an `access` audit line written in the same batch as the change (`member:invite|revoke-invitation|roles|remove|join|domains`). The last administrator cannot be demoted or removed. `admin` cannot be the default role (anyone with a domain email would be an administrator). Allowed domains are those an admin saved, else `--member-email-domains`; the same policy (domains, default role, invitations) now applies to OIDC sign-ins too. An invitation lasts 14 days and is announced by a mail (best effort) that carries no code.
  7. **One member per person.** An OIDC sign-in whose email already belongs to a member (who came by email first, or the reverse) is that member; before this, a second member was created.
  8. **Mail** is the `MailSender` interface (`apps/gateway/src/mail`): Cloudflare Email Sending through a `send_email` binding `SEND_EMAIL` and `MAIL_FROM` (`env.SEND_EMAIL.send({from, to, subject, text})`), an in-memory sender for tests. Source: Cloudflare documentation, Email Service, "Email Sending Workers API", "Send bindings" and "REST API" (pages dated 15 and 30 October 2026, read 3 November 2026): Email Sending is in public beta (since 16 April 2026), needs Workers Paid and a domain onboarded to Email Service on Cloudflare DNS; the Workers binding needs no token, the REST API (`POST /accounts/{id}/email/sending/send`) needs an API token with send permission. The binding was chosen: no new secret.
  9. **Install.** `platform install --sign-in email[,oidc] --mail-from <address>` sets `SIGN_IN_METHODS`, `MAIL_FROM` and the `send_email` binding `SEND_EMAIL`; `--admin-email` and `--member-email-domains` are as before; the OIDC flags are required only when `oidc` is in `--sign-in` (their absence is the old behaviour). The flag is `--sign-in` and not `--auth` because `--auth` already chooses the Cloudflare credential (`token|wrangler`, D-026). Without `SIGN_IN_METHODS` a gateway behaves as before (OIDC alone); the email routes answer 404 unless `email` is named and the sender is configured. When both are on, `/auth/login` shows the OIDC button ("Continue with your company account") first and the email form second; with OIDC alone it still redirects to the provider; `?method=oidc` always starts the provider.
- **Why**: a small team or a first self-host install has no identity provider, and the first administrator must be able to sign in to configure one. The code is hashed so a read of the D1 gives no way in; the answer is uniform so the form cannot be used to list who works there.
- **Rejected**: a link in the mail (scanner prefetch); a password; creating an account for any address (spam, and nothing stops a stranger from owning a member row); revealing "no such account" or "too many requests for this address only when it exists"; making the first person to sign in the administrator (D-027).
- **Know**: a person can be locked out of asking for a code for an hour by someone who asks five times for their address (the limit is per address; the code itself is unaffected). The sign-in secrets are the mailbox: whoever reads the mailbox of an administrator is that administrator. A removed member who is in an allowed domain joins again at their next sign-in; remove the domain to keep them out. `ADMIN_EMAIL` re-creates the administrator at sign-in if their member row was removed (D-027). Removing a member stops their sessions and tokens at the next call (every call reads the member), not a revocation list. Timing: the lookups and the stored row are the same for every address and only the send differs, which is deferred; a residual difference (scheduling the send) was not measured.
- **Not verified**: no real Cloudflare Email Sending domain, no real mailbox, no real browser. The shape `send_email` of the Workers API binding metadata (`{ type: "send_email", name }`) and that `inherit` carries it across a re-run were not checked against a live account; `from` is a bare address (the documentation shows a bare address; a named sender was not tried). Delivery, spam placement and DKIM of the sender domain are the owner's to check.
- **Applied in**: FOR-126; `apps/gateway/src/identity/email-auth.ts`, `mail/mail.ts`, `console-api/members.ts`, `gateway.ts`; `packages/registry` (`0016_email_sign_in`, `email-codes.ts`, members methods); `apps/console/src/members.tsx`; `apps/cli/src/commands/gateway-identity.ts`; `docs/self-host.md`.

## D-050 — SAML sign-in is verified by a small XML-DSig verifier on Web Crypto, trusting only the element a pinned signature covers

- **Date**: 03/11/2026 · **Status**: Active · replaces D-041 point 5
- **Decision**:
  1. A workspace can sign in through SAML 2.0, service-provider initiated. `GET /auth/login` records a request id and redirects to the identity provider's SSO URL with a deflated `AuthnRequest` (HTTP-Redirect binding, unsigned) and a `RelayState`; the identity provider posts the response to `POST /auth/saml/acs` (HTTP-POST binding); `GET /auth/saml/metadata` serves our metadata (entity id = that URL) for the identity provider's administrator. The session is the same `__Host-fg_session` cookie (`HttpOnly`, `Secure`, `Lax`) as OIDC, opened with a 303. IdP-initiated sign-in is **refused**: a response must answer a request this gateway made.
  2. The provider is a row of `saml_providers` (migration 0016): the IdP entity id, the SSO URL (https), one to five pinned PEM certificates (more than one lets the provider rotate), `emailAttribute`, `groupsAttribute`, `nameAttribute` (an attribute `Name` or `FriendlyName`) and `groupRoles`. It is edited by an admin through the same `PUT|GET|DELETE /console-api/api/identity-provider` with `kind: "saml"`, audited as `identity-provider:set` (the audit line carries the entity id and the number of certificates, never a certificate). Each certificate is parsed when saved. One provider per workspace: saving a SAML provider removes an OIDC one and the other way round; a saved SAML provider wins over `OIDC_*` bindings. Without `emailAttribute` the email is the NameID, which must contain `@`; the member subject is `saml:<NameID>` (never equal to an OIDC subject); a transient NameID is refused. Groups and `groupRoles` work exactly as for OIDC (D-041 point 3).
  3. **No library.** Verifying XML-DSig needs exclusive canonicalization, and every vetted implementation found (xml-crypto, xmldsigjs, samlify, node-saml) needs `node:*` or a DOM, which the neutral bundle forbids (D-028). The verifier is written here, deliberately narrow, in four files of `apps/gateway/src/identity`: `saml-xml.ts` (reader and exclusive C14N), `saml-cert.ts` (public key of a pinned certificate), `saml-signature.ts` (the signature), `saml.ts` (request, response, assertion). The narrowness is what makes it small enough to audit.
  4. **The reader** refuses a DOCTYPE and any entity other than the five predefined ones and character references, a processing instruction inside an element, an undeclared prefix, a duplicate attribute, more than 64 levels, 20 000 elements or 1 MB. No entity is ever expanded, so there is no XXE or entity bomb. Comments are dropped and the text around them is one string, the same one the digest was computed over (no comment-splitting trick on the NameID).
  5. **The signature**: the key is a pinned certificate (`KeyInfo` in the message is never read; the certificate's own signature, issuer and validity are not checked: trust is the pinning, and an IdP often signs past its stated expiry; RSA keys under 2048 bits are refused). Allowed: exclusive C14N without comments (an `InclusiveNamespaces` PrefixList is honoured), RSA-SHA256 or ECDSA P-256 with SHA-256 (the raw `r||s` that XML-DSig and Web Crypto share), SHA-256 digests, exactly one `Reference` whose `URI` is `#<ID of the element the Signature is a child of>`, transforms exactly enveloped-signature then exclusive C14N. Anything else (SHA-1, HMAC, inclusive C14N, XPath, other transforms) is refused, which closes algorithm confusion.
  6. **Signature wrapping (XSW)**: the response must have exactly one `Assertion` child and no `EncryptedAssertion`; only a `Signature` that is a direct child of the Response or of that Assertion counts, and every one present must verify; at least one is required; no `ID` (`ID`, `Id`, `id`) may appear twice in the document; and the assertion that is read is the node object the signature was verified over, never one found by id. A signed assertion moved into `Extensions`, a signature copied into a forged assertion, a forged assertion with a reused id, and a second assertion beside a signed Response are all refused (tested). When only the Assertion is signed, the unsigned Response attributes are never relied on.
  7. **The assertion**, read from the covered element only: `Version` 2.0; `Issuer` equals the pinned entity id (and the Response's if the Response is signed); at least one bearer `SubjectConfirmationData` with `Recipient` equal to our ACS URL, `InResponseTo` equal to our request id and an unexpired `NotOnOrAfter`; `Conditions` with `NotBefore`/`NotOnOrAfter` and every `AudienceRestriction` naming our entity id (an unknown condition is refused); an `AuthnStatement`; a Response that is signed must also have `Destination` equal to the ACS URL and a matching `InResponseTo`; `Status` must be success. Clock skew tolerated: 120 seconds.
  8. **Replay and binding**: the request id lives in `saml_requests` (kind `request`, 10 minutes) and in the sealed state cookie with the `RelayState`; the response must carry both. The request is used with one `DELETE … RETURNING` (two simultaneous answers: one wins), the assertion id is recorded with one `INSERT … ON CONFLICT … RETURNING` until its `NotOnOrAfter` plus the skew (a replayed assertion is refused). Both are consumed only after the signature and the assertion are valid, so a forged POST cannot burn a person's request. Expired rows are purged when a sign-in starts.
  9. The state cookie of a SAML sign-in is `__Host-fg_saml` with `SameSite=None; Secure; HttpOnly`: the identity provider answers with a cross-site POST, which a `Lax` cookie does not travel with. The session cookie stays `Lax`.
- **Why**: Okta, Entra ID and ADFS tenants of customers are often SAML-only by policy; OIDC cannot serve them. A hand-written verifier is only acceptable if it is narrow, strict about structure (the wrapping defence is structural, not a lookup by id) and proven against signatures made independently of its own canonicalizer.
- **Rejected**: a dependency (needs `node:*` or a DOM, or is far larger than the surface used); trusting `KeyInfo` or fetching the key from metadata at sign-in (trust must come from the admin); accepting any one of several signatures without checking the others; looking the signed element up by id; IdP-initiated sign-in (no request to bind the response to, so no replay window short of the assertion's validity); signed or encrypted AuthnRequests/assertions (not needed for a bearer assertion over TLS, can be added); SHA-1 and RSA-SHA1 (some old IdPs only offer them: they are refused); metadata import by URL (the admin pastes the certificates).
- **Know**: the tests sign real assertions with Web Crypto, RSA and EC, with documents written directly in canonical form, so the digest and the signature do not depend on the gateway's own canonicalizer; the canonicalizer is also tested alone. The tests are the evidence the verifier is correct; they do not replace a review by someone who writes SAML for a living. A person's NameID that changes at the provider (transient, or a rename) is a new member. `emailAttribute` is the name the IdP sends (Entra: `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress`; Okta and others: whatever the admin set). The groups of an Entra SAML assertion are group ids unless configured otherwise.
- **Not done / not verified**: no real SAML identity provider (Entra ID, Okta, ADFS, Google, Keycloak) was tried: the attribute names, signing algorithms, whether the IdP signs the Response, the Assertion or both, and whether it accepts an unsigned AuthnRequest and the HTTP-Redirect binding with a fresh `RelayState` come from the specification and from documentation, not from a live tenant; an ECDSA-signing IdP is rare and was proven against the simulation only; no single logout; no signed or encrypted requests; no metadata refresh or import; the console has no screen for it; the clock skew and the 10-minute request lifetime are starting values.
- **Applied in**: FOR-124; `apps/gateway/src/identity/saml*.ts`, `auth.ts`, `presets.ts`, `console-api/identity.ts`, `simulated-saml-idp.ts`; `packages/registry` (`0016_saml`, `identity-config.ts`, `saml-requests.ts`).
