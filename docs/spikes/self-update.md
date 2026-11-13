# Update the platform from the console (D-138) — implementation spec

The brief of every implementation step. The decision is D-138 in [`DECISIONS.md`](../DECISIONS.md).

## Why

A self-hosted platform is updated today by running `forgeron platform install` again from a
checkout, with every flag repeated. The person who administers a workspace should see which version
runs, what a newer release brings, and update in one click, with a restore point.

## What already exists (read it before writing anything)

- The gateway knows its version and commit (`apps/gateway/src/version.ts`, injected by
  `apps/gateway/scripts/build.ts`), shown in Settings › Operations › **Install information**
  (`apps/console/src/settings.tsx`, `/api/workspace` → `install.version`).
- The gateway already uploads **new versions of itself** (D-032) when a tool is bound:
  `packages/hosting/src/self-host/gateway-bindings.ts` (`createGatewayBindings`), with its code and
  the console assets kept in the platform D1 (`saveGatewayCode`, `saveGatewayAssets`,
  `loadGatewayCode`, `loadGatewayAssets` in `@forgeron/registry`), every other binding `inherit`ed.
- Migrations: `applyMigrations(d1, migrations)` (`@forgeron/hosting`), `platformMigrations` and its
  JSON snapshot `packages/registry/src/migrations.golden.json`; `migratePlatform`.
- The install (`apps/cli/src/commands/platform.ts`) migrates, saves code and assets, uploads a
  version with `inherit` bindings, deploys it at 100 %.
- Releases: `release.yml` (release-please; the root component's tag is `v<version>`, e.g. `v0.5.0`).

## 1. The platform artifact (release)

- `scripts/platform-artifact.ts` writes `dist/forgeron-platform.json` after
  `bun run --cwd apps/gateway build` and `bun run --cwd apps/console build`:
  `{ format: 1, version, commit, worker: <base64 of apps/gateway/dist/worker.js>, assets: [{ path,
  base64 }] (apps/console/dist, same shape `saveGatewayAssets` takes), migrations:
  platformMigrations }`, and `dist/forgeron-platform.json.sha256` (hex sha256 of the JSON file,
  `<hex>  forgeron-platform.json`).
- `release.yml`: a job after `release-please` when `release_created == 'true'` builds it and uploads
  both files to the release `v<version>` (`gh release upload v<version> … --clobber`,
  `contents: write`). A GitHub-hosted or Blacksmith runner, like the others.
- Size: refuse to write an artifact over 20 MB.

## 2. The install records what an update needs

- `forgeron platform install` adds a `plain_text` binding `PLATFORM_D1_ID` (the platform D1's id it
  already knows) and keeps it like the other settings.
- Fix found on the way: `wrangler auth token` (wrangler 4) prints a banner before the token; the
  `--auth wrangler` provider (`apps/cli/src/commands/cloudflare-auth.ts`) must take the last line that
  looks like a token instead of requiring exactly one line (a test with the banner).

## 3. Platform permission

`platform:update` in `PLATFORM` (`packages/permissions/src/platform.ts`): label "Update Forgeron",
description "Update this platform to a newer release, with a restore point of its database.",
implies `settings:read`; group **Operations**. The admin team holds it through `*`. Engine tests and
the group test follow.

## 4. Gateway

- `UPDATE_REPOSITORY` (plain text, default `forgeron-sh/monorepo`, an install flag
  `--update-repository` is welcome) names where releases come from. `SELF_UPDATE=off` turns the
  feature off; it is always off on the cloud (`BASE_DOMAIN` ends with `forgeron.app`), where the
  platform is updated by its operator.
- `GET /api/platform/update` (`settings:read`): `{ current: { version, commit? }, latest?: {
  version, publishedAt, url, notes (release body, markdown) }, available: boolean, pending?: {
  migrations: string[] } (the migrations of the artifact this D1 has not applied, when the artifact
  was read), blocked?: { code, message } (off, cloud, no PLATFORM_D1_ID, no artifact on the release,
  not a self-host install), running?: UpdateRun }`. Latest = the highest `v<semver>` release (not
  draft, not prerelease) of `UPDATE_REPOSITORY` through the GitHub REST API without a token, cached
  10 minutes in memory; GitHub's failure → `latest` absent with a `blocked` reason, never a 500.
- `POST /api/platform/update` `{ version }` (`platform:update`), one at a time (409 `RUNNING`),
  never a downgrade or the same version (409 `NOT_NEWER`): creates a run and performs, in order,
  recording each step (`pending | running | done | failed`, message) in the platform D1:
  1. **download** the artifact and its `.sha256` from the release `v<version>`; check the hash, the
     `format`, `version` equals the one asked, the size (≤ 20 MB);
  2. **restore point**: `GET /accounts/{account}/d1/database/{PLATFORM_D1_ID}/time_travel/bookmark`
     with the gateway's token; the bookmark is stored on the run (no restore point → the run fails
     before anything changes);
  3. **migrate**: `applyMigrations(env.DB, artifact.migrations)` (the old gateway applies the new
     migrations, as the CLI does before it deploys);
  4. **code**: `saveGatewayCode`, `saveGatewayAssets`;
  5. **deploy**: a new version through the same code path as D-032's self-upload (assets uploaded,
     every binding `inherit`ed, the tool bindings kept), then a deployment at 100 %.
     The request answers `202 { run }` at once and the work goes on in `ctx.waitUntil` (or answers when
     done if that is simpler and stays under the Worker limits: say which). Audit: `platform:update`
     (from, to, bookmark, result). A failure after step 3 says what was done and how to restore:
     `wrangler d1 time-travel restore <database> --bookmark <bookmark>`.
