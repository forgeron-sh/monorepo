# Spécification du SDK Forgeron

> Statut : proposition de travail (v0), dérivée des exemples de `exemples/`. Tout nom d'API, de commande ou de fichier est à valider.

Ce document décrit comment on écrit, teste, construit et déploie un internal tool avec Forgeron. Il fixe une **forme unique** : un développeur qui ouvre n'importe quel tool Forgeron sait où trouver chaque chose.

## Sommaire

1. [Concepts](#1-concepts)
2. [Structure d'un tool](#2-structure-dun-tool)
3. [`forgeron.config.ts`](#3-forgeronconfigts)
4. [Le dossier `.forgeron`](#4-le-dossier-forgeron)
5. [Le CLI](#5-le-cli)
6. [Les actions](#6-les-actions)
7. [Les quatre interfaces](#7-les-quatre-interfaces)
8. [Base de données et migrations](#8-base-de-données-et-migrations)
9. [Événements et tâches planifiées](#9-événements-et-tâches-planifiées)
10. [Secrets, connecteurs, réseau, fichiers, cache](#10-secrets-connecteurs-réseau-fichiers-cache)
11. [Les vues](#11-les-vues)
12. [Composition entre tools](#12-composition-entre-tools)
13. [Tests](#13-tests)
14. [Build](#14-build)
15. [Versions, environnements, déploiement](#15-versions-environnements-déploiement)
16. [Versioning et changelog](#16-versioning-et-changelog)
17. [Le MCP d'administration](#17-le-mcp-dadministration)
18. [Les paquets npm](#18-les-paquets-npm)
19. [Ce que Forgeron réutilise](#19-ce-que-forgeron-réutilise)
20. [Questions ouvertes](#20-questions-ouvertes)

---

## 1. Concepts

| Concept            | Définition                                                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Espace**         | L'entreprise sur Forgeron : ses membres, son SSO, ses tools, ses secrets. Une URL de base (`acme.forgeron.app`).                                       |
| **Tool**           | Un dossier, un dépôt ou un sous-dossier de monorepo, qui déclare des données, des actions et éventuellement des vues.                                  |
| **Action**         | Une opération nommée, typée, avec un niveau d'accès. L'unité exposée en MCP, API, CLI et Web.                                                          |
| **Vue**            | Une page React servie par le tool, qui consomme ses actions.                                                                                           |
| **Niveau d'accès** | Ce qu'une action exige : `read`, `write`, `delete`, `admin`, ou un niveau propre au tool (`import`).                                                   |
| **Rôle**           | Un groupe de personnes et les niveaux qu'il accorde. Déclaré dans la config, ajustable dans la console.                                                |
| **Build**          | Le résultat immuable de `forgeron build` pour un commit donné. Chaque push produit un build, identifié par son commit.                                 |
| **Version**        | Le numéro semver d'un tool (`1.5.0`). Il ne change qu'avec `forgeron release` ; un build porte la version en cours plus son commit (`v1.5.0+a41f9e0`). |
| **Release**        | Le passage à une nouvelle version : `forgeron release` lit `changes/`, écrit le changelog et crée le tag `<tool>@<version>`.                           |
| **Environnement**  | Où tourne une version : `preview` (par branche), `pilot` (un groupe), `production`.                                                                    |

## 2. Structure d'un tool

```text
mon-tool/
├── forgeron.config.ts     # obligatoire
├── actions/               # obligatoire, au moins une action
│   └── <groupe>/<verbe>.ts
├── db/                    # si resources.db
│   ├── schema.ts
│   ├── seed.ts            # optionnel : données de dev et de preview
│   └── migrations/
│       ├── 0001_<nom>.ts
│       └── meta/snapshot.json
├── events/                # optionnel : gestionnaires d'événements
├── jobs/                  # optionnel : tâches planifiées
├── views/                 # optionnel : pages React
├── lib/                   # optionnel : code partagé, jamais exposé
├── tests/                 # Vitest
├── changes/               # obligatoire : changements en attente de release (section 16)
├── CHANGELOG.md           # obligatoire, généré par forgeron release
├── .forgeron/             # voir section 4
└── package.json           # porte la version du tool
```

Règles :

- Le **nom d'une action** est son chemin sous `actions/`, sans extension, avec des points : `actions/deals/move.ts` → `deals.move`. Profondeur maximale : deux niveaux (`groupe.verbe`). Verbes recommandés : `list`, `get`, `search`, `create`, `update`, `upsert`, `delete`, `move`, `import`.
- Un fichier sous `actions/`, `events/`, `jobs/` ou `views/` exporte **un seul** objet par défaut (`action`, `on`, `schedule`, `defineView`).
- Tout ce qui n'est pas dans ces dossiers n'est jamais exposé.
- **Un tool = un `forgeron.config.ts`.** Dans un dépôt qui contient plusieurs tools, chaque dossier qui porte un `forgeron.config.ts` est un tool, à n'importe quelle profondeur (hors `node_modules`). Le CLI, l'action GitHub et la console les découvrent ainsi, sans autre déclaration. Deux tools d'un même dépôt ne peuvent pas avoir le même `name`.

## 3. `forgeron.config.ts`

```ts
import { defineConfig, database, bucket, kv, queue, connector } from "forgeron";

export default defineConfig({
  name: "crm", // identifiant, [a-z0-9-], unique dans l'espace
  title: "CRM",
  description: "Sociétés, contacts et pistes.", // repris dans MCP, OpenAPI, l'aide du CLI
  interfaces: { mcp: true, api: true, cli: true, web: true },

  roles: {
    commercial: { label: "Commerciaux", grants: ["read", "write"] },
    direction: { label: "Direction", grants: ["read", "write", "delete"] },
  },

  // Tout ce que le tool demande à la plateforme. Rien d'autre n'est disponible à l'exécution.
  resources: {
    db: database({ engine: "d1", why: "Sociétés, contacts et pistes" }),
    files: bucket({
      maxSize: "25MB",
      types: ["application/pdf", "image/*"],
      why: "Pièces jointes des pistes",
    }),
    cache: kv(),
    queue: queue({ why: "Envoi des récapitulatifs" }),
    secrets: { HUBSPOT_KEY: { why: "Import ponctuel depuis HubSpot" } },
    userSecrets: {
      ODOO_API_KEY: { label: "Clé d'API Odoo", help: "…", why: "Lire vos tickets Odoo" },
    },
    connectors: {
      microsoft: connector("microsoft-365", {
        mode: "delegated",
        scopes: ["Mail.Send"],
        why: "Envoyer un e-mail à un contact",
      }),
    },
    network: { allow: ["api.hubspot.com"], why: "API HubSpot" },
  },

  uses: { contacts: "^2.0.0" },
  preview: { data: "seed" }, // "seed" (défaut) | "empty" | "snapshot"
});
```

| Clé                    | Type                                 | Défaut                                                       | Rôle                                                                 |
| ---------------------- | ------------------------------------ | ------------------------------------------------------------ | -------------------------------------------------------------------- |
| `name`                 | `string`                             | — (obligatoire)                                              | Identifiant du tool, utilisé dans les URL, MCP et le CLI             |
| `title`, `description` | `string`                             | —                                                            | Affichage et descriptions générées                                   |
| `interfaces`           | `{ mcp, api, cli, web }` booléens    | tous `true` sauf `web` (vrai seulement s'il existe des vues) | Interfaces exposées                                                  |
| `roles`                | `Record<string, { label?, grants }>` | `{}`                                                         | Rôles par défaut ; tout niveau cité dans `grants` existe             |
| `resources`            | objet, voir ci-dessous               | `{}`                                                         | Les ressources demandées à la plateforme                             |
| `uses`                 | `Record<tool, plage semver>`         | `{}`                                                         | Tools dont on appelle les actions (section 12)                       |
| `preview.data`         | `"seed" \| "empty" \| "snapshot"`    | `"seed"`                                                     | Données d'une base de preview ; `snapshot` exige l'accord de l'admin |

La version du tool n'est pas dans la config : elle vient de `package.json` et ne se modifie qu'avec `forgeron release` (section 16).

### Les ressources

`resources` est la **liste exhaustive** de ce que le tool demande. C'est le même principe que les permissions d'une application mobile : ce qui n'est pas déclaré n'existe pas à l'exécution (`ctx.db` est absent sans `resources.db`, `ctx.fetch` refuse tout hôte non listé).

| Ressource            | Déclaration                                  | Donne accès à              | Cloudflare                                                          |
| -------------------- | -------------------------------------------- | -------------------------- | ------------------------------------------------------------------- |
| Base de données      | `database({ engine: "d1" })`                 | `ctx.db`                   | D1, une base par tool et par environnement, branchée sur son Worker |
| Fichiers             | `bucket({ maxSize, types })`                 | `ctx.files`                | R2, un préfixe par tool et environnement                            |
| Cache                | `kv()`                                       | `ctx.cache`                | KV                                                                  |
| File d'attente       | `queue()`                                    | événements `mode: "queue"` | Queues                                                              |
| Secrets du tool      | `secrets: { NOM: { why } }`                  | `ctx.secrets`              | chiffrés par la plateforme                                          |
| Secrets par personne | `userSecrets: { NOM: { label, help, why } }` | `ctx.userSecrets`          | chiffrés, par personne                                              |
| Connecteurs          | `connector(type, { mode, scopes })`          | `ctx.connectors.<nom>`     | —                                                                   |
| Réseau sortant       | `network: { allow: [...] }`                  | `ctx.fetch`                | filtrage par la plateforme                                          |

Les tâches planifiées (`jobs/`) et les vues (`views/`) ne se déclarent pas : elles sont **déduites** des dossiers et ajoutées automatiquement à la liste des ressources.

Chaque ressource accepte un `why` : une phrase qui explique à l'admin pourquoi le tool en a besoin. Il est obligatoire pour les connecteurs, les secrets par personne et le réseau sortant.

#### Ce que voit l'admin à l'installation

`forgeron resources` affiche le récapitulatif en local ; la console et le MCP d'administration montrent le même écran avant l'installation :

```text
CRM v1.4.0 demande :
  Base de données (D1)            Sociétés, contacts et pistes
  Stockage de fichiers (25 Mo)    Pièces jointes des pistes
  Microsoft 365, au nom de chaque personne
    · Mail.Send                   Envoyer un e-mail à un contact
  Une clé d'API Odoo par personne Lire vos tickets Odoo
  Appels sortants : api.hubspot.com
  1 tâche planifiée : récapitulatif du lundi, 7 h
```

#### Quand une nouvelle version demande plus

`forgeron build` compare les ressources à celles de la version en production. Une ressource **ajoutée ou élargie** (nouveau connecteur, scope supplémentaire, nouvel hôte, nouveau secret par personne) met la version **en attente d'approbation** : elle se déploie en preview, mais pas en pilote ni en production tant qu'un admin n'a pas accepté la demande, dans la console ou le MCP d'administration. Une ressource retirée ne demande rien.

## 4. Le dossier `.forgeron`

```text
.forgeron/
├── project.json        # commité
├── .gitignore          # commité, contient : local/  generated/  build/
├── local/              # ignoré
│   ├── env             # secrets de dev (format dotenv)
│   └── dev.sqlite      # base locale de forgeron dev
├── generated/          # ignoré : types Kysely, types des actions, types des tools utilisés
└── build/              # ignoré : sortie de forgeron build
```

```json
// .forgeron/project.json
{
  "space": "acme",
  "tool": "crm",
  "endpoint": "https://acme.forgeron.app",
  "toolId": "tool_01J8ZK…"
}
```

- `project.json` ne contient **aucun secret** : il dit seulement à quel espace et à quel tool le dossier est lié. Il est écrit par `forgeron init` ou `forgeron link`.
- Les **identifiants de la personne** ne sont jamais dans le projet. `forgeron login` ouvre le navigateur (SSO de l'espace) et range le jeton dans le trousseau du système, ou à défaut dans `~/.config/forgeron/credentials` (droits 600).
- `local/env` sert uniquement à `forgeron dev` et aux tests. Les secrets de preview et de production se posent avec `forgeron secrets set`.
- En CI, l'authentification passe par `FORGERON_TOKEN` (jeton de déploiement créé dans la console).

## 5. Le CLI

Le CLI s'installe avec le SDK (`npm i -D forgeron`) et s'utilise avec `npx forgeron` ou un alias global.

### Cycle de vie

| Commande                                                                                   | Ce qu'elle fait                                                                                                                                                        |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `forgeron login` · `logout` · `whoami`                                                     | Authentification de la personne sur un espace (navigateur, SSO)                                                                                                        |
| `forgeron init [nom] [--template crm]`                                                     | Crée un tool, depuis zéro ou depuis un modèle du catalogue ; écrit `.forgeron/`                                                                                        |
| `forgeron link`                                                                            | Lie un dossier existant à un tool de l'espace                                                                                                                          |
| `forgeron dev [--as <rôle>] [--port 8787]`                                                 | Lance le tool en local sur le runtime Cloudflare : API, serveur MCP local (`/mcp`), vues, terrain de jeu ; recharge à chaud ; applique les migrations à la base locale |
| `forgeron play [--template <nom>]`                                                         | Ouvre le terrain de jeu : liste des actions, formulaire généré, résultat, aperçu MCP / API / CLI ; avec `--template`, essaie un modèle sans l'installer                |
| `forgeron test`                                                                            | Lance Vitest avec la configuration Forgeron (alias de `vitest`)                                                                                                        |
| `forgeron build`                                                                           | Construit le Worker, le manifeste, les vues et les migrations dans `.forgeron/build/`                                                                                  |
| `forgeron deploy [--env preview\|pilot\|production] [--group <nom>] [--allow-destructive]` | Construit, envoie une version, applique les migrations, bascule le trafic. Sans `--env` : preview de la branche courante                                               |
| `forgeron versions`                                                                        | Liste les versions et leurs environnements                                                                                                                             |
| `forgeron promote <version> --to <env>`                                                    | Promeut une version existante, sans rebuild                                                                                                                            |
| `forgeron rollback [--env production]`                                                     | Revient à la version précédente de l'environnement                                                                                                                     |
| `forgeron logs [--env] [--action <nom>] [--job <nom>] [--follow]`                          | Journal d'exécution                                                                                                                                                    |
| `forgeron jobs run <nom> [--env]`                                                          | Exécute une tâche planifiée à la demande                                                                                                                               |
| `forgeron resources [--diff production]`                                                   | Affiche les ressources demandées, ou ce qui change par rapport à un environnement                                                                                      |

### Versions et changelog

| Commande                                      | Ce qu'elle fait                                                                                                                     |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `forgeron change`                             | Ajoute un changement dans `changes/` : type, impact semver, description (interactif ou `--type fixed --bump patch -m "…"`)          |
| `forgeron change check`                       | Compare le manifeste à la dernière version publiée et vérifie que les changements déclarés couvrent ce qui a changé (utilisé en CI) |
| `forgeron release`                            | Calcule la nouvelle version, écrit `CHANGELOG.md`, met à jour `package.json`, vide `changes/`, crée le tag git                      |
| `forgeron changelog [<tool>] [--since 1.2.0]` | Affiche le changelog d'un tool, local ou publié                                                                                     |

### Administration

| Commande                                                            | Ce qu'elle fait                                                                                        |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `forgeron catalog search <texte>`                                   | Cherche dans le catalogue de modèles                                                                   |
| `forgeron install <modèle> [--name]`                                | Installe un modèle dans l'espace, après affichage et approbation des ressources                        |
| `forgeron tools`                                                    | Liste les tools de l'espace, leurs versions et environnements                                          |
| `forgeron access grant <tool> <rôle> <personne\|groupe>` · `revoke` | Gère les accès                                                                                         |
| `forgeron approve <tool> <version>`                                 | Approuve les nouvelles ressources demandées par une version                                            |
| `forgeron mcp`                                                      | Lance le MCP d'administration en local (stdio), pour un espace self-host ou un client sans MCP distant |

### Base de données

| Commande                                               | Ce qu'elle fait                                                            |
| ------------------------------------------------------ | -------------------------------------------------------------------------- |
| `forgeron db generate --name <nom> [--rename a.b:a.c]` | Compare `db/schema.ts` au dernier instantané et écrit la ou les migrations |
| `forgeron db migrate [--env]`                          | Applique les migrations en attente (local par défaut)                      |
| `forgeron db status [--env]`                           | Migrations appliquées et en attente                                        |
| `forgeron db rollback [--env] [--steps 1]`             | Exécute le `down` des dernières migrations                                 |
| `forgeron db seed`                                     | Exécute `db/seed.ts` sur la base locale                                    |
| `forgeron db shell [--env]`                            | Console SQL ; lecture seule hors local, sauf `--write` et rôle `admin`     |

### Secrets et accès

| Commande                                         | Ce qu'elle fait                                                                                     |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `forgeron secrets set <NOM> [--env] [--user]`    | Pose un secret du tool, ou le sien avec `--user` ; la valeur est lue au clavier, jamais en argument |
| `forgeron secrets list [--env]`                  | Noms des secrets posés, jamais les valeurs                                                          |
| `forgeron token create --name ci --scope deploy` | Crée un jeton de déploiement pour la CI                                                             |

### Les actions des tools, en commandes

Chaque action d'un tool exposé en CLI devient une commande :

```bash
forgeron <tool> <groupe> <verbe> [arguments] [--options]
forgeron crm contacts search "Durand" --limit 5
forgeron odoo tickets list --mine --json
forgeron inventaire equipments import ./parc.csv --no-dry-run
```

- Les **arguments positionnels** sont déclarés par `cli.args` ; les autres champs de l'entrée deviennent des options en kebab-case (`checkBefore` → `--check-before`), les booléens acceptent `--x` / `--no-x`.
- `--json` sort le résultat brut ; sinon le CLI l'affiche en tableau.
- `--env` choisit l'environnement (production par défaut).
- `forgeron <tool> --help` liste les actions avec leurs descriptions.
- Codes de sortie : `0` succès, `1` erreur de l'action, `2` entrée invalide, `3` accès refusé, `4` introuvable.

## 6. Les actions

```ts
import { action, z, ToolError } from "forgeron";

export default action({
  description: "Passe une piste à une nouvelle étape.",
  access: "write",
  input: z.object({ id: z.string(), stage: z.enum(["won", "lost"]) }),
  output: z.object({ id: z.string(), stage: z.string() }), // optionnel
  confirm: false,
  cli: { args: ["id", "stage"] },
  http: { method: "POST" },
  async run(ctx) {
    /* … */
  },
});
```

| Option        | Type                                     | Défaut                                  | Rôle                                                                                            |
| ------------- | ---------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `description` | `string`                                 | — (obligatoire)                         | Description pour Claude, OpenAPI, l'aide du CLI ; c'est elle qui fait choisir l'action à Claude |
| `access`      | niveau d'accès                           | — (obligatoire)                         | Niveau exigé de la personne ; aucune action sans                                                |
| `input`       | schéma Zod objet                         | — (obligatoire, `z.object({})` si rien) | Validation et typage de l'entrée ; source des schémas MCP, OpenAPI et options CLI               |
| `output`      | schéma Zod                               | inféré                                  | Valide la sortie ; publié dans MCP (`outputSchema`) et OpenAPI                                  |
| `confirm`     | `boolean`                                | `true` si `access: "delete"`            | Action destructive : annotation MCP, confirmation CLI, dialogue dans le terrain de jeu          |
| `cli.args`    | `string[]`                               | `[]`                                    | Champs passés en arguments positionnels                                                         |
| `http.method` | `"GET" \| "POST"`                        | `GET` si `access: "read"`, sinon `POST` | Méthode de la route d'API                                                                       |
| `interfaces`  | sous-ensemble de la config               | celles du tool                          | Masquer une action d'une interface                                                              |
| `rateLimit`   | `{ per: "user" \| "tool", max, window }` | aucun                                   | Limite d'appels                                                                                 |

### Le contexte `ctx`

| Membre                 | Disponible si           | Description                                                                |
| ---------------------- | ----------------------- | -------------------------------------------------------------------------- |
| `input`                | toujours                | Entrée validée et typée                                                    |
| `user`                 | toujours                | `{ id, email, name, roles }` de la personne (ou du tool dans une tâche)    |
| `can(level)`           | toujours                | Vérifie un niveau d'accès supplémentaire dans le code                      |
| `interface`            | toujours                | `"mcp" \| "api" \| "cli" \| "web" \| "job" \| "tool"` : d'où vient l'appel |
| `db`                   | `resources.db`          | `Kysely<DB>` typé ; transaction par action                                 |
| `emit(event, payload)` | toujours                | Émet un événement (section 9)                                              |
| `secrets`              | `resources.secrets`     | Secrets du tool, en lecture                                                |
| `userSecrets`          | `resources.userSecrets` | Secrets de la personne ; absents → collecte automatique                    |
| `connectors.<nom>`     | `resources.connectors`  | Clients des services tiers                                                 |
| `fetch`                | toujours                | `fetch` standard, filtré par `resources.network`                           |
| `files`                | `resources.files`       | Stockage R2 (section 10)                                                   |
| `cache`                | `resources.cache`       | Cache KV, portée `user` par défaut                                         |
| `tools.<nom>`          | `uses`                  | Appels d'actions d'autres tools                                            |
| `log`                  | toujours                | `log.info / warn / error(message, données)` vers le journal                |
| `now()`                | toujours                | Horloge au fuseau de l'espace, figée dans les tests                        |
| `env`                  | toujours                | `"local" \| "preview" \| "pilot" \| "production"`                          |

### Les erreurs

| Code `ToolError`         | HTTP | MCP                               | CLI (sortie) | Quand                                                         |
| ------------------------ | ---- | --------------------------------- | ------------ | ------------------------------------------------------------- |
| `INVALID`                | 400  | erreur d'outil                    | 2            | Entrée correcte en forme mais refusée par la règle métier     |
| `FORBIDDEN`              | 403  | erreur d'outil                    | 3            | Droits insuffisants (levé aussi automatiquement par `access`) |
| `NOT_FOUND`              | 404  | erreur d'outil                    | 4            | Objet absent                                                  |
| `CONFLICT`               | 409  | erreur d'outil                    | 1            | Doublon, version concurrente                                  |
| `RATE_LIMITED`           | 429  | erreur d'outil                    | 1            | Limite dépassée                                               |
| `UPSTREAM`               | 502  | erreur d'outil                    | 1            | Service tiers en erreur                                       |
| _(exception non prévue)_ | 500  | erreur d'outil, message générique | 1            | Le détail reste dans le journal, jamais renvoyé à l'appelant  |

## 7. Les quatre interfaces

|                   | MCP                                                   | API                                                   | CLI                                               | Web                                      |
| ----------------- | ----------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------- | ---------------------------------------- |
| Adresse           | `https://<espace>.forgeron.app/t/<tool>/mcp`          | `https://<espace>.forgeron.app/t/<tool>/api/<action>` | `forgeron <tool> …` (manifeste : `/t/<tool>/cli`) | `https://<espace>.forgeron.app/t/<tool>` |
| Nom d'une action  | `<tool>_<groupe>_<verbe>` (`crm_deals_move`)          | `/t/crm/api/deals.move`                               | `forgeron crm deals move`                         | `useAction("deals.move")`                |
| Authentification  | OAuth via le SSO de l'espace                          | jeton personnel ou session SSO                        | `forgeron login`                                  | session SSO                              |
| Schéma            | `inputSchema` / `outputSchema` JSON Schema depuis Zod | OpenAPI 3.1 sur `/t/<tool>/api/openapi.json`          | options générées, `--help`                        | types TypeScript générés                 |
| Destructif        | annotations `destructiveHint`, `readOnlyHint`         | —                                                     | confirmation interactive                          | dialogue de confirmation                 |
| Secrets manquants | élicitation, sinon lien                               | `428` avec lien de saisie                             | invite dans le terminal                           | page de saisie                           |

Toutes passent par la même **passerelle d'identité** : SSO, résolution des rôles, contrôle de `access`, journal. Aucune interface ne contourne une autre.

### Les adresses

Un sous-domaine par entreprise, puis des chemins. Tout tient sur **un seul niveau de sous-domaine**, couvert par le certificat gratuit de Cloudflare (Universal SSL) : aucun module payant n'est nécessaire.

```text
https://acme.forgeron.app/                       console de l'espace
https://acme.forgeron.app/mcp                    MCP d'administration (section 17)
https://acme.forgeron.app/t/crm                  interface web du tool (accueil, vues)
https://acme.forgeron.app/t/crm/pipeline         une vue (path: "/pipeline")
https://acme.forgeron.app/t/crm/mcp              serveur MCP du tool
https://acme.forgeron.app/t/crm/api/deals.move   une action en API
https://acme.forgeron.app/t/crm/api/openapi.json description OpenAPI
https://acme.forgeron.app/t/crm/cli              manifeste des commandes CLI
https://acme.forgeron.app/t/crm/play             terrain de jeu du tool
```

| Segment                                         | Règle                                                                                                                                                                        |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<espace>`                                      | `[a-z0-9-]`, 3 à 40 caractères. Réservés : `www`, `app`, `api`, `docs`, `status`, `console`, `mcp`, `admin`, `auth`, `cdn`, `static`, `play`.                                |
| `/t/<tool>`                                     | `name` du tool. `t` est le seul préfixe des tools ; les autres chemins de premier niveau (`/mcp`, `/settings`, `/auth`…) appartiennent à la plateforme.                      |
| `/t/<tool>/mcp`, `/api`, `/cli`, `/play`, `/_f` | Réservés par la plateforme. Une vue ne peut pas utiliser ces chemins ; le build le refuse.                                                                                   |
| `/t/<tool>@<branche>/…`                         | Une preview : même structure, sur la version de la branche (`/t/crm@feat-export/mcp`).                                                                                       |
| Pilote                                          | **Même adresse que la production.** La passerelle sert la version pilote aux personnes du groupe pilote, la production aux autres. Personne n'a à changer d'URL dans Claude. |

`/t/<tool>/cli` répond selon l'appelant. Le CLI y récupère, en JSON, le manifeste des commandes (actions, arguments, options), qu'il garde en cache et rafraîchit à chaque version ; l'exécution passe ensuite par `/t/<tool>/api`. Un navigateur y voit une page d'aide : installation, `forgeron login`, liste des commandes.

### Routage sur Cloudflare

- Un enregistrement DNS joker proxifié `*.forgeron.app` et une route `*.forgeron.app/*` envoient tout au Worker de répartition.
- Le répartiteur lit le sous-domaine (l'espace), puis le chemin (`/t/<tool>[@<branche>]/<interface>`), et transmet la requête au Worker du tool pour cet environnement : par un dispatch namespace (Workers for Platforms) dans le cloud Forgeron, par un service binding en self-host (`ARCHITECTURE.md`, « Modes d'hébergement »).
- Plus tard, un client pourra brancher son propre domaine (`outils.acme.fr`) via Cloudflare for SaaS, avec la même structure de chemins.

### L'isolation entre tools sur une même origine

Avec des chemins, tous les tools d'un espace partagent la même origine (`acme.forgeron.app`). Un cookie limité par `Path` n'est pas une frontière de sécurité : sans précaution, du JavaScript d'une vue du CRM pourrait appeler l'API de la passerelle Odoo avec la session de la personne. Forgeron isole donc explicitement :

1. **Aucun code de développeur ne s'exécute à l'origine de l'espace.** `/mcp`, `/api` et `/cli` ne renvoient que du JSON. La console et le terrain de jeu sont du code Forgeron.
2. **Les vues sont servies en bac à sable.** La réponse d'une vue porte `Content-Security-Policy: sandbox allow-scripts allow-forms allow-popups allow-downloads` : le navigateur lui donne une origine opaque. Elle ne peut ni lire les cookies de l'espace, ni lire une autre page de l'espace, ni appeler une API avec la session.
3. **Les vues appellent leur tool avec un jeton dédié.** Le runtime injecte dans la page un jeton court, limité au tool et à la personne (audience `acme/crm`). Les hooks de `forgeron/react` l'utilisent ; l'API de `/t/odoo` le refuse.
4. **La session de l'espace est un cookie `HttpOnly`, `Secure`, `SameSite=Lax`**, réservé à la console et à la passerelle d'identité.
5. **Les jetons MCP, API et CLI portent aussi une audience** (`acme/crm`) : un jeton obtenu pour un tool ne sert à rien sur un autre.

Si le bac à sable gêne certaines vues (stockage local, téléchargements, bibliothèques qui exigent une vraie origine), le repli est une origine dédiée aux vues, par exemple `acme.forgeron-views.app/t/crm`, toujours sur un seul niveau de sous-domaine.

## 8. Base de données et migrations

### Le schéma

`db/schema.ts` est la source de vérité. Il utilise les constructeurs de `forgeron/db` :

| Constructeur         | Colonne SQLite                   | Type TypeScript   |
| -------------------- | -------------------------------- | ----------------- |
| `t.id()`             | `TEXT PRIMARY KEY`, ULID généré  | `string`          |
| `t.text()`           | `TEXT`                           | `string`          |
| `t.integer()`        | `INTEGER`                        | `number`          |
| `t.real()`           | `REAL`                           | `number`          |
| `t.boolean()`        | `INTEGER` 0/1                    | `boolean`         |
| `t.date()`           | `TEXT` ISO `AAAA-MM-JJ`          | `string`          |
| `t.timestamp()`      | `TEXT` ISO 8601 UTC              | `string`          |
| `t.enum([...])`      | `TEXT` + `CHECK`                 | union des valeurs |
| `t.json(zodSchema?)` | `TEXT` JSON, validé à l'écriture | type du schéma    |
| `t.ref(table)`       | `TEXT REFERENCES`                | `string`          |

Modificateurs : `.notNull()`, `.unique()`, `.default(v)`, `.defaultNow()`, `.onUpdateNow()`, `.onDelete("cascade" | "set null" | "restrict")`. Index : `index(col)`, `index([a, b])`, `unique([a, b])`.

Les noms sont identiques dans le schéma, en base et dans les requêtes (`snake_case` recommandé). Les types `Kysely<DB>` sont générés dans `.forgeron/generated/db.d.ts` par `forgeron dev`, `build` et `db generate`.

### Les migrations

- Un fichier par migration, `db/migrations/NNNN_<nom>.ts`, qui exporte `migration({ up, down, destructive?, after? })`. `up` et `down` reçoivent un `Kysely<any>` : on écrit du Kysely ou du `sql` brut.
- `forgeron db generate` compare le schéma à `meta/snapshot.json` (l'état après la dernière migration), écrit la migration, puis met l'instantané à jour. Le fichier généré se relit et se modifie : on y ajoute les migrations de données.
- Les limites de SQLite (D1) sont gérées par le générateur : quand une modification n'est pas possible en `ALTER TABLE`, il écrit une reconstruction de table (créer, copier, renommer) dans une transaction.
- Le suivi se fait dans la table `_forgeron_migrations` (nom, empreinte du fichier, date). Une migration déjà appliquée dont le fichier change provoque une erreur.
- **Renommer ou supprimer** une colonne ou une table produit une migration `destructive: true`. Pour un renommage, le générateur propose deux migrations : `expand` (ajouter, recopier) puis `contract` (supprimer), à déployer séparément (`after`).

### À chaque déploiement

1. La version est construite ; les migrations en attente sont listées.
2. En **preview**, une base neuve est créée par branche, migrée puis remplie selon `preview.data` (`seed` par défaut).
3. En **pilote et production**, les migrations sont appliquées **avant** la bascule du trafic. Une migration `destructive` est refusée sans `--allow-destructive`.
4. Si une migration échoue, la transaction est annulée, le déploiement s'arrête, l'ancienne version continue de servir.
5. Pilote et production partagent la même base : une version pilote ne peut pas embarquer de migration incompatible avec la version de production en cours (vérifié au déploiement).

### Seed

`db/seed.ts` exporte `seed(async ({ db, faker? }) => { … })`. Il alimente la base locale (`forgeron db seed`), les tests (`createTestTool({ seed: true })`) et les previews.

## 9. Événements et tâches planifiées

```ts
// events/deal-history.ts
import { on } from "forgeron";
export default on("deal.moved", { mode: "sync" }, async ({ payload, db }) => {
  /* … */
});
```

- `mode: "sync"` (défaut) : exécuté dans la transaction de l'action ; une erreur annule l'action.
- `mode: "queue"` : exécuté après validation de l'action, via une file Cloudflare Queues, avec trois nouvelles tentatives.
- Les noms d'événements sont en `groupe.passé` (`deal.moved`, `contact.created`). Les payloads sont typés par `defineEvent("deal.moved", zodSchema)` dans `events/_types.ts`.

```ts
// jobs/sync.ts
import { schedule } from "forgeron";
export default schedule("0 2 * * *", { timezone: "Europe/Paris" }, async (ctx) => {
  /* … */
});
```

- Expression cron standard, fuseau explicite (défaut : celui de l'espace).
- Le contexte est celui du **tool** (`ctx.user.id = "tool:<nom>"`, `ctx.interface = "job"`), sans `userSecrets`.
- Exécution manuelle : `forgeron jobs run <nom> [--env]`.

## 10. Secrets, connecteurs, réseau, fichiers, cache

**Secrets**

- `resources.secrets` : posés par l'admin, par environnement, chiffrés. Lus avec `ctx.secrets.NOM`.
- `resources.userSecrets` : propres à chaque personne et à chaque tool. Collectés par la plateforme à la première utilisation (élicitation MCP, invite CLI, page web). Ni le développeur ni l'admin ne peuvent les lire ; l'admin peut les révoquer.

**Connecteurs**

```ts
resources: { connectors: {
  microsoft: connector("microsoft-365", { mode: "delegated", scopes: ["Mail.Send", "Calendars.Read"], why: "…" }),
} }
```

- `delegated` : agit au nom de la personne, avec son consentement OAuth géré par la plateforme.
- `application` : agit au nom du tool (tâches planifiées), consentement donné une fois par l'admin.
- `ctx.connectors.microsoft.graph` expose le client officiel quand il existe ; sinon un `fetch` déjà authentifié.
- Catalogue initial proposé : `microsoft-365`, `google-workspace`, `odoo`, `slack`, `github`.

**Réseau** : `ctx.fetch` n'atteint que les hôtes de `resources.network.allow` (et ceux des connecteurs). Tout autre appel lève `FORBIDDEN` et apparaît au journal.

**Fichiers** (`resources.files`) : `ctx.files.put(file, { prefix })`, `get(key)`, `text(file)`, `delete(key)`, `signedUrl(key, { expiresIn })`. Stockage R2, un espace de noms par tool et par environnement, jamais public.

**Cache** : `ctx.cache.get / set / getOrSet(key, { ttl, scope }, fn) / delete`. `scope: "user"` par défaut ; `"tool"` pour des données de référence identiques pour tous.

## 11. Les vues

```tsx
import { defineView, useAction, useMutation, useParams, useUser } from "forgeron/react";

export default defineView({
  title: "Pipeline",
  path: "/pipeline",
  access: "read",
  params: z.object({ owner: z.string().optional() }),
  component() {
    /* … */
  },
});
```

| API                                                       | Rôle                                                                        |
| --------------------------------------------------------- | --------------------------------------------------------------------------- |
| `defineView({ title, path, access, params?, component })` | Déclare une page ; `access` contrôlé avant tout rendu                       |
| `useAction(nom, input, { refresh? })`                     | Appelle une action de lecture ; `{ data, error, loading, refetch }`         |
| `useMutation(nom)`                                        | Action d'écriture ; `{ run, loading, error }` ; invalide les lectures liées |
| `useParams()`                                             | Paramètres d'URL validés par `params` ; `[valeurs, setValeurs]`             |
| `useUser()`                                               | La personne connectée et ses rôles                                          |
| `useCan(level)`                                           | Pour désactiver un bouton ; le serveur contrôle de toute façon              |

- Les vues sont des composants React 18+, construites par `forgeron build` et servies par le Worker du tool, derrière le SSO.
- `@forgeron/ui` fournit des composants alignés sur le design system Forgeron (noir et blanc, angles vifs) : `Page`, `Table`, `Board`, `Stat`, `BarChart`, `Select`, `Button`… Optionnel.
- Une vue n'a pas d'accès direct à la base : elle passe par les actions, donc par les droits.

## 12. Composition entre tools

```ts
// forgeron.config.ts
uses: {
  crm: "^1.4.0";
}

// dans une action
const deals = await ctx.tools.crm.call("deals.list", { owner });
```

- Les types des actions appelées sont générés depuis le manifeste publié du tool cible.
- L'appel s'exécute **avec l'identité de la personne** ; dans une tâche planifiée, avec celle du tool, qui doit avoir reçu un rôle dans le tool cible.
- Un déploiement est refusé si la version en production du tool cible ne satisfait pas la plage `uses`.
- Les vues peuvent appeler directement les actions d'un tool déclaré dans `uses` : `useAction("crm.deals.list", …)`.

## 13. Tests

Forgeron ne fournit pas de framework de test : on utilise **Vitest**. `forgeron/testing` ajoute un contexte.

```ts
import { createTestTool, mockFetch } from "forgeron/testing";

const tool = await createTestTool({
  seed: true,                                   // applique migrations + seed
  as: { email: "ely@acme.fr", roles: ["commercial"], userSecrets: { /* … */ } },
  secrets: { /* … */ },
  fetch: mockFetch({ "GET https://api.exemple.com/x": { ok: true } }),
  now: "2026-10-20T09:00:00+02:00",
  tools: { crm: { "deals.list": async () => [] } },   // doublures des tools utilisés
});

await tool.call("deals.move", { id, stage: "won" });  // passe par access, validation, événements
tool.db;                                              // Kysely sur la base de test
tool.events;                                          // événements émis
tool.as({ roles: ["support"] }).call(…);              // autre identité
```

- La base est une D1 en mémoire sur le runtime local de Cloudflare, migrée à chaque `createTestTool`.
- `forgeron test` lance Vitest avec cette configuration ; la CI exécute `forgeron test` avant tout déploiement.

## 14. Build

`forgeron build` est propre à Forgeron ; il s'appuie en interne sur un bundler existant, sans que le développeur le configure.

Sortie dans `.forgeron/build/` :

| Fichier                    | Contenu                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `worker.js`                | Le Worker du tool : actions, événements, tâches, routage des quatre interfaces                                     |
| `manifest.json`            | Nom, version, actions (noms, descriptions, schémas JSON, accès, options CLI), vues, rôles, ressources, dépendances |
| `changelog.json`           | Les entrées de changelog de cette version, structurées                                                             |
| `migrations/`              | Les migrations compilées, avec leurs empreintes                                                                    |
| `views/`                   | Les vues, en fichiers statiques                                                                                    |
| `openapi.json`, `mcp.json` | Descriptions générées, publiées avec la version                                                                    |

Le build échoue si : une action n'a pas `access` ou `description`, un nom d'action est en double, le schéma diffère du dernier instantané sans migration, un import sort du tool (sauf paquets npm), une vue cite une action inexistante, ou un code utilise une ressource non déclarée (`ctx.db` sans `resources.db`).

Le déploiement en pilote ou en production échoue en plus si la version n'a pas d'entrée de changelog, si l'impact déclaré est inférieur à l'impact détecté (section 16), ou si de nouvelles ressources attendent une approbation.

## 15. Versions, environnements, déploiement

| Environnement | Créé par                                                          | Base                                 | Qui y accède                                  |
| ------------- | ----------------------------------------------------------------- | ------------------------------------ | --------------------------------------------- |
| `local`       | `forgeron dev`                                                    | `.forgeron/local/dev.sqlite`         | le développeur                                |
| `preview`     | chaque push sur une branche, ou `forgeron deploy`                 | une base par branche, `preview.data` | les rôles `admin` et les développeurs du tool |
| `pilot`       | `forgeron deploy --env pilot --group <groupe>` ou la console      | celle de production                  | un groupe de personnes choisi                 |
| `production`  | promotion depuis la console ou `forgeron deploy --env production` | celle de production                  | les rôles du tool                             |

- **Version** : voir section 16. Un build se promeut d'un environnement à l'autre sans être reconstruit.
- **Retour arrière** : `forgeron rollback` remet la version précédente sur le trafic. Les migrations ne sont pas annulées automatiquement ; `forgeron db rollback` le fait explicitement.
- **Journal** : chaque déploiement, promotion et retour arrière est tracé (qui, quand, quelle version).

### Publier depuis GitHub

Le build se fait **dans la CI du dépôt du tool**, pas sur la plateforme : Forgeron n'héberge pas de machines de build, et le même chemin sert en local, en CI et en self-host.

```yaml
# .github/workflows/forgeron.yml, dans le dépôt du tool (généré par forgeron init)
on:
  push:
  pull_request:
jobs:
  forgeron:
    runs-on: ubuntu-latest
    permissions: { contents: read, id-token: write }
    steps:
      - uses: actions/checkout@v4
      - uses: forgeron/deploy-action@v1 # nom à confirmer
```

L'action exécute, pour chaque tool du dépôt (section 2) :

1. `forgeron test` ;
2. `forgeron change check` ;
3. `forgeron deploy` : build, envoi à la gateway, migrations, preview de la branche. Sur la branche par défaut, l'espace choisit si le build part en pilote, en production, ou reste en attente de promotion.

L'authentification passe par `FORGERON_TOKEN` (jeton de déploiement, section 4). À étudier : l'OIDC de GitHub Actions, pour qu'aucun secret ne soit stocké dans le dépôt.

L'**application GitHub Forgeron** vient plus tard. Elle n'ajoute pas de build côté plateforme : elle installe l'action dans le dépôt, lie les tools découverts à l'espace et affiche l'état des déploiements dans les pull requests.

## 16. Versioning et changelog

Chaque tool a une version **semver** et un **changelog** obligatoires. Forgeron ne fait pas confiance à la déclaration seule : il compare le manifeste de la nouvelle version à celui de la dernière version publiée et vérifie que l'impact annoncé est au moins celui qu'il détecte.

### Build, version, release

Trois mots, trois choses, pour que « chaque push crée une version » et « la version ne change qu'avec `forgeron release` » ne se contredisent pas :

|                    | Créé par                              | Identifiant                                                                                                                         | Change quand         |
| ------------------ | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| Build              | chaque push, ou `forgeron deploy`     | le commit (`a41f9e0`)                                                                                                               | à chaque commit      |
| Version            | `forgeron release`                    | semver (`1.5.0`)                                                                                                                    | à chaque release     |
| Ce qui est déployé | `forgeron deploy`, `forgeron promote` | `v1.5.0+a41f9e0` en pilote et production, `1.6.0-preview.<branche>.<n>` en preview (la version que produirait la prochaine release) | à chaque déploiement |

Un push sans release produit donc un nouveau build de la version en cours (`v1.5.0+b72c1d4`) : il se déploie en preview, mais pas en pilote ni en production si le manifeste a changé sans entrée dans `changes/` (voir plus bas).

### Où vit la version

- La version est dans `package.json` (`"version": "1.4.0"`), et seulement là. Elle ne change qu'avec `forgeron release`.
- Une version publiée s'identifie par `v1.4.0+a41f9e0` (version + commit court). Une preview porte `1.5.0-preview.<branche>.<n>`.
- `CHANGELOG.md`, à la racine du tool, est **généré** : on ne l'édite pas à la main.

### Le dossier `changes/`

Chaque changement notable ajoute un petit fichier, comme le font les Changesets dans l'écosystème JavaScript :

```bash
forgeron change
# ? Type : added | changed | fixed | removed | security   → added
# ? Impact : patch | minor | major                        → minor
# ? Description : Export CSV des pistes (deals.export)
```

```markdown
<!-- changes/2026-10-20-export-csv.md -->

---

type: added
bump: minor
---

Nouvelle action `deals.export` : export CSV des pistes filtrées.
```

Un fichier par changement plutôt qu'un fichier unique : deux branches ne se marchent jamais dessus, et chaque pull request porte sa propre entrée.

### Ce que Forgeron détecte

`forgeron change check` (en CI) et `forgeron build` comparent les manifestes :

| Changement détecté                                                                   | Impact minimal |
| ------------------------------------------------------------------------------------ | -------------- |
| Action supprimée ou renommée                                                         | `major`        |
| Champ d'entrée obligatoire ajouté, type d'un champ restreint, champ de sortie retiré | `major`        |
| Niveau d'accès d'une action relevé                                                   | `major`        |
| Vue supprimée ou changement de `path`                                                | `major`        |
| Migration `destructive`                                                              | `major`        |
| Action ajoutée, champ d'entrée optionnel ajouté, champ de sortie ajouté              | `minor`        |
| Nouvelle vue, nouvelle tâche, nouvelle ressource                                     | `minor`        |
| Description modifiée, code interne, migration non destructive                        | `patch`        |

Si `changes/` est vide alors que le manifeste a changé, ou si l'impact déclaré est inférieur à l'impact détecté, le déploiement en pilote et en production est refusé. Les previews ne sont pas bloquées.

Pour les autres tools, l'impact compte : un tool qui déclare `uses: { crm: "^1.4.0" }` ne reçoit jamais automatiquement une version `2.0.0` du CRM.

### `forgeron release`

1. Lit `changes/`, calcule la nouvelle version (l'impact le plus fort l'emporte).
2. Écrit l'entrée dans `CHANGELOG.md`, avec une partie rédigée (les fichiers de `changes/`) et une partie technique générée.
3. Met à jour `package.json`, vide `changes/`, crée le commit et le tag `crm@1.5.0`.

```markdown
## 1.5.0 — 2026-10-20

### Ajouts

- Nouvelle action `deals.export` : export CSV des pistes filtrées.

### Corrections

- `contacts.search` ignore désormais les accents.

### Technique

- Actions ajoutées : `deals.export`
- Migrations : `0003_deals_export_index`
- Ressources : aucune nouvelle
```

### Où on lit le changelog

- **Console** : la page d'un tool montre la version de chaque environnement et « ce qu'elle contient » par rapport à la précédente.
- **MCP d'administration** : `tool_changelog` (« Qu'est-ce qui a changé dans le CRM depuis la 1.3 ? »).
- **CLI** : `forgeron changelog crm --since 1.3.0`.
- **Build** : `changelog.json` est publié avec chaque version, pour que la console, le MCP et les tools dépendants le lisent sans parser du Markdown.

## 17. Le MCP d'administration

En plus du serveur MCP de chaque tool, l'espace expose **un serveur MCP Forgeron** pour l'administration. On l'ajoute une fois dans Claude et on gère tout l'espace en conversation : chercher un modèle, l'installer, regarder ses versions, donner des accès, voir qui utilise quoi.

|                    | MCP d'un tool                         | MCP Forgeron                           |
| ------------------ | ------------------------------------- | -------------------------------------- |
| Adresse            | `https://acme.forgeron.app/t/crm/mcp` | `https://acme.forgeron.app/mcp`        |
| Sert à             | Utiliser le tool (ses actions)        | Administrer l'espace et ses tools      |
| Pour qui           | Les utilisateurs du tool              | Les développeurs et admins de l'espace |
| Self-host ou local | —                                     | `forgeron mcp` (stdio)                 |

### Les outils exposés

| Outil MCP                        | Ce qu'il fait                                                                               | Rôle minimal dans l'espace | Destructif |
| -------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------- | ---------- |
| `catalog_search`                 | Cherche un modèle dans le catalogue                                                         | membre                     |            |
| `catalog_get`                    | Détail d'un modèle : actions, ressources demandées, changelog                               | membre                     |            |
| `tools_list`                     | Les tools de l'espace, leurs versions par environnement                                     | membre                     |            |
| `tool_get`                       | Détail d'un tool : interfaces, adresse MCP à ajouter dans Claude, ressources, propriétaires | membre                     |            |
| `tool_changelog`                 | Changelog d'un tool, éventuellement depuis une version                                      | membre                     |            |
| `tool_versions`                  | Versions et environnements, déploiements récents                                            | développeur                |            |
| `tool_install_plan`              | Prépare l'installation d'un modèle : nom, ressources demandées, coût estimé si connu        | admin                      |            |
| `tool_install`                   | Installe le plan préparé (identifiant du plan exigé)                                        | admin                      | oui        |
| `tool_promote`                   | Promeut une version en pilote ou en production                                              | admin                      | oui        |
| `tool_rollback`                  | Revient à la version précédente d'un environnement                                          | admin                      | oui        |
| `resources_pending`              | Les versions qui attendent une approbation de ressources                                    | admin                      |            |
| `resources_approve`              | Approuve les nouvelles ressources d'une version                                             | admin                      | oui        |
| `access_list`                    | Qui a quel rôle sur un tool                                                                 | admin                      |            |
| `access_grant` · `access_revoke` | Donne ou retire un rôle à une personne ou un groupe                                         | admin                      | oui        |
| `usage_report`                   | Qui utilise quel tool, par interface, sur une période                                       | admin                      |            |
| `logs_search`                    | Cherche dans le journal (appels, erreurs, déploiements)                                     | développeur                |            |
| `secrets_status`                 | Les secrets posés ou manquants d'un tool, **jamais leurs valeurs**                          | développeur                |            |
| `secret_request`                 | Envoie à un admin un lien pour saisir un secret                                             | développeur                |            |

### Les garde-fous

- **Les valeurs secrètes ne passent jamais par Claude.** Aucun outil ne lit ni n'écrit une valeur de secret ; `secret_request` produit un lien vers une page de saisie de la plateforme.
- **Installer se fait en deux temps.** `tool_install_plan` renvoie le plan et les ressources demandées ; `tool_install` n'accepte que l'identifiant de ce plan. Une instruction glissée dans un document ne peut pas installer un tool d'une seule traite.
- **Les outils destructifs** portent l'annotation MCP `destructiveHint` et exigent une confirmation.
- **Pas d'élévation.** Le MCP agit avec les droits de la personne connectée : il ne peut pas donner un rôle plus élevé que le sien, ni approuver ce qu'elle ne pourrait pas approuver dans la console.
- **Tout est journalisé**, avec la mention « via MCP Forgeron ».

### Exemple

> « Installe-nous un CRM et donne l'accès aux commerciaux. »
>
> Claude appelle `catalog_search("crm")`, puis `tool_install_plan` : le modèle CRM demande une base de données, un stockage de fichiers et l'envoi d'e-mails Microsoft 365. Claude montre ce récapitulatif et demande confirmation. Après accord, `tool_install` crée le tool, puis `access_grant("crm", "commercial", "groupe:Commerciaux")`. Claude termine en donnant l'adresse MCP du CRM à ajouter.

## 18. Les paquets npm

Forgeron utilise **les deux** : le nom `forgeron` pour le point d'entrée unique, et l'organisation `@forgeron` pour tout ce qui est optionnel, lourd ou versionné à son propre rythme.

### La règle

- **Sous-chemin de `forgeron`** (`forgeron/db`) quand le module doit avoir **exactement la même version** que le runtime et le CLI, et n'ajoute pas de dépendance lourde. Un développeur installe un paquet, une version, et tout est cohérent.
- **Paquet `@forgeron/…`** quand le module est **optionnel**, apporte des dépendances lourdes ou des peer dependencies (React), ou évolue à un autre rythme que le SDK.

### La répartition

| Paquet                                                          | Contenu                                                                                        | Pourquoi là                                                                                 |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `forgeron`                                                      | SDK (`defineConfig`, `action`, `on`, `schedule`, `z`, `ToolError`) et CLI (binaire `forgeron`) | Un seul `npm i -D forgeron`, un seul `npx forgeron`                                         |
| `forgeron/db`                                                   | `schema`, `table`, `t`, `index`, `migration`, `sql`                                            | Lié au format des migrations et au runtime                                                  |
| `forgeron/react`                                                | `defineView`, `useAction`, `useMutation`, `useParams`, `useUser`, `useCan`                     | Parle le protocole du runtime ; React en peer dependency optionnelle                        |
| `forgeron/testing`                                              | `createTestTool`, `mockFetch`                                                                  | Doit simuler le runtime de la même version                                                  |
| `@forgeron/ui`                                                  | Composants React du design system (`Page`, `Table`, `Board`, `BarChart`…)                      | Optionnel, lourd, versionné avec le design system ; utilisé aussi par le site et la console |
| `@forgeron/connector-<nom>`                                     | Connecteurs : `microsoft-365`, `google-workspace`, `odoo`, `slack`…                            | Chaque connecteur embarque un client tiers ; on n'installe que ceux qu'on utilise           |
| `@forgeron/template-<nom>`                                      | Modèles du catalogue (`crm`, `contacts`, `inventaire`, `odoo-gateway`)                         | Versionnés et publiés comme des paquets ; `forgeron init --template crm` les télécharge     |
| `@forgeron/platform`                                            | La plateforme self-host : console, passerelle d'identité, MCP d'administration                 | Ne concerne que ceux qui hébergent Forgeron eux-mêmes                                       |
| `@forgeron/runtime`, `@forgeron/compiler`, `@forgeron/manifest` | Implémentation interne, dépendances de `forgeron`                                              | Découpage du code ; jamais importés directement par un tool                                 |
| `@forgeron/tsconfig`                                            | Configuration TypeScript partagée                                                              | Petit, optionnel                                                                            |

### `forgeron/ui` ou `@forgeron/ui` ?

`@forgeron/ui`. Trois raisons :

1. Un tool sans vue (la passerelle Odoo) ne doit pas télécharger React et une bibliothèque de composants.
2. Les composants suivent le design system, pas le runtime : une correction visuelle ne doit pas forcer une nouvelle version du SDK.
3. Le site vitrine et la console utilisent les mêmes composants sans dépendre du SDK.

À l'inverse, `forgeron/react` reste un sous-chemin : ses hooks parlent le protocole du runtime et doivent avoir la même version que lui.

### À réserver

- `forgeron` et l'organisation `@forgeron` (acquis).
- `create-forgeron`, si l'on veut `npm create forgeron` en plus de `npx forgeron init`.
- Les noms vides de l'organisation qui pourraient prêter à confusion : `@forgeron/sdk`, `@forgeron/cli`, `@forgeron/core`, publiés comme paquets vides qui renvoient vers `forgeron`.

## 19. Ce que Forgeron réutilise

| Besoin                 | Outil réutilisé                                                                    | Ce que Forgeron ajoute                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Exécution              | Cloudflare Workers ; Workers for Platforms (cloud), Workers classiques (self-host) | Un Worker par tool et par version, le routage, la passerelle d'identité                      |
| Base                   | Cloudflare D1                                                                      | Une base par tool et par environnement                                                       |
| Requêtes               | Kysely                                                                             | Les types générés depuis le schéma                                                           |
| Migrations             | Kysely (schema builder)                                                            | Le schéma, le générateur, le suivi, l'application au déploiement, la règle expand / contract |
| Schémas                | Zod                                                                                | La conversion vers JSON Schema, OpenAPI et les options CLI                                   |
| Fichiers, cache, files | R2, KV, Queues                                                                     | Les espaces de noms par tool et environnement, les portées                                   |
| Tests                  | Vitest                                                                             | `forgeron/testing`                                                                           |
| Dev local              | runtime local de Cloudflare (workerd, Miniflare)                                   | `forgeron dev`, le terrain de jeu                                                            |
| Vues                   | React                                                                              | Les hooks, `@forgeron/ui`, le service derrière le SSO                                        |
| Protocole IA           | MCP                                                                                | Le serveur MCP généré, l'OAuth, l'élicitation des secrets                                    |

## 20. Questions ouvertes

- Exécution : décidée (`DECISIONS.md`, D-009 et D-010). Un tool est un Worker ordinaire avec sa propre base D1 par environnement, en cloud (Workers for Platforms) comme en self-host (Workers classiques).
- Transaction par action (§6, §9) : D1 ne semble proposer que des lots atomiques, sans transaction interactive (à vérifier). Faut-il remplacer la promesse par `ctx.db.batch()` ?
- D1 suffit-il pour tous les tools, ou faut-il une option Postgres (Hyperdrive) dès le départ ?
- Les vues : rendu côté client seulement, ou rendu serveur ?
- Le bac à sable CSP (`sandbox`) convient-il aux vues React et à `@forgeron/ui` ? Sinon, passer à une origine dédiée aux vues.
- Faut-il autoriser plus de deux niveaux dans les noms d'actions (`crm.deals.notes.add`) ?
- Pilote et production partagent la base : faut-il imposer une compatibilité stricte des schémas, ou proposer une base séparée pour le pilote ?
- Faut-il un rôle « propriétaire du tool » distinct des rôles d'espace, pour qu'un développeur administre son tool sans être admin de l'espace ?
- Le changelog doit-il être visible des utilisateurs finaux (par exemple « nouveautés » dans Claude ou dans les vues), ou seulement des admins ?
