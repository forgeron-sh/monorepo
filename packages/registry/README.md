# @forgeron/registry

The registry of the platform D1 (docs/ARCHITECTURE.md, "The platform"): tools, builds, versions, environments and resource approvals.

## Contents

- `platformMigrations`: the schema, as `BuildMigration` lists applied by `applyMigrations` from `@forgeron/hosting`, one batch per migration with its row in `_forgeron_migrations` (D-014).
- `createRegistry(d1)`: the typed access layer. Neutral (no Node API), so the gateway (a Worker) can use it.
- `bun run migrate` (`scripts/migrate.ts`): applies the migrations to the platform D1 through the Cloudflare API; the deploy workflow runs it before deploying.

## Model

| Table          | One row is                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------- |
| `tools`        | a tool of a workspace, unique by (`workspace`, `name`)                                      |
| `builds`       | what CI sent: a fingerprint, the manifest and the changelog; one per fingerprint            |
| `versions`     | a build published under a version number of the tool                                        |
| `environments` | a tool in `preview` (with its `branch`), `pilot` or `production`, and the version it serves |
| `approvals`    | a resource a version asks for, `pending`, `approved` or `rejected` by someone               |
