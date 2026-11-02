# Journal des décisions

Chaque décision d'architecture ou d'outillage est consignée ici, dans l'ordre où elle est prise.

Règles du journal :

- On **ajoute** une entrée à la fin ; on ne réécrit jamais une décision passée.
- Pour revenir sur une décision, on en ajoute une nouvelle et on passe l'ancienne au statut « Remplacée par D-0xx ».
- Chaque entrée dit ce qui a été décidé, pourquoi, ce qui a été écarté, et où c'est appliqué (fichiers, sections de `sdk.md` ou `ARCHITECTURE.md`).
- Une source extérieure (doc Cloudflare, essai) est citée avec sa date.

## Index

| N°    | Date       | Décision                                                                                                             | Statut              |
| ----- | ---------- | -------------------------------------------------------------------------------------------------------------------- | ------------------- |
| D-001 | 22/10/2026 | Reprendre l'outillage et les conventions de siages                                                                   | Active              |
| D-002 | 22/10/2026 | TypeScript 6, pas 7                                                                                                  | Active              |
| D-003 | 22/10/2026 | Le CLI est une app (`apps/cli`), le SDK un paquet (`packages/sdk`)                                                   | Active              |
| D-004 | 22/10/2026 | Le build d'un tool se fait dans la CI de son dépôt                                                                   | Active              |
| D-005 | 22/10/2026 | Build, version et release sont trois notions distinctes                                                              | Active              |
| D-006 | 22/10/2026 | Un `forgeron.config.ts` = un tool                                                                                    | Active              |
| D-007 | 22/10/2026 | Les modèles du catalogue utilisent `forgeron release`                                                                | Active              |
| D-008 | 22/10/2026 | Exécuter les tools avec Dynamic Workers                                                                              | Remplacée par D-009 |
| D-009 | 22/10/2026 | Deux modes d'hébergement derrière une même interface : Workers for Platforms (cloud), Workers classiques (self-host) | Active              |
| D-010 | 22/10/2026 | Une base D1 par tool et par environnement, branchée directement sur le Worker du tool                                | Active              |

---

## D-001 — Reprendre l'outillage et les conventions de siages

- **Date** : 22/10/2026 · **Statut** : Active
- **Décision** : le dépôt reprend l'outillage de siages (projet Epitech, octobre 2026) : proto, Bun, moon, oxlint, oxfmt, Vitest, knip, dependency-cruiser, lefthook, commitlint (Conventional Commits), release-please ; mêmes workflows GitHub (CI, Release, Deploy), modèles d'issue et de PR, `CONTRIBUTING`, `SECURITY`, `CODE_OF_CONDUCT`. Repris aussi du SDK Odoo : `.editorconfig`, contournement d'un `core.hooksPath` global dans `prepare`.
- **Pourquoi** : que tous nos dépôts se ressemblent.
- **Écarté** : le workflow de miroir vers le dépôt Epitech (propre à siages).
- **Ajouté** : un contrôle du titre de PR en CI, car le titre devient le commit fusionné que lit release-please.
- **Appliqué dans** : fichiers racine, `.github/`, `.moon/`, `ARCHITECTURE.md` (« Outillage »).

## D-002 — TypeScript 6, pas 7

- **Date** : 22/10/2026 · **Statut** : Active
- **Décision** : `typescript` épinglé en `6.0.3`.
- **Pourquoi** : dependency-cruiser n'accepte que TypeScript `<7`. Avec la 7, il n'analyse **aucun** module (« 0 modules cruised ») sans échouer : les règles d'import passeraient toujours. Constaté le 22/10/2026 avec dependency-cruiser 18.6.0.
- **Écarté** : TypeScript 7.0.2, utilisé par le SDK Odoo et toolbox-poc (toolbox-poc est probablement touché par le même problème, non vérifié).
- **Appliqué dans** : `package.json`, `ARCHITECTURE.md` (« Outillage »).

## D-003 — Le CLI est une app, le SDK un paquet

