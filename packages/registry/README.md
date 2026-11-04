# @forgeron/registry

The registry of the platform D1 (docs/ARCHITECTURE.md, "The platform"): tools, builds, versions, environments and resource approvals.

## Contents

- `platformMigrations`: the schema, as `BuildMigration` lists applied by `applyMigrations` from `@forgeron/hosting`, one batch per migration with its row in `_forgeron_migrations` (D-014).
- `createRegistry(d1)`: the typed access layer. Neutral (no Node API), so the gateway (a Worker) can use it.
- `createSecretBox(key)`: AES-256-GCM through WebCrypto; the key is the platform's master key (32 bytes, base64), held in the gateway's secrets. `createRegistry(d1, { secrets })` then offers `setSecret`, `secretNames` (names only), `deleteSecret` and `readSecrets` (for the runtime's `ctx.secrets`).
- `bun run migrate` (`scripts/migrate.ts`): applies the migrations to the platform D1 through the Cloudflare API; the deploy workflow runs it before deploying.

## Layout

`src/registry.ts` composes the modules behind `createRegistry`; `src/index.ts` is the package's only door (rule `registry-door-is-index`).

- `src/kernel/`: what every module shares (ids, clock, SQL helpers, secret box, `auditStatement`, `RegistryError`); it imports no module.
- `src/modules/<domain>/`: `catalog`, `secrets`, `connections`, `members`, `identity-store`, `approvals`, `access`, `audit`. Each has a `store.ts` (the SQL), `types.ts`, `public.ts` (the only file another module may import) and, when it owns tables, `migrations.ts`.
- `src/migrations.ts` sorts the modules' lists by name (the number is global). `migrations.golden.json` is the installed list (0001 to 0021): never edit an entry, append new migrations to it (`migrations.test.ts`). `src/root-migrations.ts` holds the migrations of stores that are not modules yet.

## Model

| Table          | One row is                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------- |
| `tools`        | a tool of a workspace, unique by (`workspace`, `name`)                                          |
| `builds`       | what CI sent: a fingerprint, the manifest and the changelog; one per fingerprint                |
| `versions`     | a build published under a version number of the tool                                            |
| `environments` | a tool in `preview` (with its `branch`) or `production`, and the version it serves              |
| `approvals`    | a resource a version asks for, `pending`, `approved` or `rejected` by someone                   |
| `secrets`      | a tool secret of an environment, AES-256-GCM encrypted, bound to its tool, environment and name |