- `GET /api/platform/update/runs/{id}` (`settings:read`): the run and its steps.
- Storage: a registry module `platform-updates` (table `platform_updates`: id, from_version,
  to_version, state, steps JSON, bookmark, actor, started_at, finished_at, error), with a module
  migration (not `root-migrations.ts`); the golden file regenerated.
- GitHub and Cloudflare are simulated in tests (the repo has `simulated-github.ts` and
  `packages/hosting/src/self-host/fake-cloudflare.ts`): artifact download, hash mismatch refused,
  downgrade refused, no `PLATFORM_D1_ID` blocked, bookmark taken before migrations, migrations applied,
  version uploaded with `inherit` bindings and deployed, audit line, permission matrix entries.

## 5. Console

Settings › Operations › **Install information** gains an **Updates** panel:

- Version and commit (as today), "Up to date" or "**v0.6.0** is available" with its date, a link to
  the release on GitHub and its notes (markdown, `@forgeron/ui`).
- The migrations it will apply, with a warning that migrations cannot be undone except by restoring
  the restore point.
- **Update to v0.6.0** (only with `platform:update`): a confirmation dialog (what happens, the restore
  point, that every workspace on this platform is updated), then the steps live (polling the run),
  and on success a "Reload" button (the console itself changed). On failure: the step, the message,
  the restore command with the bookmark.
- `blocked` reasons in plain words (e.g. "Run `forgeron platform install` once more: this install does
  not know its database id yet.").
- Mock (`apps/console/src/mock/*`) and tests.

## 6. Docs

D-138 in `DECISIONS.md`; `docs/self-host.md` (Updating: from the console, what it does, the restore
point, the first time still by the CLI, `SELF_UPDATE=off`, `UPDATE_REPOSITORY`); `docs/sdk.md` and
`docs/console-ux.md` (the permission and the panel).

## Not in scope

Automatic updates; updating tools; rolling back the code from the console (the restore command and
Cloudflare's deployments cover it); verifying a signature beyond the sha256 of the release (the
release is as trusted as the npm packages of the same workflow).
