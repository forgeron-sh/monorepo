# Contributing to Forgeron

This guide explains how to set up the project, propose a change and take it all the way to production.

## Prerequisites

Tool versions are pinned in `.prototools` and installed by [proto](https://moonrepo.dev/proto).

```bash
proto use
bun install
```

`bun install` also installs the git hooks (lefthook).

## Running the project

```bash
bun run dev
```

The repository layout (apps, packages, templates, environments) is described in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Proposing a change

1. Start from an up-to-date `main` and create a branch (`feat/…`, `fix/…`, `docs/…`).
2. Keep commits small and focused.
3. Run `bun run check` before pushing (the `pre-push` hook does it too).
4. Open a pull request against `main` and fill in the template.
5. Wait for a green CI and at least one approving review before merging (squash).

### Commits

Messages follow [Conventional Commits](https://www.conventionalcommits.org/), checked by commitlint on `commit-msg`. The PR title is checked in CI: it becomes the merged commit message.

```text
feat(sdk): add the rateLimit option to actions
fix(gateway): reject a token whose audience does not match the tool
docs: clarify the expand / contract rule for migrations
```

Usual scopes: `sdk`, `cli`, `runtime`, `compiler`, `manifest`, `ui`, `gateway`, `console`, `site`, `template-<name>`, `connector-<name>`, `ci`.

The type determines the next version (see [Versions and changelog](#versions-and-changelog)).

### Checks

| Command                | Check                                      |
| ---------------------- | ------------------------------------------ |
| `bun run lint`         | Lint (oxlint)                              |
| `bun run format:check` | Formatting (oxfmt); `bun run format` fixes |
| `bun run typecheck`    | TypeScript types                           |
| `bun run test`         | Tests (Vitest)                             |
| `bun run knip`         | Unused code and dependencies               |
| `bun run deps`         | Import rules between packages              |
| `bun run check`        | All of the above                           |

## CI/CD

| Branch       | Role                             | Trigger                                |
| ------------ | -------------------------------- | -------------------------------------- |
| `main`       | Integration, CI on every PR      | `.github/workflows/ci.yml`             |
| `staging`    | Cloudflare staging deployment    | merge → `.github/workflows/deploy.yml` |
| `production` | Cloudflare production deployment | merge → `.github/workflows/deploy.yml` |

Secrets required in the `staging` and `production` GitHub environments: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

## Versions and changelog

Versions are managed by release-please (`.github/workflows/release.yml`). Every merge to `main` updates a "release" PR; merging it creates the `vX.Y.Z` tag and the GitHub release, updates `CHANGELOG.md` and deploys to staging.

The version follows from the commits: `fix` → patch, `feat` → minor, `feat!` or `BREAKING CHANGE` → major (minor while the version is `0.x`). `ci`, `chore`, `docs`, `refactor` and `test` do not trigger a release. To force a version, add `Release-As: X.Y.Z` in the commit footer.

A single version for the whole repository until the first npm publication; after that, one version per component (see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#versions)).

## Reporting a bug or suggesting an idea

Open an issue with the matching template. For a security vulnerability, follow [SECURITY.md](SECURITY.md) and do not open a public issue.

## Code of conduct

By participating, you agree to the [code of conduct](CODE_OF_CONDUCT.md).