- **Date** : 22/10/2026 · **Statut** : Active
- **Décision** : le binaire `forgeron` vit dans `apps/cli` (`@forgeron/cli`) ; ce qu'importe un tool vit dans `packages/sdk` (`@forgeron/sdk`). `sdk.md` §18 prévoyait un paquet unique `forgeron` contenant les deux.
- **Pourquoi** : le SDK reste léger et sans dépendance Node ; le CLI évolue sans republier le SDK. Le CLI dépend du SDK, jamais l'inverse.
- **Reste ouvert** : le nom npm public (piste : publier le CLI sous `forgeron` pour garder `npx forgeron`).
- **Appliqué dans** : `apps/cli`, `packages/sdk`, `ARCHITECTURE.md`.

## D-004 — Le build d'un tool se fait dans la CI de son dépôt

- **Date** : 22/10/2026 · **Statut** : Active
- **Décision** : une action GitHub réutilisable exécute `forgeron test`, `forgeron change check` et `forgeron deploy` dans le dépôt du tool. L'application GitHub Forgeron viendra plus tard ; elle installe l'action et affiche les déploiements dans les PR, mais **ne construit rien** côté plateforme.
- **Pourquoi** : aucune infrastructure de build à héberger (un bundler tourne sous Node, pas dans un Worker) ; le même chemin en local, en CI et en self-host.
- **Écarté** : un build par la plateforme à chaque push (machines de build à opérer).
- **Reste ouvert** : remplacer `FORGERON_TOKEN` par l'OIDC de GitHub Actions ; nom de l'action.
- **Appliqué dans** : `sdk.md` §15 (« Publier depuis GitHub »), `ARCHITECTURE.md` (« Publication d'un tool »).

## D-005 — Build, version et release sont trois notions distinctes

- **Date** : 22/10/2026 · **Statut** : Active
- **Décision** : un **build** est produit à chaque push (identifié par le commit) ; la **version** semver ne change qu'avec `forgeron release` ; ce qui est déployé porte les deux (`v1.5.0+a41f9e0`).
- **Pourquoi** : la spec disait à la fois « chaque push crée une version » et « la version ne change qu'avec `forgeron release` ».
- **Appliqué dans** : `sdk.md` §1 et §16 (« Build, version, release »).

## D-006 — Un `forgeron.config.ts` = un tool

- **Date** : 22/10/2026 · **Statut** : Active
- **Décision** : dans un dépôt, chaque dossier qui contient un `forgeron.config.ts`, à n'importe quelle profondeur (hors `node_modules`), est un tool. Deux tools d'un même dépôt ne peuvent pas avoir le même `name`.
- **Pourquoi** : le CLI, l'action GitHub et la console découvrent les tools sans autre déclaration.
- **Appliqué dans** : `sdk.md` §2.

## D-007 — Les modèles du catalogue utilisent `forgeron release`

- **Date** : 22/10/2026 · **Statut** : Active
- **Décision** : les modèles de `templates/` sont des tools ; ils sont versionnés par `forgeron release` (tags `crm@1.0.0`), pas par release-please. Ils seront exclus de `release-please-config.json` au passage en multi-composants.
- **Pourquoi** : c'est le système qu'utiliseront les clients ; le dépôt le teste en premier.
- **Écarté** : release-please pour les modèles.
- **Appliqué dans** : `ARCHITECTURE.md` (« Versions »).

## D-008 — Exécuter les tools avec Dynamic Workers

- **Date** : 22/10/2026 · **Statut** : Remplacée par D-009
- **Décision** : la gateway charge chaque tool avec le binding Worker Loader (`env.LOADER.get("<espace>/<tool>@<build>", …)`).
- **Pourquoi** : fonctionne entièrement en local. Essai du 22/10/2026 (wrangler 4.151.2) : chargement par identifiant de build, nouveau code servi sans redéployer, base par tool via binding RPC, `env` limité, sortie réseau filtrée, SQLite par Durable Object Facet. Seule la limite CPU n'est pas appliquée en local.
- **Pourquoi remplacée** : un Worker dynamique ne reçoit ni D1, ni KV, ni R2 directement, seulement des bindings RPC fournis par la gateway. Il aurait fallu un proxy de données maison, et les tools n'auraient pas tourné comme des Workers ordinaires. Voir D-009 et D-010.

## D-009 — Deux modes d'hébergement derrière une même interface

- **Date** : 22/10/2026 · **Statut** : Active
- **Décision** : la gateway et le CLI déploient les tools au travers d'une interface unique, `@forgeron/hosting`, avec trois implémentations :

  | Mode                                               | Implémentation                                                                                         | Compte Cloudflare |
  | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------- |
  | Cloud Forgeron (offre payante, hébergement inclus) | Workers for Platforms : un Worker utilisateur par tool et par environnement dans un dispatch namespace | celui de Forgeron |
  | Self-host                                          | Workers classiques créés et mis à jour par l'API Cloudflare                                            | celui du client   |
  | Local                                              | `forgeron dev` : Worker local (workerd)                                                                | aucun             |

  L'interface crée le Worker du tool, crée ses ressources (D1, KV, R2), les lui branche, applique les migrations, bascule le trafic et supprime le tout.

- **Pourquoi** : dans les trois modes, le tool reçoit de **vraies** ressources Cloudflare. Le runtime et le code d'un tool sont identiques partout, sans proxy de données. Le self-host n'exige que le plan Workers Paid ; seul le cloud paie Workers for Platforms.
- **Écarté** : Dynamic Workers (D-008) ; Workers for Platforms seul (impose l'achat au client self-host) ; Workers classiques seuls (limite de 500 Workers par compte, voir ci-dessous).
- **Contraintes connues** :
  - Workers classiques : 500 Workers par compte sur Workers Paid (doc « Limits » du 12/10/2026). Chaque tool en consomme un par environnement, plus un par preview : les previews doivent être supprimées automatiquement à la fusion de leur branche.
  - Workers classiques : un service binding se fixe au déploiement de la gateway, et l'API de réglages des scripts lue ne permet pas de le modifier sans renvoyer le code. La gateway est donc redéployée par l'API **à l'ajout ou à la suppression d'un tool**, pas à chaque version (le Worker d'un tool garde un nom stable par environnement).
  - Workers for Platforms : 25 $ par mois, 20 millions de requêtes et 1 000 scripts inclus, puis 0,02 $ par script (doc « Pricing » du 21/04/2026). Bindings propres par Worker utilisateur, déclarés à l'envoi du code (doc « Bindings » du 16/09/2026). En local, la gateway ne peut appeler que des Workers utilisateurs déployés (doc du 25/06/2026).
  - Le jeton API Cloudflare du client self-host est le secret le plus sensible de l'installation : permissions limitées à Workers, D1, KV et R2.
- **Reste ouvert** : exposer les previews en self-host sans redéployer la gateway à chaque branche (URL de preview par version, ou accès HTTP avec jeton interne) ; vérifier l'envoi d'un Worker avec sa D1 sur Workers for Platforms (achat requis).
- **Appliqué dans** : `packages/hosting`, `ARCHITECTURE.md` (« Modes d'hébergement »), `sdk.md` §7, §19, §20, `white-paper.md`.

## D-010 — Une base D1 par tool et par environnement

- **Date** : 22/10/2026 · **Statut** : Active
- **Décision** : chaque tool reçoit une base D1 par environnement (et par preview), créée par `@forgeron/hosting` et branchée directement sur son Worker. Le SDK l'interroge avec Kysely ; les migrations restent celles de `sdk.md` §8.
- **Pourquoi** : isolation assurée par Cloudflare, limites par tool et non partagées, SQL et migrations conservés. Limites D1 (doc du 21/04/2026) : 10 GB par base, non extensibles ; 50 000 bases par compte ; une base traite une requête à la fois (environ 1 000 requêtes par seconde pour des requêtes de 1 ms) ; restauration à 30 jours.
- **Écarté** :
  - une base de documents maison, unique (pour tout le monde ou par espace) : limites partagées, moteur de requêtes à réinventer, isolation reposant sur notre seul code ;
  - une base SQL par espace avec des tables préfixées par tool : isolation par analyse du SQL, fragile ;
  - SQLite de Durable Object (facets ou proxy RPC) : n'était utile qu'avec Dynamic Workers.
- **Retenu pour plus tard** : une API de documents optionnelle (`ctx.docs`) au-dessus de la base SQLite du tool, s'appuyant sur les colonnes JSON (`t.json`).
- **Reste ouvert** : la transaction par action promise par `sdk.md` §6 et §9. D1 ne semble proposer que des lots atomiques, sans transaction interactive (à vérifier) ; il faudra peut-être la remplacer par `ctx.db.batch()`.
- **Appliqué dans** : `sdk.md` §8 et §20, `ARCHITECTURE.md`.
