# Decision log

Every architecture or tooling decision is recorded here, in the order it is made.

Rules of the log:

- A new entry is **added** at the end; a past decision is never rewritten.
- To reverse a decision, add a new one and set the old one's status to "Replaced by D-0xx".
- Each entry says what was decided, why, what was rejected, and where it is applied (files, sections of `sdk.md` or `ARCHITECTURE.md`).
- An external source (Cloudflare doc, trial) is cited with its date.

## Index

| No.   | Date       | Decision                                                                                                | Status            |
| ----- | ---------- | ------------------------------------------------------------------------------------------------------- | ----------------- |
| D-001 | 22/10/2026 | Adopt the tooling and conventions of siages                                                             | Active            |
| D-002 | 22/10/2026 | TypeScript 6, not 7                                                                                     | Active            |
| D-003 | 22/10/2026 | The CLI is an app (`apps/cli`), the SDK a package (`packages/sdk`)                                      | Active            |
| D-004 | 22/10/2026 | A tool is built in the CI of its repository                                                             | Active            |
| D-005 | 22/10/2026 | Build, version and release are three distinct notions                                                   | Active            |
| D-006 | 22/10/2026 | One `forgeron.config.ts` = one tool                                                                     | Active            |
| D-007 | 22/10/2026 | Catalog templates use `forgeron release`                                                                | Active            |
| D-008 | 22/10/2026 | Run tools with Dynamic Workers                                                                          | Replaced by D-009 |
| D-009 | 22/10/2026 | Two hosting modes behind a single interface: Workers for Platforms (cloud), classic Workers (self-host) | Active            |
| D-010 | 22/10/2026 | One D1 database per tool and per environment, bound directly to the tool's Worker                       | Active            |
| D-011 | 02/11/2026 | All repository files are written in English                                                             | Active            |

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
- **Applied in**: `sdk.md` §15 ("Publishing from GitHub"), `ARCHITECTURE.md` ("Publishing a tool").

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
