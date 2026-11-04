# Spike: platform boundaries and the module model (FOR-144)

Linear: FOR-144, project "Modular gateway and registry", initiative "Platform architecture".
Prototype code: branch `spike/module-model-awilix` (not for merge). This report changes no code.

## Verdict

1. The package boundaries are sound; the weak spots are inside three files and one folder: `packages/registry/src/registry.ts`, `apps/gateway/src/gateway.ts` and `apps/gateway/src/identity/`.
2. Copy the module _shape_ of the owner's Notion and Linear clones (a folder per domain, a `public.ts` door, dependency-cruiser rules proved by a self-test), not Awilix. Explicit factories plus a typed `RequestContext` do the same job for less.
3. Do it in seven small steps, the first three are cheap and safe; D1 migrations keep their names, fingerprints and global order.

## Question

How is the platform really structured today, where are the boundaries weak, and which module model fits? The reference is the owner's Linear and Notion clones: modules that talk through `public.ts`, a composition root, a per-request Awilix scope, a domain that ignores D1 and transports.

## Method

- Boundary map from the code: `bun run deps` (dependency-cruiser) over the whole repository, plus scripts and manual reads of `registry.ts`, `gateway.ts`, the gateway subfolders, hosting, runtime and the CLI.
- Read-only reading of the Notion and Linear clones (nothing edited).
- Prototype on the spike branch: Awilix 13.0.5 in the gateway, a bundle build, four tests (one under workerd through Miniflare), a benchmark, and a test composing the platform migrations from per-module lists.
- Nothing was run against a real Cloudflare account.

All counts below were taken on `8b73aaf` (main at the start of the spike). Main has moved since: `registry.ts` is now 1,630 lines and `gateway.ts` 707 lines. The order of magnitude and the findings hold; re-count before using a figure for a plan.

## Map and numbers

### Packages

| Package  | Size                  | Boundary                                               |
| -------- | --------------------- | ------------------------------------------------------ |
| registry | 3,349 lines, 11 files | one door, `src/index.ts`: 28 importers, 0 deep imports |
| hosting  | 1,732 lines, 16 files | no finding                                             |
| runtime  | 1,456 lines, 11 files | no finding, stays free of `node:*`                     |
| cli      | 2,988 lines           | no finding                                             |

dependency-cruiser: 434 modules, 0 violations, 0 cycles. The file-level `no-cycles` rule is green.

### `registry.ts`

1,590 lines at the time. `createRegistry` is one closure from line 310 to 1589 with 64 methods in 11 domains (method counts matched by name, may over-count):

| Domain                                      | Lines     | Methods |
| ------------------------------------------- | --------- | ------- |
| tools                                       | 381-418   | 4       |
| tool secrets                                | 419-511   | 5       |
| connections                                 | 512-619   | 4       |
| seats                                       | 620-639   | 2       |
| members, invitations, membership settings   | 640-966   | 15      |
| codes and token revocation                  | 967-1039  | 4       |
| user secrets                                | 1040-1106 | 4       |
| builds, versions, environments, deployments | 1107-1313 | 12      |
| approvals                                   | 1314-1406 | 4       |
| audit                                       | 1407-1452 | 3       |
| access matrix                               | 1453-1590 | 7       |

About 460 more lines of types and row mappers sit above the closure. The closure shares helpers (`all`, `first`, `write`, `now`, `newId`, `requireTool`, `auditStatement`, `secretBox`).

`auditStatement` is used at 10 call sites, inside the same `d1.batch` as the write it records. Audit must therefore stay a statement builder in a shared kernel; it cannot become a module that other modules call after the fact.

### `gateway.ts`

682 lines at the time. `createGateway` is one closure of about 530 lines: composition from the environment, policy helpers (`policyOf`, `providerOf`, `samlOf`, `consentFor`), an `if (pathname)` routing chain, and a `??` chain of 12 console-api handlers that each repeat `{ registry, workspace, caller: identity }`. It has 31 imports.

### Gateway folders (production lines)

identity 4,014 (18 files, three concerns), console-api 1,353 (11), deploy 1,083, dispatch 975, pages 547, views 457, consent 437, playground 212, mail 62. `admin-mcp/`, `audit/` and `registry/` hold only `.gitkeep`. 14 tests sit at the root of `src/` (3,703 lines): 12 `gateway*.test.ts` plus `bundle`, `console-assets` and `wrangler-config`.

### Cycles the tool cannot see

The file-level rule passes; folder-level cycles exist:

- `identity <-> dispatch`: `workspaceOf` is imported by `auth.ts` and `email-auth.ts`; `Person` is imported by `user-secrets.ts`.
- `identity <-> pages`: `pages/cli.ts` imports `Person`.

