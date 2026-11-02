# Forgeron — consignes de dépôt

Monorepo du SDK, du CLI, du runtime, de la plateforme et des modèles Forgeron. Lire [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) avant de créer une app, un paquet ou un modèle ; [docs/sdk.md](docs/sdk.md) fait foi pour l'API publique.

## Commandes

- Toolchain épinglée dans `.prototools` ; `proto use` une fois, puis `bun install`.
- `bun run check` avant de pousser : types, lint, format, tests, knip, deps, auto-test des règles d'import.
- Après un changement : `bun run format` (oxfmt, deux espaces, guillemets doubles, point-virgule).

## Règles

- Commits Conventional Commits (commitlint). Pas de ligne de co-auteur.
- Une nouvelle app, un nouveau paquet ou un nouveau modèle : un `moon.yml`, un `tsconfig.json` qui étend `@forgeron/tsconfig`, et l'entrée correspondante dans `docs/ARCHITECTURE.md`.
- Respecter les règles de `.dependency-cruiser.cjs` : jamais d'import entre apps ; le runtime reste sans `node:*` ; les modèles n'utilisent que l'API publique.
- Aucun secret réel dans le dépôt, les tests, les fixtures ou les logs. Les amonts (Odoo, Microsoft) sont simulés en test.
- Versions épinglées exactement dans les `package.json` (pas de `^`).
