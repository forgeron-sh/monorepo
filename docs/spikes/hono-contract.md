# Spike FOR-139: Hono, a shared zod contract and a typed client on Workers

Project "Typed platform contract and Hono", initiative "Platform architecture". Written 2026-11-04.
The prototype is throwaway and not in this pull request.

## Verdict

1. **Yes, it works.** Three real console routes were re-served by Hono with the real session and
   role checks, typed by one shared zod contract. Gateway tests, the workerd bundle test and the
   no-`node:*` rule held.
2. **Recommended carrier: `@hono/zod-openapi`, with the route objects in a contract package.** It is
   the only variant where the compiler checks the handler against the contract, and the OpenAPI 3.1
   document comes from the same objects. Price: about +613 KB raw / +115 KB gzip on the gateway
   bundle (measured). The Hono RPC client (`hc`) is not usable as is: it needs the server's app type,
   which breaks `apps-do-not-import-each-other`.
3. **No GraphQL for the platform API now.** Put the contract in place first. A graph API can be
   mounted later as another handler in the same Worker (see the position below).

## Question

Can the gateway's platform API be served by Hono and described by one shared zod contract, with a
typed client for the console and the CLI and an OpenAPI 3.1 document, without `node:*` in the
bundle and at an acceptable size?

## Method

Read the current state, read how the owner's other products did it, built a prototype, measured.
Everything below was run on 2026-11-04 on one machine while other sessions were running, so timings
are indicative only; sizes are exact.

**Current state** (read):

- `apps/gateway/src/gateway.ts`: one `handle` function. `/console-api/*` strips the prefix, resolves
  the person once (`caller.resolve`, session cookie or Bearer token) into an `identity` closure, then
  tries 12 hand-written handlers in sequence (`handleX(request, options) ?? …`; each returns
  `undefined` for a path it does not own), then `notFound`.
- Each handler re-implements the same things: its own path regex, its own `json()` helper, the 401/403
  checks, the JSON content-type check (`415`) on writes, a hand-made body parser and validators
  (`stringList`, an email regex), and a `RegistryError` to status mapping (`members.ts`).
- Writes on `/console-api` are guarded by the JSON content-type (a cross-site form cannot send it)
  and the session cookie. There is no Origin check there. `sameOriginPost` (D-049, `identity/origin.ts`)
  guards only the sign-in form posts under `/auth`. A Hono port must keep both as they are.
- `apps/console/src/api.ts`: `fetchJson` and `sendJson` return `unknown`; every screen casts or
  validates by hand. The CLI calls the platform with plain `fetch` and an `as` cast on the body
  (`apps/cli/src/commands/token.ts` is one of six commands that do this).
- `apps/gateway/scripts/build.ts`: Rolldown, `platform: "neutral"`, `node:*` external.
  `src/bundle.test.ts` loads the bundle in Miniflare/workerd and asserts that nothing but `node:` is imported.