### Duplicated types and ad hoc contexts

- Four overlapping person types: `Person`, `Identity`, `Caller`, `Member`.
- 25 distinct `*Context` / `*Options` interfaces for handlers; 27 `registry: Registry` fields; dispatch defines its own one-method `Registry` port (the right idea, applied once).

### Migrations

`platformMigrations` (`packages/registry/src/migrations.ts`, 549 lines) holds 0001..0019. 17 statements reference `"tools"`. `0001_registry`, `0016_email_sign_in` and `0019_remove_pilot` span several domains. `applyMigrations` (`packages/hosting/src/migrate.ts`) checks names and fingerprints (MISSING, EDITED, late) and orders by name. The real installed D1 is at 0019: names and fingerprints must not change.

## The reference clones

- **Notion clone**: 16 core modules, each with `public.ts`, a `*.module.ts`, and application / domain / persistence layers. Dependency-cruiser rules: `core-modules-use-public-api`, `core-shared-is-generic`, `core-domain-is-pure`. Migrations are central (`packages/db/migrations`, 32 files).
- **Linear clone**: decision D-051. Before: factory closures per domain, wired by hand per request, files of 700 to 1,340 lines. After: modules, classes, Awilix in PROXY mode with `strict`. Tests went from 449 in 71 files to 569 in 161. It adds `erasableSyntaxOnly` and a 300-line file cap. Migrations are central here too.

What transfers: the folder shape, the door, the rules, the file cap. What does not transfer as is: the domain / persistence split (our domain logic is mostly SQL statements) and class-based DI.

## Awilix per-request scope against explicit factories

| Criterion                  | Awilix 13.0.5 (PROXY, strict)                                                       | Explicit factories + typed `RequestContext` |
| -------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------- |
| Workers compatibility      | Yes: the `workerd` condition maps to `awilix.browser.mjs`; 0 `node:*` in the bundle | Yes, nothing to add                         |
| Bundle (gateway)           | 486,303 B raw, 119,288 B gzip                                                       | baseline 455,552 B raw, 110,916 B gzip      |
| Bundle delta               | +30,751 B raw (+6.8%), +8,374 B gzip (+7.6%)                                        | 0                                           |
| Per-request cost (Bun)     | about 1.5 us                                                                        | about 0.6 us                                |
| Identity per request       | scope-registered `identify`, memoised per scope                                     | `who()` memoised on the context             |
| Isolation between requests | proven by test: two scopes never share an instance                                  | by construction (a new object per request)  |
| Missing dependency         | runtime error (`AwilixResolutionError`) at first use                                | compile error                               |
| Testability                | override by name in a scope                                                         | pass a fake to the factory                  |

The per-request timings were measured in Bun, not in workerd; treat them as relative, not absolute. Both are negligible next to a D1 round trip.

Footgun found: in PROXY mode a class constructor receives the cradle as a single argument. Positional constructor parameters resolve nothing; the first workerd test returned 500 with `AwilixResolutionError: Could not resolve 'identify'` until the constructor took a destructured `deps` object. Strict mode and the rename-sensitive proxy keys also mean a typo fails at runtime, not at `tsc`.

Reading: Awilix works on Workers and costs +7% of bundle, but it moves dependency errors from compile time to request time. The gain it gives the Linear clone (taking wiring out of hand-written closures) can be had here with a typed context object. The deciding factor is that our modules are few, flat and SQL-bound; the wiring burden that justified D-051 (files of 1,340 lines with per-request hand wiring) is smaller here and is removed by splitting files, not by a container.

## Migrations: modules declare, order stays global

The prototype test (`packages/registry/src/spike-modules-migrations.test.ts`) declares 9 owner modules (catalog, secrets, connections, audit, access, seats, members, identity, gateway-assets), each exporting its own list, and composes them. The composed list is deep-equal to `platformMigrations`: same 19 names, same fingerprints, same order. This holds because the migration name carries the global number and the composer sorts by name; modules own the SQL text, not the order.

Consequences: a migration that touches several modules (`0001`, `0016`, `0019`) is owned by the module that creates the tables and keeps its number. Independent per-module numbering is not proposed (see "Not worth doing").

## Recommendation

Adopt the module shape, without Awilix.

