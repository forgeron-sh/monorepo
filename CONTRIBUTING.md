# Contribuer à Forgeron

Ce guide explique comment installer le projet, proposer un changement et l'amener jusqu'en production.

## Prérequis

Les versions des outils sont épinglées dans `.prototools` et installées par [proto](https://moonrepo.dev/proto).

```bash
proto use
bun install
```

`bun install` installe aussi les hooks git (lefthook).

## Lancer le projet

```bash
bun run dev
```

L'organisation du dépôt (apps, paquets, modèles, environnements) est décrite dans [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Proposer un changement

1. Partir d'un `main` à jour et créer une branche (`feat/…`, `fix/…`, `docs/…`).
2. Garder des commits petits et ciblés.
3. Lancer `bun run check` avant de pousser (le hook `pre-push` le fait aussi).
4. Ouvrir une pull request vers `main` et remplir le modèle.
5. Attendre une CI verte et au moins une revue approuvée avant de fusionner (squash).

### Commits

Les messages suivent [Conventional Commits](https://www.conventionalcommits.org/), contrôlés par commitlint sur `commit-msg`. Le titre de la PR est contrôlé en CI : il devient le message du commit fusionné.

```text
feat(sdk): ajoute l'option rateLimit aux actions
fix(gateway): refuse un jeton dont l'audience ne correspond pas au tool
docs: précise la règle expand / contract des migrations
```

Portées usuelles : `sdk`, `cli`, `runtime`, `compiler`, `manifest`, `ui`, `gateway`, `console`, `site`, `template-<nom>`, `connector-<nom>`, `ci`.

Le type détermine la version suivante (voir [Versions et changelog](#versions-et-changelog)).

### Contrôles

| Commande               | Contrôle                                     |
| ---------------------- | -------------------------------------------- |
| `bun run lint`         | Lint (oxlint)                                |
| `bun run format:check` | Formatage (oxfmt) ; `bun run format` corrige |
| `bun run typecheck`    | Types TypeScript                             |
| `bun run test`         | Tests (Vitest)                               |
| `bun run knip`         | Code et dépendances inutilisés               |
| `bun run deps`         | Règles d'import entre paquets                |
| `bun run check`        | Tout ce qui précède                          |

## CI/CD

| Branche      | Rôle                                 | Déclencheur                            |
| ------------ | ------------------------------------ | -------------------------------------- |
| `main`       | Intégration, CI sur chaque PR        | `.github/workflows/ci.yml`             |
| `staging`    | Déploiement Cloudflare de staging    | merge → `.github/workflows/deploy.yml` |
| `production` | Déploiement Cloudflare de production | merge → `.github/workflows/deploy.yml` |

Secrets requis dans les environnements GitHub `staging` et `production` : `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

## Versions et changelog

Versions gérées par release-please (`.github/workflows/release.yml`). Chaque merge sur `main` met à jour une PR « release » ; la fusionner crée le tag `vX.Y.Z` et la release GitHub, met à jour `CHANGELOG.md` et déploie en staging.

La version découle des commits : `fix` → patch, `feat` → minor, `feat!` ou `BREAKING CHANGE` → major (minor tant que la version est en `0.x`). `ci`, `chore`, `docs`, `refactor` et `test` ne déclenchent pas de release. Pour forcer une version, ajouter `Release-As: X.Y.Z` en pied de commit.

Une seule version pour tout le dépôt jusqu'à la première publication npm ; ensuite, une version par composant (voir [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#versions)).

## Signaler un bug ou proposer une idée

Ouvrez une issue avec le modèle correspondant. Pour une faille de sécurité, suivez [SECURITY.md](SECURITY.md) et n'ouvrez pas d'issue publique.

## Code de conduite

En participant, vous acceptez le [code de conduite](CODE_OF_CONDUCT.md).