- FOR-137 contract (read with `git show` on `claude/tool-docs-pipeline-71bbd9`, before it merged in
  #116; not re-read after the merge):
  `packages/manifest/src/catalog.ts` is zod 4.6.7 `strictObject` schemas (`CatalogToolSchema`,
  `ToolCardSchema`, …) plus the "Catalog API" section of `docs/console-ux.md`. Same zod version as
  the rest of the repository.

**Owner's other products** (read only): `~/Developer/Personnal/linear/ARCHITECTURE.md` sections 3
and 6, `packages/contract`, `packages/graphql`; `~/Developer/Personnal/notion/packages/contract`
(listed, not read in depth). What is worth keeping for a REST contract:

- One Worker, API and MCP as packages that export a `fetch` handler, assembled by a thin app (section 3,
  option 3), with one `resolveContext` for session, token and OAuth. This is what the gateway already does.
- A `contract` package that imports no other package of the repository, and whose input schemas are shared
  by every surface (GraphQL, MCP, CLI). For Forgeron: zod schemas in a package that console, CLI and
  gateway all import.
- Typed business errors with a code, shared across surfaces (`extensions.code` there; here the
  `{ error, message }` body).
- Generation checked in CI (`codegen --check`). With route objects as data there is nothing to
  generate for the client; a committed OpenAPI document could be checked the same way.
- Enums as `as const` objects; pagination and filter conventions fixed once.
- What not to take: SDL as the source of truth plus codegen. It is a second language and a build
  step; zod already is the source of truth here.

**Prototype** (branch `spike/hono-contract`, commit `3de1b4e`, in the worktree
`.claude/worktrees/spike-hono-7fc4bf`; local at the time of writing, not pushed, because the pre-push hook
runs the full check, which the prototype fails on purpose, see "Not tested"). Three routes of the console API:

| Role       | Route                          | Checks                                      |
| ---------- | ------------------------------ | ------------------------------------------- |
| read       | `GET /api/tools`               | any signed-in member                        |
| write      | `PUT /api/membership-settings` | admin, JSON content-type, body shape        |
| path param | `PATCH /api/members/:id`       | admin, JSON content-type, id and body shape |

- `packages/platform-contract`: zod schemas, `createRoute` objects (`routes.ts`), a 49-line typed client
  (`client.ts`) derived from the route objects only.
- `apps/gateway/src/proto/`: `core.ts` (what the routes do, no HTTP), then the same three routes
  wired three ways: `rpc.ts` (Hono + `@hono/zod-validator`), `zod-openapi.ts` (`@hono/zod-openapi`),
  `hono-openapi.ts` (`hono-openapi`). Each uses the gateway's own `identity` closure for the session
  and role checks and the same registry calls as the legacy handlers.
- `zod-openapi.ts` is wired into `createGateway`: Hono answers its three routes and tags every other
  path with an `x-proto-unmatched` header, so the legacy handler chain goes on for them. This is also the
  migration mechanism (below).
- `apps/console/src/proto-client.ts` (typed client from the contract) and `proto-hc.ts` (`hc<RpcApp>`).
- 17 tests (`proto.test.ts`): each variant against the same cases, plus a comparison with the legacy
  `handleMembers` answer.

**Pinned versions** (npm registry "modified" dates as reported on 2026-11-04): `hono` 4.13.16
(2026-11-01), `@hono/zod-openapi` 1.6.3 (2026-09-04, peers `zod ^4`, `hono >=4.10`), `hono-openapi` 1.5.0
(2026-10-18), `@hono/zod-validator` 0.9.1 (2026-08-31), `zod` 4.6.7 (already pinned in the repository).
`@asteasolutions/zod-to-openapi` 9.1.0 comes in with `@hono/zod-openapi`.

**Documentation read** (WebFetch, 2026-11-04; none of the pages carries a date): the Hono RPC guide
(hono.dev/docs/guides/rpc), the `@hono/zod-openapi` README (github.com/honojs/middleware, `packages/zod-openapi`),
the hono-openapi page (hono.dev/examples/hono-openapi). The pages did not say whether zod 4 or OpenAPI 3.1 is
supported by each library, so that was settled by running them (below). The Cloudflare documentation
search was not used: no Workers-specific Hono claim here comes from it.

## Numbers

**Gateway bundle** (`apps/gateway`, Rolldown with the build's own options; gzip is Node `zlib` at its default
level, which is why the baseline reads 112,188 and not the 111,363 of a command-line `gzip`). Each row
is the baseline plus that one variant:

| Bundle                       | Raw bytes | Gzip bytes | Delta raw / gzip    | `node:*` |
| ---------------------------- | --------- | ---------- | ------------------- | -------- |
| Baseline (`main`)            | 455,552   | 112,188    |                     | none     |
| + Hono RPC (`zod-validator`) | 524,616   | 130,769    | +69,064 / +18,581   | none     |
| + `@hono/zod-openapi`        | 1,068,828 | 227,089    | +613,276 / +114,901 | none     |
| + `hono-openapi`             | 1,009,979 | 213,756    | +554,427 / +101,568 | none     |
| all three                    | 1,149,058 | 243,977    |                     | none     |

Stand-alone costs: Hono core 58,008 raw / 15,872 gzip; zod alone (already in the baseline through
`@forgeron/manifest`) 157,496 / 35,763; `@hono/zod-openapi` alone 788,094 / 153,398; `hono-openapi`
alone 618,470 / 113,941; `hono/client` 8,619 / 2,785.

Two things the numbers hide:

- **The bundle did not build correctly at first.** `@asteasolutions/zod-to-openapi` has `module` and `main`
  but no `exports`; with `platform: "neutral"` Rolldown reads neither, silently left the import external, and
  `bundle.test.ts` failed in workerd (`No such module "@asteasolutions/zod-to-openapi"`). Fix, one line in
  `scripts/build.ts`: `resolve.mainFields: ["module", "main"]`. The baseline output is byte-identical with
  it (455,552). A first measurement taken before this fix was wrong (about 554 KB too small) and was
  redone.
- **`hono-openapi` leaves dynamic imports external** (`import("zod-openapi")`, `import("effect")`,
  `import("sury")`, `import("@valibot/to-json-schema")`, `import("zod-to-json-schema")`). They are lazy, so
  loading works, but its document route for zod 4 may need one of them at run time in workerd. It passed
  in Node tests; it was **not** run in workerd.

No `node:*` appears in any output, including the three-variant bundle. After wiring `zod-openapi` into
`createGateway`, `bundle.test.ts` (Miniflare/workerd) passes.

**Tests and type check** (wall clock; the noise from other sessions is larger than the differences):

| Measure        | Before            | After                                                                          |
| -------------- | ----------------- | ------------------------------------------------------------------------------ |
| Gateway vitest | 330 tests, 5.56 s | 347 tests (17 new), 3.42 s and 6.48 s on two runs                              |
| `tsc` gateway  | 1.9 s             | not timed on its own                                                           |
| `tsc` console  | 1.1 to 1.5 s      | 1.2 to 1.5 s with the contract client (first, cold run 4.1 s); 1.8 s with `hc` |

So: no measurable slowdown of the gateway tests; the console type check grows by a few tenths of a second
with the contract client and about 0.5 s with `hc` (which pulls the gateway's program into the console's).

**Lines of code** (after `oxfmt`; "before" is the legacy code serving these routes):

- Before: `handleTools` with its options and helper, 26 lines; `members.ts` is 152 lines for 6 routes, about
  25 per route, of which the helpers (JSON parser, `stringList`, `json`, 401/403/415 guards, error mapping)
  are shared by all of them.
- After, for the same three routes: `rpc.ts` 74 lines; `zod-openapi.ts` 60 + `routes.ts` 58 (the route
  objects, shared with the client) + `schemas.ts` 35; `hono-openapi.ts` 100. `core.ts` (71) is the logic
  common to all three variants and replaces the logic of the legacy handlers; `client.ts` (49) is written
  once for every route. (These counts are from before a last cleanup of unused imports.)
- For three routes the Hono code is not shorter than the legacy code. What goes away is the per-handler
  boilerplate (path regex, `json`, parser, guards, error mapping) once it is written as middleware and one
  `onError`; the saving would show over the other nine handlers, which was not measured.

**What a changed response shape does** (rename `production` to `live` in `ToolListing`'s schema, then `tsc`):

| Variant                                      | Server (gateway) compile                                                       | Client compile (console)                                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `@hono/zod-openapi` + contract               | **error** at the handler (TS2322)                                              | **error** at the screen (TS2339)                                                                                   |
| `hc<RpcApp>` (type from the server)          | none: the type follows the handler                                             | **error** at the screen (TS2339) when the handler's type changes (renaming `production` in `console-api/tools.ts`) |
| `hono-openapi` and RPC with schemas in place | **none**: 0 errors; the document says `live`, the handler returns `production` | n/a                                                                                                                |

A wrong request input in the console (`roles: "admin"` where a list is expected) is also a compile error
with the contract client.

## Comparison on the same routes

| Criterion                               | RPC (`hc` + `zod-validator`)                                                                                                                                                     | `@hono/zod-openapi`                                                               | `hono-openapi`                                        |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Typed client for console and CLI        | yes, but needs the server's app type                                                                                                                                             | yes, from the route objects: 49 lines, no app type needed                         | `hc<App>`, as RPC                                     |
| App type reachable from the console     | **no**: `bun run deps` fails with `apps-do-not-import-each-other` (`apps/console/src/proto-hc.ts → apps/gateway/src/proto/rpc.ts`); the routes would have to move into a package | route objects live in a package, handlers stay in the gateway                     | as RPC                                                |
| OpenAPI 3.1 document                    | none                                                                                                                                                                             | yes, `getOpenAPI31Document`; 3,752 bytes for the 3 routes                         | yes, reports `openapi: "3.1.0"`; 3,466 bytes          |
| Handler checked against the contract    | input only (validators)                                                                                                                                                          | **yes**, input and every declared response, at compile time                       | input only; responses are documentation               |
| Contract written once                   | schemas yes, routes no                                                                                                                                                           | schemas and routes both in the contract package                                   | schemas yes; `describeRoute` repeated by each handler |
| Bundle delta (raw / gzip)               | +69 KB / +19 KB                                                                                                                                                                  | +613 KB / +115 KB                                                                 | +554 KB / +102 KB                                     |
| Non-JSON write (legacy answers 415)     | 415 (hand-made middleware)                                                                                                                                                       | 415 only after mapping Hono's thrown `HTTPException` in `onError`; without, a 500 | 400 (differs from legacy)                             |
| Invalid-input answer                    | a hook gives the legacy `{ error: "INVALID", message }`                                                                                                                          | `defaultHook` gives the same                                                      | a hook gives the same                                 |
| 401/403 from middleware in client types | not verified here                                                                                                                                                                | declared per route in `responses`, so in the client's `Answer` union              | not verified here                                     |
| Extra code per route                    | validators + hook                                                                                                                                                                | one `createRoute` (about 15 lines) + handler                                      | `describeRoute` + `resolver` + validator + handler    |
| Dynamic imports left external           | none                                                                                                                                                                             | none (after the `mainFields` fix)                                                 | 5 optional ones                                       |

`hono-openapi` is smaller than `@hono/zod-openapi` by 59 KB raw and does not check handlers against the
contract, so nothing here favours it for this repository. RPC is the cheapest, and the right choice only
if no document is wanted and the routes can move into a package.

## How FOR-137 fits

`catalog.ts` already is what this contract needs: zod 4.6.7 `strictObject` schemas with inferred types,
imported by the console as types. Using them as `createRoute` response schemas looks mechanical, but it was
not run in the prototype (the file lives on another branch). From reading it:

- `GET /api/catalog` and `GET /api/catalog/<tool>` are plain JSON routes with 401 and 404: the same shape as
  the three prototype routes.
- `GET /api/catalog/<tool>/assets/<path>` returns an image with specific cache headers. OpenAPI can
  describe it (`content: { "image/png": … }`), but the prototype's client only handles JSON; it needs a
  second method returning the `Response` for asset routes.
- The catalog is a good first route set for the migration: it is new, so there is no legacy handler to
  keep in step.
- Where the schemas live: `@forgeron/manifest` is the tool declaration (SDK, compiler). The platform API
  contract should be its own package (`platform-contract` in the prototype) that imports types from
  `manifest` where it reuses them, so the console does not depend on the compiler's package.

## Position on GraphQL for the platform API

**Do not adopt GraphQL for the platform API now.** Evidence:

- Linear and Notion clones are rich graphs: issues, projects, cycles, labels, relations, filters
  composed by the client, pagination everywhere, and a local-first sync layer reading whole sub-graphs.
  GraphQL (Yoga, SDL, DataLoader, depth and complexity limits, persisted documents) was chosen for that,
  and the cost is real: an SDL, codegen with a CI `--check`, resolver types, a loader per relation
  (`ARCHITECTURE.md` section 6).
- The console API of Forgeron is flat resource screens: members, invitations, tools, environments,
  secrets status, access matrix, approvals, audit, connections, catalog. Each screen reads one or two
  resources, and authorization is per route and per role. REST with a typed contract fits this, and
  per-route authorization maps directly to Hono middleware; in GraphQL it moves into every resolver.
- We already have one source of truth in zod. GraphQL would add a second schema language and a build
  step that the owner's products pay for and Forgeron does not need yet. The size cost of Yoga on this
  bundle was not measured.
- The tools' own interfaces (MCP, API, CLI, Web) are generated from actions and are out of scope.

**Where a graph API could be added later**, without a rewrite: as another handler in the same Worker
(`/graphql` next to `/console-api`, as section 3 of the owner's `ARCHITECTURE.md` does), behind the same
`caller` resolver, calling the same `core` functions the Hono routes call (which is why the prototype
separates `core.ts` from the HTTP wiring). Signals that would justify it: a console screen that needs
several related resources (tool, environments, versions, audit, access) in one round trip, client-composed
filters over audit and tool data, or third parties asking for a query language. Until then a REST endpoint
that returns the joined view is cheaper. If it is added, decide then between a schema built from zod and
SDL; the owner's Valibot-plus-SDL setup duplicates types, which was not evaluated further.

## Recommendation

1. **Adopt Hono for the platform API under `/console-api`, with `@hono/zod-openapi` and the route objects
   in a new package `packages/platform-contract`.** The package depends on `zod` only. Write the route
   objects as plain objects typed with `RouteConfig` (a type import) so the console and the CLI do not
   bundle `@hono/zod-openapi` (788 KB raw on its own); the gateway's `app.openapi` accepts them. The
   prototype's `routes.ts` calls `createRoute` at run time, and the console's own bundle size with it was
   **not** measured: settle that first.
2. **Generate the client from the route objects** (the 49-line `createClient`), not `hc`. It needs no
   server type, passes `apps-do-not-import-each-other`, and fails to compile in the same cases. The CLI
   uses the same client with `Authorization: Bearer`.
3. **Serve the OpenAPI 3.1 document** from the same objects (`/console-api/api/openapi.json`, for
   signed-in members in the prototype). Decide separately whether it is public.
4. **One `onError`, one identity middleware, one JSON-only middleware.** The prototype showed the three
   places where defaults differ from the legacy code: the non-JSON write (415), the shape of the validation
   error, and the `HTTPException` thrown by middleware.
5. **Accept the size.** +115 KB gzip brings the gateway to about 227 KB gzip / 1.07 MB raw, far below the
   Workers limits. The module is also stored in the platform D1 in 20,000-character chunks
   (`saveGatewayCode`), so it goes from about 23 to about 54 rows and is reloaded on each binding change.
   Install time and that path with a 1 MB module were not measured.

If the size is judged too high: use RPC plus `zod-validator` on the server (+19 KB gzip) and keep the
contract schemas and the generated client; the document and the handler check are then lost.

## Migration order (each step keeps `bun run check` green)

The fall-through of the prototype (Hono answers the paths it owns and tags the others with a header, the
legacy chain continues for them) lets routes move one handler at a time; remove the tag when the chain is empty.

1. **Build and pins.** Add `resolve.mainFields: ["module", "main"]` to `scripts/build.ts`, keep
   `bundle.test.ts`, pin Hono, `@hono/zod-openapi` and `zod` exactly. No behaviour change.
2. **Contract package.** `packages/platform-contract` with `moon.yml`, `tsconfig.json`, its entry in
   `docs/ARCHITECTURE.md`, and a dependency-cruiser rule that it imports only `zod` and the shared schema
   packages. Content: `ErrorSchema`, the route type, the client. No wiring yet.
3. **Hono shell in the gateway.** `createGateway` builds one Hono app (middleware: identity, JSON-only,
   `no-store`, `onError`, `notFound` with the tag) and calls it first; with no routes it changes nothing.
   Tests: a 401/403/415/400 matrix shared by every route.
4. **First routes: the catalog of FOR-137.** New routes have no legacy handler. The console reads them
   through the typed client. Publish the OpenAPI document here.
5. **Read routes, one handler per pull request:** tools, workspace, audit, access matrix, connections,
   secrets status. Each moves its schemas into the contract, ports the handler, keeps its existing test
   (calling the app instead of the handler) and deletes the legacy code.
6. **Write routes:** members and invitations, membership settings, identity provider, secrets, approvals,
   revocations. Keep the JSON-only rule and the registry error mapping as they are; the parity tests of
   this spike are the model.
7. **Console and CLI.** Replace `fetchJson`/`sendJson` by the typed client screen by screen (`ApiError` and
   `explain` stay); give the CLI the same client for the platform routes (`/whoami`, `/deploy-tokens`,
   `/deploy`, `/promote`, `/rollback`, `/auth/token`). They are outside `/console-api` and use Bearer
   tokens; they can be mounted on the same Hono app.
8. **Remove the chain.** Delete the legacy `handleX` functions and the fall-through tag.

The hand-written HTML sign-in and consent pages (`/auth/*`) stay out of this migration; they depend on the
outcome of the authentication spike.

## Risks

- **Bundle size:** +115 KB gzip, mostly `@asteasolutions/zod-to-openapi` (pulled in by `@hono/zod-openapi`).
- **Third-party packaging:** `zod-to-openapi` ships without `exports`; the build needed a change that also
  applies to every other dependency Rolldown resolves (the baseline output did not change). `hono-openapi`
  leaves lazy imports external. A dependency update can bring either problem back; the workerd bundle test
  is what catches it.
- **Library age:** `hono-openapi` 1.5.0 and `@hono/zod-openapi` 1.6.3 are recent; Hono 4.13.16 is three
  days old. Versions are pinned.
- **Defaults that differ from the legacy code:** Hono throws `HTTPException` for a wrong media type, which
  is a 500 without an `onError` mapping (the first prototype run showed it).
- **Console bundle:** importing route objects at run time may bring `@hono/zod-openapi` into the browser
  (not measured, see recommendation 1).
- **Type-check cost grows with the number of routes.** Hono's RPC guide warns about editor slowness with
  many routes; with route objects and a hand-made client it should be lower, not measured at 40 routes.
- **Schema extension:** `@hono/zod-openapi` calls `extendZodWithOpenApi`, which extends zod's prototype for
  the whole Worker, `@forgeron/manifest` schemas included. Side effects not checked.

## Not tested

- Cold start in workerd, and the 1 MB module through `platform install` and `loadGatewayCode` against a
  real D1. Nothing was run against any Cloudflare account.
- The `hono-openapi` document route in workerd, and any route other than the three. The real session cookie
  and token path through `createGateway` for the three routes was only exercised by the existing gateway
  suite (347 tests, the 17 new ones included, passed with `zod-openapi` wired in).
- Whether middleware answers (401/403) appear in an `hc` client's types (the guide says only declared
  responses do).
- `hono/csrf` or an Origin check on `/console-api` writes (the current rule is the JSON content-type).
- Streaming, binary (the catalog image route), multipart and server-sent events.
- The console's own production bundle with the contract client, and `bun run check` on the prototype. It
  does not pass by design: `bun run deps` reports the `hc` import across apps (`proto-hc.ts`), and knip and
  lint were not cleaned. A last cleanup of unused imports in `proto/` was interrupted and its result not seen.
- The gateway's type-check time after the change, as a separate number.
- GraphQL beyond reading the owner's repositories: no Yoga was built or measured.
- The FOR-137 schemas inside `createRoute`: read, not run.