- A `modules/<domain>/` folder per domain in the registry, each with `store.ts` (the SQL), types, and a `public.ts` that is the only importable file. `index.ts` re-exports the public surfaces, so the 28 importers do not change.
- A small kernel for what is shared: ids, clock, `secretBox`, `auditStatement`, `Person`, `workspaceOf`.
- In the gateway: composition (`compose.ts`), a `RequestContext` with a per-request memoised `who()`, and route tables by area, replacing the `if (pathname)` chain and the 12 repeated contexts.
- Narrow ports on the consumer side where a module needs another (dispatch already does this).
- dependency-cruiser rules, each with a case in `scripts/deps-selftest.ts` (`__boundary_fixture`): `registry-door-is-index`, `module-uses-public-api`, `kernel-is-generic`, `identity-does-not-import-dispatch-or-pages`.

### Proposed modules and public surfaces

Registry: `catalog` (tools, versions, builds, environments, deployments), `secrets` (tool secrets, user secrets), `connections`, `members` (members, invitations, settings, seats), `identity-store` (codes, token revocation), `approvals`, `access` (matrix), `audit` (read side; the write statement stays in the kernel).

Gateway: `authn` (sessions, tokens), `sign-in` (email, SSO, SAML), `cli-login`, `console-api`, `deploy`, `dispatch`, `consent`, `pages`, `playground`, `mail`.

## Migration order and sizes

| Step | Content                                                                                                                       | Size | Notes                                             |
| ---- | ----------------------------------------------------------------------------------------------------------------------------- | ---- | ------------------------------------------------- |
| 1    | Rule `registry-door-is-index` plus self-test case; move `workspaceOf` and `Person` to a kernel; removes the two folder cycles | S    | Safe, do first                                    |
| 2    | Split `registry.ts` into `modules/*/store.ts` behind the same `createRegistry`                                                | M    | High merge-conflict risk: do in one quiet window  |
| 3    | Per-module migration lists composed in order, with the equality test from the prototype                                       | S    | Names, fingerprints and order must stay identical |
| 4    | Narrow ports and `RequestContext` replacing the 25 context interfaces                                                         | M    | Follows step 2                                    |
| 5    | Split `identity/` into authn, sign-in, cli-login                                                                              | M    | Needs step 1                                      |
| 6    | Split `gateway.ts` into composition, context, routes                                                                          | L    | Coordinate with the Hono spike (FOR-139)          |
| 7    | Move the 14 root tests into `integration/`                                                                                    | S    | Mechanical                                        |

Sizes are estimates, not measurements.

## Not worth doing

- Awilix: +7% bundle, runtime resolution errors, a constructor footgun, and the problem it solves is smaller here.
- A domain / persistence split inside each module: the logic is SQL statements; a pure layer would be thin.
- A `public.ts` in the small gateway folders (mail, playground, views): a folder of one or two files does not need a door.
- One package per module: the package boundary is already right; more packages mean more `moon.yml`, `tsconfig.json` and ARCHITECTURE entries for no isolation gain.
- Restructuring hosting, runtime or the CLI: no finding.
- Independent per-module migration numbering: the installed D1 is at 0019 and ordering is by global name.
- Splitting `releases` (builds, versions, environments, deployments) further: its 12 methods share the same tables.

## Risks

- Step 2 touches the file most other work edits; branches in flight will conflict.
- `auditStatement` must remain in the same `d1.batch` as the write. A split that turns it into a cross-module call breaks atomicity.
- A composed migration list that reorders or renames a migration makes `applyMigrations` report MISSING or EDITED on the installed D1. The equality test must stay in CI.
- `public.ts` re-exports can create cycles the file-level rule hides; the folder-level rules must be added with the split.
- Method counts per domain were matched by name and can over-count.

## Not verified

- Cold start and the Worker size limit with the prototype; only raw and gzip bundle size were measured.
- Timings under workerd: the 1.5 us and 0.6 us figures come from Bun.
- The full explicit-context chain end to end: `explicit.ts` is a sketch of `createRequestModules`, not the gateway rewired.
- That the composed migration list applies on a D1 (equality was checked on names, fingerprints and order, not by executing the SQL).
- `public.ts` cycles after a real split.
- The sibling Hono spike (FOR-139) was not read; step 6 depends on its outcome.
- Counts were taken on `8b73aaf`; main has moved on (five commits, including FOR-130 and FOR-136) and was not re-measured.
- Nothing was run against a real Cloudflare account.

## Prototype on the spike branch

`spike/module-model-awilix` (`f282f5d`): `apps/gateway/src/spike/{container,worker,explicit}.ts` and `container.test.ts`, `apps/gateway/scripts/spike-{build,bench}.ts`, `packages/registry/src/spike-modules-migrations.test.ts`, the `knip.json` ignores for them, and `awilix` 13.0.5 pinned in `apps/gateway/package.json`. It is a throwaway; do not merge it.
