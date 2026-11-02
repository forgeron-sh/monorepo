# Forgeron — repository guidelines

Monorepo for the Forgeron SDK, CLI, runtime, platform and templates. Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) before creating an app, a package or a template; [docs/sdk.md](docs/sdk.md) is authoritative for the public API.

## Commands

- Toolchain pinned in `.prototools`; run `proto use` once, then `bun install`.
- `bun run check` before pushing: types, lint, format, tests, knip, deps, import-rule self-test.
- After a change: `bun run format` (oxfmt, two spaces, double quotes, semicolons).

## Rules

- Conventional Commits (commitlint). No co-author line.
- A new app, package or template: a `moon.yml`, a `tsconfig.json` extending `@forgeron/tsconfig`, and the matching entry in `docs/ARCHITECTURE.md`.
- Respect the rules in `.dependency-cruiser.cjs`: never import between apps; the runtime stays free of `node:*`; templates only use the public API.
- No real secret in the repository, tests, fixtures or logs. Upstreams (Odoo, Microsoft) are simulated in tests.
- Versions pinned exactly in `package.json` files (no `^`).
