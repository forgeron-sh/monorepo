# Forgeron SDK specification

> Status: working proposal (v0), derived from the examples in `examples/`. Every API, command and file name is to be validated.

This document describes how to write, test, build and deploy an internal tool with Forgeron. It sets a **single shape**: a developer who opens any Forgeron tool knows where to find everything.

## Contents

1. [Concepts](#1-concepts)
2. [Structure of a tool](#2-structure-of-a-tool)
3. [`forgeron.config.ts`](#3-forgeronconfigts)
4. [The `.forgeron` folder](#4-the-forgeron-folder)
5. [The CLI](#5-the-cli)
6. [Actions](#6-actions)
7. [The four interfaces](#7-the-four-interfaces)
8. [Database and migrations](#8-database-and-migrations)
9. [Events and scheduled tasks](#9-events-and-scheduled-tasks)
10. [Secrets, connectors, network, files, cache](#10-secrets-connectors-network-files-cache)
11. [Views](#11-views)
12. [Composition between tools](#12-composition-between-tools)
13. [Tests](#13-tests)
14. [Build](#14-build)
15. [Versions, environments, deployment](#15-versions-environments-deployment)
16. [Versioning and changelog](#16-versioning-and-changelog)
17. [The admin MCP](#17-the-admin-mcp)
18. [The npm packages](#18-the-npm-packages)
19. [What Forgeron reuses](#19-what-forgeron-reuses)
20. [Open questions](#20-open-questions)

---

## 1. Concepts

| Concept          | Definition                                                                                                                                                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Workspace**    | The company on Forgeron: its members, its SSO, its tools, its secrets. One base URL (`acme.forgeron.app`).                                                                                                                   |
| **Tool**         | A folder, a repository or a monorepo subfolder that declares data, actions and optionally views.                                                                                                                             |
| **Action**       | A named, typed operation with an access level. The unit exposed through MCP, API, CLI and Web.                                                                                                                               |
| **View**         | A React page served by the tool, which consumes its actions.                                                                                                                                                                 |
| **Access level** | What an action requires: `read`, `write`, `delete`, `admin`, or a level specific to the tool (`import`).                                                                                                                     |
| **Team**         | A named group of members of the workspace (`admin`, `developer`, or one an admin creates, like `support`). A person is in any number of teams, and everyone is also part of **Everyone**. A tool never declares one (D-137). |
| **Permission**   | An access level a tool's actions or views require (`read`, `write`…): what the tool declares. A _platform permission_ is another thing: a right on Forgeron itself (see Permissions, below).                                 |
| **Profile**      | A named set of a tool's permissions that the tool suggests (`user` = `read`). One is the default. Declared in the config.                                                                                                    |
| **Grant**        | Per tool, what Everyone and each team are given: a profile, custom permissions, all, or nothing. Set by an admin in the tool's Access tab.                                                                                   |
| **Build**        | The immutable result of `forgeron build` for a given commit. Every push produces a build, identified by its commit.                                                                                                          |
| **Version**      | The semver number of a tool (`1.5.0`). It only changes with `forgeron release`; a build carries the current version plus its commit (`v1.5.0+a41f9e0`).                                                                      |
| **Release**      | The move to a new version: `forgeron release` reads `changes/`, writes the changelog and creates the `<tool>@<version>` tag.                                                                                                 |
| **Environment**  | Where a version runs: `preview` (per branch), `production`.                                                                                                                                                                  |

## 2. Structure of a tool

```text
my-tool/
├── forgeron.config.ts     # required
├── actions/               # required, at least one action
│   └── <group>/<verb>.ts
├── db/                    # if resources.db
│   ├── schema.ts
│   ├── seed.ts            # optional: dev and preview data
│   └── migrations/
│       ├── 0001_<name>.ts
│       └── meta/snapshot.json
├── events/                # optional: event handlers
├── jobs/                  # optional: scheduled tasks
├── views/                 # optional: React pages
├── lib/                   # optional: shared code, never exposed
├── tests/                 # Vitest
├── changes/               # required: changes awaiting release (section 16)
├── CHANGELOG.md           # required, generated by forgeron release
├── .forgeron/             # see section 4
└── package.json           # carries the tool's version
```

Rules:

- The **name of an action** is its path under `actions/`, without extension, with dots: `actions/deals/move.ts` → `deals.move`. Maximum depth: two levels (`group.verb`). Recommended verbs: `list`, `get`, `search`, `create`, `update`, `upsert`, `delete`, `move`, `import`.
- A file under `actions/`, `events/`, `jobs/` or `views/` exports **a single** default object (`action`, `on`, `schedule`, `defineView`).
- Anything outside these folders is never exposed.
- **One tool = one `forgeron.config.ts`.** In a repository that contains several tools, every folder that carries a `forgeron.config.ts` is a tool, at any depth (excluding `node_modules`). The CLI, the GitHub action and the console discover them this way, with no other declaration. Two tools in the same repository cannot have the same `name`.

## 3. `forgeron.config.ts`

```ts
import { defineConfig, database, bucket, kv, queue, connector } from "forgeron";

export default defineConfig({
  name: "crm", // identifier, [a-z0-9-], unique within the workspace
  title: "CRM",
  description: "Companies, contacts and leads.", // reused in MCP, OpenAPI, CLI help and the catalog
  summary: "Your companies and leads, from Claude.", // optional: one sentence for the people who use it, no technical term
  icon: "docs/icon.svg", // optional, shown in the catalog
  interfaces: { mcp: true, api: true, cli: true, web: true },

  // Profiles: what the tool suggests. An admin gives them to Everyone and to teams (D-137).
  profiles: {
    commercial: { label: "Sales", grants: ["read", "write"], default: true },
    direction: { label: "Management", grants: ["read", "write", "delete"] },
  },

  // Everything the tool asks of the platform. Nothing else is available at runtime.
  resources: {
    db: database({ engine: "d1", why: "Companies, contacts and leads" }),
    files: bucket({
      maxSize: "25MB",
      types: ["application/pdf", "image/*"],
      why: "Lead attachments",
    }),
    cache: kv(),
    queue: queue({ why: "Sending summaries" }),
    secrets: { HUBSPOT_KEY: { why: "One-off import from HubSpot" } },
    userSecrets: {
      ODOO_API_KEY: { label: "Odoo API key", help: "…", why: "Read your Odoo tickets" },
    },
    connectors: {
      microsoft: connector("microsoft-365", {
        mode: "delegated",
        scopes: ["Mail.Send"],
        why: "Send an email to a contact",
      }),
    },
    network: { allow: ["api.hubspot.com"], why: "HubSpot API" },
  },

  uses: { contacts: "^2.0.0" },
  preview: { data: "seed" }, // "seed" (default) | "empty" | "snapshot"
});
```

| Key                    | Type                                           | Default                                            | Meaning                                                                        |
| ---------------------- | ---------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------ |
| `name`                 | `string`                                       | — (required)                                       | Tool identifier, used in URLs, MCP and the CLI                                 |
| `title`, `description` | `string`                                       | —                                                  | Display and generated descriptions                                             |
| `icon`                 | `string` (path)                                | —                                                  | A small `.svg` or `.png` of the tool folder, shown in the catalog (section 14) |
| `interfaces`           | `{ mcp, api, cli, web }` booleans              | all `true` except `web` (true only if views exist) | Exposed interfaces                                                             |
| `profiles`             | `Record<string, { label?, grants, default? }>` | `{}`                                               | The profiles the tool suggests (D-127); at most one `default: true`            |
| `resources`            | object, see below                              | `{}`                                               | The resources requested from the platform                                      |
| `setup`                | `{ fields, check? }`, section 10               | none                                               | What each person gives before using the tool (D-096)                           |
| `uses`                 | `Record<tool, semver range>`                   | `{}`                                               | Tools whose actions are called (section 12)                                    |
| `preview.data`         | `"seed" \| "empty" \| "snapshot"`              | `"seed"`                                           | Data of a preview database; `snapshot` requires the admin's agreement          |

The tool's version is not in the config: it comes from `package.json` and only changes with `forgeron release` (section 16).

### Access: permissions, profiles, teams and Everyone (D-127, D-137)

- **The tool declares permissions.** Each action and view requires one (`access: "read"`). The permissions of a tool are those its actions and views require, and those its profiles name.
- **The tool suggests profiles.** A profile is a named set of permissions (`user` = `read`, `manager` = `read` + `write`). One is the default: the one marked `default: true`, else the one with the fewest permissions (the first declared on a tie). `defineConfig` refuses two defaults. The key is `profiles`: a config that still says `roles` is refused with the new name.
- **The workspace owns its teams.** A person is in any number of teams, and everyone is part of **Everyone**. A tool never creates or names a team: a team named like a profile gives nothing by itself.
- **The admin gives the tool to Everyone and to teams.** Per tool, **Everyone** and each team is given a profile, a custom set of permissions, all of them, or nothing. A tool arrives (its first deployment, or its first version on a channel) with a written default: the `admin` team gets all the permissions, Everyone the default profile. The admin changes it in the tool's Access tab, or with `access_grant` and `access_revoke` (section 17).
- **The check at call time** is the same on every interface: the person's subjects (Everyone and their teams), each given permissions of the tool, against the permission the action requires. A person holds the union of what their subjects are given. An admin can also set exceptions per action and subject (the matrix, D-039): an exception wins over the grant. The gateway sends the result with the person (`x-forgeron-user`: `subjects`, `permissions` per subject, and `access` resolved for every action), so a tool built before D-137 applies it too, with no new version.
- **Who may add the tool** to their library (availability, D-117) and who may use a channel (D-125) are other rules, unchanged. Their "some teams" are workspace teams.

### Permissions on Forgeron (D-137)

Using a tool is one thing; administering the workspace is another. The platform has its own **atomic permissions**. A team is given some of them, and a person holds the union of their teams'. Every platform route, the admin MCP's tools and the console's navigation read them. A write implies its read.

| Permission          | What it opens                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `tools:read`        | See tools: every tool, its channels, releases, logs and database schema                                                  |
| `tools:write`       | Build tools: create a tool, link or create from a GitHub repository, deploy drafts, change channels and settings         |
| `tools:publish`     | Publish tools: publish a channel's version to the people who use it, or roll it back                                     |
| `tools:approve`     | Approve what tools ask for: secrets, connectors, network and directory, and revoke them                                  |
| `tools:data`        | Query tool data: run queries on a tool's database, copy data between its channels                                        |
| `tools:secrets`     | Set tool secrets: set and reseal the secrets a tool runs with                                                            |
| `tools:delete`      | Delete tools: a tool for good, with its channels, data and access                                                        |
| `access:read`       | See access: who may use each tool, and with which profile                                                                |
| `access:write`      | Give access: change which teams may use a tool, with which profile, and its exceptions                                   |
| `members:read`      | See members: the members, the pending invitations and who joins by domain                                                |
| `members:write`     | Manage members: invite and remove members, set who joins by domain, revoke connections                                   |
| `teams:write`       | Manage teams: create, rename and delete teams, change who is in them and what they may do                                |
| `marketplace:read`  | See marketplaces: browse the workspace's marketplaces and their tools                                                    |
| `marketplace:write` | Manage marketplaces: add, sync and remove marketplaces, and install their tools                                          |
| `settings:read`     | See settings: general, sign-in, domains, GitHub                                                                          |
| `settings:write`    | Change settings: sign-in and its provider, domains, GitHub, connector clients                                            |
| `audit:read`        | Read the audit log: every change made on the workspace, and by whom                                                      |
| `usage:read`        | See usage: the workspace's usage and seats                                                                               |
| `platform:update`   | Update Forgeron: update this platform to a newer release, with a restore point of its database (implies `settings:read`) |

Two teams are built into every workspace and cannot be deleted. **Admins** (`admin`) holds every permission, now and to come (`*`): it is locked, and it is never left empty. **Developers** (`developer`) builds, deploys and publishes tools (`tools:write`, `tools:publish`, `tools:data`, `access:read`, `marketplace:read`); its permissions can be edited. An admin creates any other team and chooses what it holds.

**Nobody gives what they do not hold.** Changing a team's permissions or members needs `teams:write` _and_ every permission the team has, before and after the change. So only someone who holds everything changes the admin team, and a person who manages teams cannot make themselves an admin. The refusal names the permissions that are missing.

### Resources

`resources` is the **exhaustive list** of what the tool requests. The principle is the same as the permissions of a mobile application: what is not declared does not exist at runtime (`ctx.db` is absent without `resources.db`, `ctx.fetch` refuses any host that is not listed).

| Resource           | Declaration                                   | Gives access to         | Cloudflare                                                     |
| ------------------ | --------------------------------------------- | ----------------------- | -------------------------------------------------------------- |
| Database           | `database({ engine: "d1" })`                  | `ctx.db`                | D1, one database per tool and environment, bound to its Worker |
| Files              | `bucket({ maxSize, types })`                  | `ctx.files`             | R2, one prefix per tool and environment                        |
| Cache              | `kv()`                                        | `ctx.cache`             | KV                                                             |
| Queue              | `queue()`                                     | `mode: "queue"` events  | Queues                                                         |
| Tool secrets       | `secrets: { NAME: { why } }`                  | `ctx.secrets`           | encrypted by the platform                                      |
| Per-person secrets | `userSecrets: { NAME: { label, help, why } }` | `ctx.userSecrets`       | encrypted, per person                                          |
| Connectors         | `connector(type, { mode, scopes })`           | `ctx.connectors.<name>` | —                                                              |
| Outbound network   | `network: { allow: [...] }`                   | `ctx.fetch`             | filtering by the platform                                      |

Scheduled tasks (`jobs/`) and views (`views/`) are not declared: they are **inferred** from the folders and added automatically to the list of resources.

Every resource accepts a `why`: a sentence that explains to the admin why the tool needs it. It is required for connectors, per-person secrets and outbound network.

#### What the admin sees at installation

`forgeron resources` displays the summary locally; the console and the admin MCP show the same screen before installation:

```text
CRM v1.4.0 requests:
  Database (D1)                   Companies, contacts and leads
  File storage (25 MB)            Lead attachments
  Microsoft 365, on behalf of each person
    · Mail.Send                   Send an email to a contact
  One Odoo API key per person     Read your Odoo tickets
  Outbound calls: api.hubspot.com
  1 scheduled task: Monday summary, 7 am
```

#### When a new version asks for more

`forgeron build` compares the resources with those of the production version. A resource that is **added or broadened** (new connector, extra scope, new host, new per-person secret) puts the version **pending approval**: it deploys to preview, but not to production until an admin has accepted the request, in the console or the admin MCP. A removed resource asks for nothing.

## 4. The `.forgeron` folder

```text
.forgeron/
├── project.json        # committed
├── released.json       # committed, written by forgeron release: the manifest to compare with
├── .gitignore          # committed, contains: local/  generated/  build/
├── local/              # ignored
│   ├── env             # dev secrets (dotenv format)
│   └── dev.sqlite      # local database of forgeron dev
├── generated/          # ignored: Kysely types, action types, types of the tools used
└── build/              # ignored: output of forgeron build
```

```json
// .forgeron/project.json
{
  "workspace": "acme",
  "tool": "crm",
  "endpoint": "https://acme.forgeron.app",
  "toolId": "tool_01J8ZK…"
}
```

- `project.json` contains **no secret**: it only says which workspace (`workspace`, the `acme` of `acme.forgeron.app`) and which tool the folder is linked to. It is written by `forgeron init` or `forgeron link`.
- A person's **credentials** are never in the project. `forgeron login` opens the browser (the workspace's SSO) and stores the token in the system keychain (macOS Keychain, Linux libsecret through `secret-tool`), or failing that in `~/.config/forgeron/credentials` (permissions 600; the only storage on Windows, where file modes do not restrict access, D-044). `forgeron logout` forgets it from both.
- `local/env` is only used by `forgeron dev` and by tests. Preview and production secrets are set with `forgeron secrets set`.
- In CI, authentication goes through `FORGERON_TOKEN` (a deployment token created in the console).

## 5. The CLI

The CLI is published as `forgeron` (`npm i -D forgeron`, next to `@forgeron/sdk`, §18) and used with `npx forgeron` or a global alias.

### Lifecycle

| Command                                                                 | What it does                                                                                                                                                                                                                                                                                           |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `forgeron login` · `logout` · `whoami`                                  | Authenticates the person on a workspace (browser, SSO)                                                                                                                                                                                                                                                 |
| `forgeron init [name] [--template crm]`                                 | Creates a tool, from scratch or from a template, alone in its repository: `.forgeron/`, its CI workflow, `AGENTS.md`, `CLAUDE.md`, `docs/lifecycle.md`. At a marketplace's root, in `tools/<name>/`, listed in the index (D-121)                                                                       |
| `forgeron init marketplace [name]`                                      | Creates a marketplace: `forgeron-marketplace.json`, `tools/`, the release workflow, `AGENTS.md`, `CLAUDE.md`, `docs/lifecycle.md` (D-121)                                                                                                                                                              |
| `forgeron link`                                                         | Links an existing folder to a tool in the workspace                                                                                                                                                                                                                                                    |
| `forgeron dev [--as <profile>\|all] [--team <id>] [--port 8787]`        | Runs the tool locally on the Cloudflare runtime: API, local MCP server (`/mcp`), views, playground; hot reload; applies migrations to the local database. `--as` is a profile of the tool, or `all` (every permission); `--team` (repeatable) puts you in teams, which count for the directory (D-137) |
| `forgeron play [--template <name>] [--as <profile>\|all] [--team <id>]` | Opens the playground: list of actions, generated form, result, MCP / API / CLI preview; with `--template`, tries out a template without installing it                                                                                                                                                  |
| `forgeron test`                                                         | Runs Vitest with the Forgeron configuration (alias of `vitest`)                                                                                                                                                                                                                                        |
| `forgeron build`                                                        | Builds the Worker, the manifest, the views and the migrations into `.forgeron/build/`                                                                                                                                                                                                                  |
| `forgeron bundle [--out <dir>]`                                         | Builds the tool into one file, `<name>-<version>.forgeron.json`, and prints its SHA-256: what a marketplace attaches to a release (D-115)                                                                                                                                                              |
| `forgeron preview close [--branch <name>]`                              | Tears down the temporary channel of a branch (a deleted branch, a closed pull request); needs `FORGERON_TOKEN`. The branch: `--branch`, else `FORGERON_BRANCH`, else the pull request's                                                                                                                |
| `forgeron deploy [--branch <name>] [--allow-destructive]`               | Builds, uploads a build to the branch's temporary channel, applies migrations, switches traffic. A release reaches the permanent channels that follow the branch (D-125). There is no `--env production`                                                                                               |
| `forgeron versions`                                                     | Lists versions and their channels                                                                                                                                                                                                                                                                      |
| `forgeron rollback [--channel <name>]`                                  | Puts a permanent channel (production by default) back on the release it served before; `--env preview --branch <b>` for a branch's temporary channel                                                                                                                                                   |
| `forgeron logs [--env] [--action <name>] [--job <name>] [--follow]`     | Execution log                                                                                                                                                                                                                                                                                          |
| `forgeron jobs run <name> [--env]`                                      | Runs a scheduled task on demand                                                                                                                                                                                                                                                                        |
| `forgeron resources [--diff production]`                                | Shows the requested resources, or what changes compared with an environment                                                                                                                                                                                                                            |

### Versions and changelog

| Command                                       | What it does                                                                                                                                     |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `forgeron change`                             | Adds a change to `changes/`: type, semver impact, description (`--type fixed --bump patch -m "…"`; no interactive prompt yet)                    |
| `forgeron change check`                       | Compares the manifest with the last published version and checks that the declared changes cover what changed (used in CI)                       |
| `forgeron release`                            | Computes the new version, writes `CHANGELOG.md`, updates `package.json`, empties `changes/`, creates the git commit and tag (`--no-git` to skip) |
| `forgeron changelog [<tool>] [--since 1.2.0]` | Shows a tool's changelog, local or published                                                                                                     |

### Administration

| Command                                                                 | What it does                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `forgeron catalog search <text>`                                        | Searches the template catalog                                                                                                                                                                                                                                   |
| `forgeron install <template> [--name]`                                  | Installs a template in the workspace, after displaying and approving the resources                                                                                                                                                                              |
| `forgeron tools`                                                        | Lists the workspace's tools, their versions and environments                                                                                                                                                                                                    |
| `forgeron access grant <tool> <everyone\|team:id> <profile>` · `revoke` | Manages access                                                                                                                                                                                                                                                  |
| `forgeron approve <tool> <version>`                                     | Approves the new resources requested by a version                                                                                                                                                                                                               |
| `forgeron mcp`                                                          | Runs the admin MCP locally (stdio), for a self-hosted workspace or a client without remote MCP                                                                                                                                                                  |
| `forgeron admin <area> <verb>`                                          | The admin operations from a terminal: `tools list`, `approvals list\|approve\|reject`, `members list\|invite --team\|teams <id> --set\|remove`, `teams list\|create\|permissions`, `audit`, `user-secrets list\|set\|revoke`, `reseal`, `revoke-tokens` (D-113) |
| `forgeron api <METHOD> <path>`                                          | Calls any `/api/` route of the console API with your token, like `gh api` (D-113)                                                                                                                                                                               |
| `forgeron platform status --account --domain`                           | What is installed on the Cloudflare account: platform database and migrations, gateway bindings (names only), route (D-113)                                                                                                                                     |

### Database

| Command                                                   | What it does                                                                                                                                                                                                                                                                                                |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `forgeron db generate [--name <name>]`                    | Compares `db/schema.ts` with the last snapshot and writes the migration(s)                                                                                                                                                                                                                                  |
| `forgeron db migrate [--env]`                             | Applies pending migrations (local by default)                                                                                                                                                                                                                                                               |
| `forgeron db status [--env] [--branch] [--channel]`       | Applied and pending migrations; on `preview` or `production`, against the version served, with the conflicts (a person who holds `tools:data`)                                                                                                                                                              |
| `forgeron db rollback [--env] [--steps 1]`                | Runs the `down` of the latest migrations                                                                                                                                                                                                                                                                    |
| `forgeron db seed`                                        | Runs `db/seed.ts` on the local database                                                                                                                                                                                                                                                                     |
| `forgeron db shell [--env] [--channel] --sql <statement>` | SQL console. Local: yours. On a branch, production or another permanent channel (`--channel`, D-125) (a person who holds `tools:data`, `forgeron login`): one statement, read by default; a write needs `--write` and, on a permanent channel, `--confirm <tool>`; recorded in the audit log before it runs |

### Secrets and access

| Command                                          | What it does                                                                                                                                |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `forgeron secrets set <NAME> [--env]`            | Sets a tool secret; the value is read from the keyboard, never as an argument. `--user` only prints the link to your own setup page (D-102) |
| `forgeron secrets list [--env]`                  | Names of the secrets that are set, never the values                                                                                         |
| `forgeron token create --name ci --scope deploy` | Creates a deployment token for CI                                                                                                           |

### Tool actions, as commands

Every action of a tool exposed through the CLI becomes a command:

```bash
forgeron <tool> <group> <verb> [arguments] [--options]
forgeron crm contacts search "Durand" --limit 5
forgeron odoo tickets list --mine --json
forgeron inventory equipments import ./fleet.csv --no-dry-run
```

- **Positional arguments** are declared by `cli.args`; the other input fields become kebab-case options (`checkBefore` → `--check-before`), and booleans accept `--x` / `--no-x`.
- `--json` outputs the raw result; otherwise the CLI displays it as a table.
- `--env` chooses the environment (production by default).
- `forgeron <tool> --help` lists the actions with their descriptions.
- Exit codes: `0` success, `1` action error, `2` invalid input, `3` access denied, `4` not found.

## 6. Actions

```ts
import { action, z, ToolError } from "forgeron";

export default action({
  description: "Moves a lead to a new stage.",
  access: "write",
  input: z.object({ id: z.string(), stage: z.enum(["won", "lost"]) }),
  output: z.object({ id: z.string(), stage: z.string() }), // optional
  confirm: false,
  cli: { args: ["id", "stage"] },
  http: { method: "POST" },
  async run(ctx) {
    /* … */
  },
});
```

| Option        | Type                                     | Default                                 | Meaning                                                                              |
| ------------- | ---------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------ |
| `description` | `string`                                 | — (required)                            | Description for Claude, OpenAPI, CLI help; it is what makes Claude choose the action |
| `access`      | access level                             | — (required)                            | Level required of the person; no action without it                                   |
| `input`       | Zod object schema                        | — (required, `z.object({})` if nothing) | Input validation and typing; source of the MCP and OpenAPI schemas and CLI options   |
| `output`      | Zod schema                               | inferred                                | Validates the output; published in MCP (`outputSchema`) and OpenAPI                  |
| `confirm`     | `boolean`                                | `true` if `access: "delete"`            | Destructive action: MCP annotation, CLI confirmation, dialog in the playground       |
| `cli.args`    | `string[]`                               | `[]`                                    | Fields passed as positional arguments                                                |
| `http.method` | `"GET" \| "POST"`                        | `GET` if `access: "read"`, else `POST`  | Method of the API route                                                              |
| `interfaces`  | subset of the config                     | those of the tool                       | Hide an action from an interface                                                     |
| `rateLimit`   | `{ per: "user" \| "tool", max, window }` | none                                    | Call limit                                                                           |

### The `ctx` context

| Member                 | Available if            | Description                                                                                                                                                                                            |
| ---------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `input`                | always                  | Validated, typed input                                                                                                                                                                                 |
| `user`                 | always                  | `{ id, email, name }` of the person (or of the tool in a scheduled task), plus `avatar` and `teams` with the directory; `can(permission)` reads what the person's teams and Everyone are given (D-137) |
| `can(level)`           | always                  | Checks an additional access level in code                                                                                                                                                              |
| `interface`            | always                  | `"mcp" \| "api" \| "cli" \| "web" \| "job" \| "tool"`: where the call comes from                                                                                                                       |
| `db`                   | `resources.db`          | Typed `Kysely<DB>`; the writes of an action are atomic in one `batch` (D-012)                                                                                                                          |
| `emit(event, payload)` | always                  | Emits an event (section 9)                                                                                                                                                                             |
| `secrets`              | `resources.secrets`     | Tool secrets, read-only                                                                                                                                                                                |
| `userSecrets`          | `resources.userSecrets` | The person's secrets; if absent → automatic collection                                                                                                                                                 |
| `connectors.<name>`    | `resources.connectors`  | Clients of third-party services                                                                                                                                                                        |
| `fetch`                | always                  | Standard `fetch`, filtered by `resources.network`                                                                                                                                                      |
| `files`                | `resources.files`       | R2 storage (section 10)                                                                                                                                                                                |
| `cache`                | `resources.cache`       | KV cache, `user` scope by default                                                                                                                                                                      |
| `tools.<name>`         | `uses`                  | Calls to actions of other tools                                                                                                                                                                        |
| `log`                  | always                  | `log.info / warn / error(message, data)` to the log                                                                                                                                                    |
| `now()`                | always                  | Clock in the workspace's time zone, frozen in tests                                                                                                                                                    |
| `env`                  | always                  | `"local" \| "preview" \| "production"`                                                                                                                                                                 |

### Errors

| `ToolError` code         | HTTP | MCP                         | CLI (exit) | When                                                        |
| ------------------------ | ---- | --------------------------- | ---------- | ----------------------------------------------------------- |
| `INVALID`                | 400  | tool error                  | 2          | Input well-formed but rejected by the business rule         |
| `FORBIDDEN`              | 403  | tool error                  | 3          | Insufficient rights (also raised automatically by `access`) |
| `NOT_FOUND`              | 404  | tool error                  | 4          | Object missing                                              |
| `CONFLICT`               | 409  | tool error                  | 1          | Duplicate, concurrent version                               |
| `RATE_LIMITED`           | 429  | tool error                  | 1          | Limit exceeded                                              |
| `SECRET_REQUIRED`        | 428  | tool error with a link      | 1          | A per-person secret is missing (raised by the platform)     |
| `UPSTREAM`               | 502  | tool error                  | 1          | Third-party service in error                                |
| _(unexpected exception)_ | 500  | tool error, generic message | 1          | The detail stays in the log, never returned to the caller   |

## 7. The four interfaces

|                 | MCP                                                 | API                                                      | CLI                                             | Web                                         |
| --------------- | --------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------- |
| Address         | `https://<workspace>.forgeron.app/t/<tool>/mcp`     | `https://<workspace>.forgeron.app/t/<tool>/api/<action>` | `forgeron <tool> …` (manifest: `/t/<tool>/cli`) | `https://<workspace>.forgeron.app/t/<tool>` |
| Action name     | `<tool>_<group>_<verb>` (`crm_deals_move`)          | `/t/crm/api/deals.move`                                  | `forgeron crm deals move`                       | `useAction("deals.move")`                   |
| Authentication  | OAuth through the workspace's SSO                   | personal token or SSO session                            | `forgeron login`                                | SSO session                                 |
| Schema          | JSON Schema `inputSchema` / `outputSchema` from Zod | OpenAPI 3.1 at `/t/<tool>/api/openapi.json`              | generated options, `--help`                     | generated TypeScript types                  |
| Destructive     | `destructiveHint`, `readOnlyHint` annotations       | —                                                        | interactive confirmation                        | confirmation dialog                         |
| Missing secrets | elicitation, otherwise a link                       | `428` with an input link                                 | prompt in the terminal                          | input page                                  |

All of them go through the same **identity gateway**: SSO, team resolution, `access` check, audit log. No interface bypasses another.

### Addresses

One subdomain per company, then paths. Everything fits in **a single subdomain level**, covered by Cloudflare's free certificate (Universal SSL): no paid module is needed.

```text
https://acme.forgeron.app/                       workspace console
https://acme.forgeron.app/mcp                    admin MCP (section 17)
https://acme.forgeron.app/t/crm                  tool's web interface (home, views)
https://acme.forgeron.app/t/crm/pipeline         a view (path: "/pipeline")
https://acme.forgeron.app/t/crm/mcp              tool's MCP server
https://acme.forgeron.app/t/crm/api/deals.move   an action through the API
https://acme.forgeron.app/t/crm/api/openapi.json OpenAPI description
https://acme.forgeron.app/t/crm/cli              CLI command manifest
https://acme.forgeron.app/t/crm/play             tool's playground
```

| Segment                                         | Rule                                                                                                                                          |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `<workspace>`                                   | `[a-z0-9-]`, 3 to 40 characters. Reserved: `www`, `app`, `api`, `docs`, `status`, `console`, `mcp`, `admin`, `auth`, `cdn`, `static`, `play`. |
| `/t/<tool>`                                     | The tool's `name`. `t` is the only prefix for tools; the other top-level paths (`/mcp`, `/settings`, `/auth`…) belong to the platform.        |
| `/t/<tool>/mcp`, `/api`, `/cli`, `/play`, `/_f` | Reserved by the platform. A view cannot use these paths; the build refuses it.                                                                |
| `/t/<tool>@<branch>/…`                          | A branch's temporary channel: same structure, on the branch's version (`/t/crm@feat-export/mcp`).                                             |
| `/t/<tool>~<channel>/…`                         | A permanent channel other than production (D-125): `/t/crm~staging/mcp`. Git refuses `~` in a branch name, so it never clashes with a branch. |

`/t/<tool>/cli` answers depending on the caller. The CLI fetches the command manifest there, as JSON (actions, arguments, options), keeps it in cache and refreshes it at each version; execution then goes through `/t/<tool>/api`. A browser sees a help page there: installation, `forgeron login`, list of commands.

### Routing on Cloudflare

- A proxied wildcard DNS record `*.forgeron.app` and a `*.forgeron.app/*` route send everything to the dispatch Worker.
- The dispatcher reads the subdomain (the workspace), then the path (`/t/<tool>[@<branch>]/<interface>`), and forwards the request to the tool's Worker for that environment: through a dispatch namespace (Workers for Platforms) in the Forgeron cloud, through a service binding in self-host (`ARCHITECTURE.md`, "Hosting modes").
- Later, a customer will be able to plug in their own domain (`tools.acme.fr`) through Cloudflare for SaaS, with the same path structure.

### Isolation between tools on the same origin

With paths, all the tools of a workspace share the same origin (`acme.forgeron.app`). A cookie limited by `Path` is not a security boundary: without precautions, JavaScript from a CRM view could call the Odoo gateway's API with the person's session. Forgeron therefore isolates explicitly:

1. **No developer code runs at the workspace origin.** `/mcp`, `/api` and `/cli` only return JSON. The console and the playground are Forgeron code.
2. **Views are served sandboxed.** A view's response carries `Content-Security-Policy: sandbox allow-scripts allow-forms allow-popups allow-downloads`: the browser gives it an opaque origin. It can neither read the workspace's cookies, nor read another page of the workspace, nor call an API with the session.
3. **Views call their tool with a dedicated token.** The runtime injects into the page a short-lived token, limited to the tool and the person (audience `acme/crm`). The `forgeron/react` hooks use it; the `/t/odoo` API refuses it.
4. **The workspace session is an `HttpOnly`, `Secure`, `SameSite=Lax` cookie**, reserved for the console and the identity gateway.
5. **MCP, API and CLI tokens also carry an audience** (`acme/crm`): a token obtained for one tool is useless on another.

If the sandbox gets in the way of some views (local storage, downloads, libraries that require a real origin), the fallback is an origin dedicated to views, for example `acme.forgeron-views.app/t/crm`, still on a single subdomain level.

## 8. Database and migrations

### The schema

`db/schema.ts` is the source of truth. It uses the builders of `forgeron/db`:

| Builder         | SQLite column                                                                                                                           | TypeScript type                        |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `t.id()`        | `TEXT PRIMARY KEY`, generated by the database (32 hex characters, ordered by creation time)                                             | `string`                               |
| `t.text()`      | `TEXT`                                                                                                                                  | `string`                               |
| `t.integer()`   | `INTEGER`                                                                                                                               | `number`                               |
| `t.real()`      | `REAL`                                                                                                                                  | `number`                               |
| `t.boolean()`   | `INTEGER` 0/1                                                                                                                           | read as `0 \| 1`, written as `boolean` |
| `t.date()`      | `TEXT` ISO `YYYY-MM-DD`                                                                                                                 | `string`                               |
| `t.timestamp()` | `TEXT` ISO 8601 UTC                                                                                                                     | `string`                               |
| `t.enum([...])` | `TEXT` + `CHECK`                                                                                                                        | union of values                        |
| `t.json()`      | `TEXT` JSON, checked with `json_valid` (not yet validated by a schema nor (de)serialized: write `JSON.stringify(value)`, read a string) | `string`                               |
| `t.ref(table)`  | `TEXT REFERENCES`                                                                                                                       | `string`                               |

Modifiers: `.notNull()`, `.unique()`, `.default(v)`, `.defaultNow()`, `.onUpdateNow()`, `.onDelete("cascade" | "set null" | "restrict")`, `.personal()`. Indexes: `index(col)`, `index([a, b])`, `unique([a, b])`.

Names are identical in the schema, in the database and in queries (`snake_case` recommended). `forgeron build` (so `forgeron dev` and `forgeron test`) writes `.forgeron/generated/db.d.ts`, which gives `ctx.db` the types of the schema: a `Kysely<DB>` plus `batch`, the way to make several writes atomic (D-012). The tool's `tsconfig.json` has to include `.forgeron/generated`. A tool that declares `db/schema.ts` must declare `resources.db`.

### Personal data

`.personal()` tags a column as personal data: `email: t.text().personal()`. The tag is written in the table's SQL (`/* personal */` after the column), so the console's database explorer finds it in the database itself and masks the column by default: its values are never read for the page, never in an export, and the column cannot be sorted or filtered on (D-059). A column whose name says it (`email`, `phone`, `first_name`, `last_name`, `address`, `birth…`, `iban`, `ip`, `password`, `token`, `secret`…) is masked as well when it is not tagged. Tagging a column that already exists is a column change: `forgeron db generate` rebuilds the table.

### Migrations

- One file per migration, `db/migrations/NNNN_<name>.ts`, which exports `migration({ up, down, destructive? })`. `up` and `down` are lists of SQL statements, or a function that writes them with a Kysely that only compiles (`db.insertInto(…)`, `db.schema.…`): data migrations are statements added to the generated file. A migration is a list, not code that runs between statements, so that it can be applied atomically on D1 (D-014).
- `forgeron db generate [--name <name>]` compares the schema with `meta/snapshot.json` (the state after the last migration), writes the migration, then updates the snapshot. The generated file can be reread and edited. `forgeron build` fails if the schema moved since the last migration.
- SQLite (D1) limitations are handled by the generator: it uses `ALTER TABLE` when SQLite allows it, otherwise it writes a table rebuild (create, copy, drop, rename) in the same migration. A table that other tables point at is not rebuilt automatically: dropping it would delete their rows, so the generator stops and the migration is written by hand.
- Tracking is done in the `_forgeron_migrations` table (name, file fingerprint, date). An already applied migration whose file changes causes an error.
- **A rename is a drop and an add** (a `destructive: true` migration): the data of the old column does not follow. There is no `expand` then `contract` (D-014).
- `down` is the diff the other way; what `up` dropped does not come back.

### At each deployment

1. The version is built; pending migrations are listed.
2. In **preview**, a fresh database is created per branch, migrated then filled according to `preview.data` (`seed` by default).
3. In **production**, migrations are applied **before** traffic is switched. A `destructive` migration is refused without `--allow-destructive`.
4. A migration and its record are applied in one batch: if it fails, it is rolled back, the deployment stops, and the old version keeps serving.

### Seed

`db/seed.ts` has `export default seed(async ({ db }) => { … })` (`seed` comes from `@forgeron/sdk/db`). No fake-data library is bundled: import the one you like. It feeds the local database (`forgeron db seed`), tests (`createTestTool({ seed: true })`) and previews.

## 9. Events and scheduled tasks

```ts
// events/deal-history.ts
import { on } from "forgeron";
export default on("deal.moved", { mode: "sync" }, async ({ payload, db }) => {
  /* … */
});
```

- `mode: "sync"` (default): run inside the action; an error cancels the action. What a handler writes joins the action's batch (D-012).
- `mode: "queue"`: run after the action is committed, through a Cloudflare Queues queue, with three retries.
- Event names follow `group.past` (`deal.moved`, `contact.created`). Payloads are typed by `defineEvent("deal.moved", zodSchema)` in `events/_types.ts`.

```ts
// jobs/sync.ts
import { schedule } from "forgeron";
export default schedule("0 2 * * *", { timezone: "Europe/Paris" }, async (ctx) => {
  /* … */
});
```

- Standard cron expression, explicit time zone (default: the workspace's).
- The context is that of the **tool** (`ctx.user.id = "tool:<name>"`, `ctx.interface = "job"`), without `userSecrets`.
- Manual run: `forgeron jobs run <name> [--env]`.

## 10. Secrets, connectors, network, files, cache

**Secrets**

- `resources.secrets`: set by the admin, per environment, encrypted. Read with `ctx.secrets.NAME`.
- `resources.userSecrets`: specific to each person and each tool. Collected by the platform on the web, at `/t/<tool>/setup`: asked when a person connects an MCP client (D-098), or from the link of the first call that fails (MCP elicitation, the CLI prints the link). Nothing is asked in the terminal (D-102). Neither the developer nor the admin can read them; the admin can revoke them.

**Setup** (D-096)

What each person must give before the tool works is declared once, in `setup`:

```ts
setup: {
  fields: {
    firstName: field.text({ label: "First name" }),                              // a value, in clear
    team: field.choice({ label: "Team", options: ["support", "sales"], required: false }),
    ODOO_API_KEY: field.secret({ label: "Odoo API key", why: "Read your tickets", help: "…" }),
  },
  check: "setup.check",                                                          // optional, see below
}
```

- `field.text` and `field.choice` are values anyone with the right to see the person may read: `camelCase` names, required unless `required: false`. `field.secret` is a per-person secret, `UPPER_SNAKE` name, and **is `resources.userSecrets`**: the build moves it there, so the admin approval, the sealed storage and `ctx.userSecrets` are exactly those described above. Declaring the same secret in both places is a build error. `resources.userSecrets` alone keeps working.
- **A secret field may declare a `kind`** (`field.secret({ …, kind: "odoo.api-key" })`): what the value is, a name tools agree on (lower case, dots between parts). On the setup page, the person's **saved secrets** are offered under each secret field, those of the same kind first and the person's others after, each with the tools that already use it; a click chooses one (D-105). It is **never matched by field name**, and **never bound without the click**. The tool's `check` runs on the chosen value, the choice is audited (`secret:bound`: the field and the secret's id, never a value), and the secret is then **one secret used by two tools**: changing it once changes it for both. A secret typed on the page is saved under the tool's label and kind. The tool's code is unchanged: it still reads `ctx.userSecrets.NAME`.
- The manifest keeps the plain fields in `setup.fields`. Adding a field is a `minor` change (everyone fills it in at their next use), so is making one required; removing one or changing a label is a `patch`. A field asks the admin to approve nothing, except a secret, which is a resource like any other.
- `check` names an action of the tool that validates the values before they are kept (D-101). The build puts it on **no interface** (MCP, API, CLI), whatever the action says. The platform calls it, not the person, so **no access level is asked**. In it, `ctx.user.setup` and `ctx.userSecrets` are the values **about to be kept** (the new ones over the ones already kept), and `ctx.connectors` has no delegated token. It returns `{ errors: { fieldName: "why" } }` to refuse (a plain field's name or a secret's) or nothing to accept; a `ToolError` of code `INVALID` or `FORBIDDEN` refuses with its message, and any other failure answers "The check could not be completed". Nothing is kept when it refuses, and the person sees each message at its field. It runs when a person gives something, not when they give nothing.
- **Where it is asked, and what the tool gets** (D-097): `/t/<tool>/setup` (and `/t/<tool>/secrets`, the same page) shows one form: the plain fields, then the secrets. A required plain field and a missing secret fail a call together with `428 SECRET_REQUIRED` and that one link. The plain values are kept in clear, one per tool and person (not per environment), shown to their owner and to the workspace's admins, and removed with the person. In an action they are `ctx.user.setup.firstName` (`undefined` if not given); a task has none. Everything is checked before anything is kept: a required field, a choice among its options, a length (200 characters unless `maxLength`).
- **A person's own page of secrets** (D-106): `https://<workspace>.<domain>/my/secrets`, with the session cookie only. It lists the person's secrets with their kind, versions, who last changed them (you, an administrator, or before versions were kept) and **which tool uses which, in which scope**. **No value is shown, not even to its owner**: to change a key the person gives a new one. From it they can give a **new version** (every tool following the latest uses it, after **each tool's own `check`**; one that refuses stops the change and nothing is kept), **rename**, **delete** (confirmed when tools use it: they ask again), **change a binding** (another saved secret, or **keep an earlier version**) or **stop a tool using it**, and **save a secret no tool uses yet**.
- Admins list what each person gave (`GET /console-api/api/tools/<tool>/user-setup`) and clear one value or all of a person's (`DELETE …/user-setup/<person>[/<name>]`): the person is asked again.
- **At the OAuth connection** (D-098): when an MCP client asks to connect to a tool whose setup a person has not finished, the authorization step sends them to `/t/<tool>/setup`, which sends them back to the "Allow" click when they are done. No token is issued for a tool whose setup is incomplete.
- Not done yet (D-097, D-098, D-101, D-102): the connectors as steps of the page, a console screen.

**Connectors**

```ts
resources: { connectors: {
  microsoft: connector("microsoft-365", { mode: "delegated", scopes: ["Mail.Send", "Calendars.Read"], why: "…" }),
} }
```

- `delegated`: acts on behalf of the person, with their OAuth consent managed by the platform.
- `application`: acts on behalf of the tool (scheduled tasks), consent given once by the admin.
- `ctx.connectors.microsoft.graph` exposes the official client when one exists; otherwise an already authenticated `fetch`.
- Every connector package (`@forgeron/connector-<name>`) implements one interface, `defineConnector({ type, hosts, modes, scopes, client? })` from `@forgeron/sdk`:
  - `hosts`: the only hosts the connector reaches (exact or `*.` wildcard, or a function of the session when the host depends on the instance, as with Odoo). The connector's `fetch` raises `FORBIDDEN` for any other host, and these hosts are allowed on top of `resources.network.allow`.
  - `modes` and `scopes`: what the upstream supports. `checkConnectorDeclaration` reports a declaration with another type, an unsupported mode or an unknown scope.
  - `client?(fetch, session)`: the official client, built on the authenticated `fetch`.
  - `ctx.connectors.<name>` always has `fetch` (the `authorization` header is added by the platform's token for the mode), `mode` and `scopes`, plus the official client's members when one exists.
  - `createConnectorClient(definition, declaration, session)` builds it from a `ConnectorSession` (`token()` and the platform `fetch`); the platform supplies the session, consent storage is not part of the interface.
  - At run time a `delegated` connector uses the caller's own consent: the gateway hands the call their access token (refreshed when needed; the refresh token stays at the gateway), and a person who has not consented gets a `428 SECRET_REQUIRED` with the consent link (URL elicitation over MCP), as for a per-person secret (D-046). `forgeron build` bundles the package of each connector the tool declares (its default export), so `ctx.connectors.<name>` exists in the deployed tool; a provider that fails to answer (5xx) keeps the consent and is a retryable `502`, and grants and withdrawals are audited (D-048).
  - In tests, `mockConnector(definition, { fetch: mockFetch({...}) })` from `@forgeron/sdk/testing` gives a fake, passed to `createTestTool({ connectors: { microsoft: ... } })`.
- Proposed initial catalog: `microsoft-365`, `google-workspace`, `odoo`, `slack`, `github`.

**Network**: `ctx.fetch` only reaches the hosts in `resources.network.allow` (and those of the connectors). Any other call raises `FORBIDDEN` and appears in the log.

**Files** (`resources.files`): `ctx.files.put(file, { prefix })`, `get(key)`, `text(file)`, `delete(key)`, `signedUrl(key, { expiresIn })`. R2 storage, one namespace per tool and environment, never public.

**Directory** (`resources.directory`, D-131): the workspace's people, without the tool holding any of them. `ctx.user` always has `id`, `email` and `name`; with `avatars` it has `avatar` too, and so does each member: the address of their picture, which they chose in Settings or their sign-in provider gave (D-133). The rest is asked for in the config and approved by an admin like any resource: `directory({ why, members?, avatars?, teams? })`. Then `ctx.directory.me()`, `member(idOrEmail)` (`undefined` when nobody of the workspace has it), `members({ query?, team?, limit? })`, and with `teams`, `teams({ mine? })`, `team(id)`, `inTeam(id)`. Without a flag the call is refused (`FORBIDDEN`), and the gateway hands the Worker only the fields the tool declared. Check a person against `ctx.directory.member(...)` in the action that shares something: a view's suggestions are a convenience, the action is the rule. In `forgeron dev`, the people come from `.forgeron/local/directory.json` (`{ members: [{ email, name, avatar }], teams: [{ id, name, members: [email] }] }`, a made-up one without it) and `--user <email>` chooses who the developer is; in tests, `createTestTool({ directory: { members, teams } })`.

**Teams** (D-132, D-137): the workspace has named groups of members, managed in Administration, Teams. A person may be in any number of them. In a tool's Access tab, Everyone and each team are the rows: a person holds the access of Everyone and of their teams together. With `directory({ why, teams: true, members: true })` a tool reads them: `ctx.user.teams`, `ctx.directory.teams({ mine: true })`, `inTeam(id)`, `members({ team })`. A tool that keeps a space per team stores a `team_id` on its rows and checks `ctx.directory.inTeam(team_id)` in each action: the platform says who is in which team, the action applies the rule.

**Cache**: `ctx.cache.get / set / getOrSet(key, { ttl, scope }, fn) / delete`. `scope: "user"` by default; `"tool"` for reference data that is identical for everyone.

## 11. Views

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

| API                                                       | Meaning                                                            |
| --------------------------------------------------------- | ------------------------------------------------------------------ |
| `defineView({ title, path, access, params?, component })` | Declares a page; `access` is checked before any rendering          |
| `useAction(name, input, { refresh? })`                    | Calls a read action; `{ data, error, loading, refetch }`           |
| `useMutation(name)`                                       | Write action; `{ run, loading, error }`; invalidates related reads |
| `useParams()`                                             | URL parameters validated by `params`; `[values, setValues]`        |
| `useUser()`                                               | The signed-in person (and their teams, with the directory)         |
| `useCan(level)`                                           | To disable a button; the server checks anyway                      |
| `useCanCall(action)`                                      | Same, for an action, with the mapping and the console's exceptions |

- Views are React 18+ components, built by `forgeron build` and served behind the SSO. The build adds a mount entry per view (D-130): the view, the hooks and React are one bundle, and the page's `#forgeron-bootstrap` JSON (the person, their grants, the address of the tool, a token) is what it renders with. `forgeron dev` serves the page at the view's path. `useUser()` carries `avatar` and, with `directory.teams`, the person's `teams` (D-131, D-132). A view is a sandboxed page with no shared stylesheet: it carries its own `<style>`.
- `@forgeron/ui` provides components aligned with the Forgeron design system (black and white, sharp corners): `Page`, `Table`, `Board`, `Stat`, `BarChart`, `Select`, `Button`… Optional.
- A view has no direct access to the database: it goes through actions, and therefore through access rights.
- A page is served with the sandbox CSP and a token of 15 minutes, bound to its tool and its person; `createHttpRuntime` makes the hooks call `/_f/call/<action>` with it. After 15 minutes the hooks fail and the page must be reloaded.
- `defineView` refuses a `path` that does not start with `/` or that falls under a path the platform reserves (`/mcp`, `/api`, `/cli`, `/play`, `/_f`).
- Reads are shared: two components calling `useAction` with the same name and input use one request. `refresh` is a polling period in milliseconds.
- `useMutation` invalidates the reads of the same group: `deals.move` re-reads `deals.*`; an action without a dot invalidates every read. `run` rejects on failure, and the error is also exposed as `error`.
- `useParams` returns the values parsed by `params`; the setter merges a partial update, validates it, then writes the URL. Values are strings in the URL, so use `z.coerce` for numbers.

### Realtime

A tool tells the people listening when something changed, and pages follow it live (D-135). Three pieces: **channels** the tool declares, **messages** its actions publish (or a page sends), and **presence** (who is on a channel).

```ts
// forgeron.config.ts
realtime: {
  channels: {
    notes: { access: "read" },                       // anyone who may read: "something changed"
    note: { access: "read", send: "write", presence: true, authorize: "notes.canJoin" }, // note:<id>
  },
},
```

- A channel is named `note`, or one instance of it, `note:<id>`. `access` is the level needed to listen (the matrix applies, subject `channel:<name>`), `send` the level needed to send **from a page** (none: only the tool publishes), `presence` lists the people on it, `authorize` names an action that decides for one instance: it receives `{ channel, id, kind }` and returns `true` to let the person in. It runs **as the person**, so the rule for following a note is the rule for reading it.
- **Publish** from an action: `ctx.realtime.publish("note:123", "moved", { to: "won" })`, or `ctx.realtime.changed("notes")` (event `changed`, no payload). A payload is 8 KB at most and a call publishes 20 messages at most; the channel must be declared (a build error otherwise). What an action publishes leaves **only if it succeeds**. Prefer a signal over data: tell listeners to read again, and each reads through the action with their own access.
- **In a view**: `useAction("notes.list", {}, { live: "notes" })` re-reads when anything is published on the channel. `useChannel("note:123")` gives `{ status, reason, messages, last, presence, send, track }`: `status` is `connecting`, `subscribed`, `denied` (with `reason`) or `closed`; `send(event, payload?)` reaches the others on the channel when the channel allows pages to send; `track(state)` shares a cursor or a typing flag with the others, who see it in `presence`. The connection is one WebSocket per page, opened by the first component that listens, reconnecting by itself.
- **Protocol** (for a client that is not a view): `GET <tool>/_f/realtime?token=<view token>` upgraded to a WebSocket; JSON messages `{ t: "subscribe" | "unsubscribe" | "send" | "track" | "ping", channel, … }` and, back, `ready`, `subscribed` (with `presence`), `denied` (with `reason`), `message`, `presence`, `pong`, `error`. A person joins a channel only if the manifest, the matrix and the tool's `authorize` agree, and is told why if not. At most 50 channels per connection and 30 sends a second.
- **In `forgeron dev`**: the same hub on a local WebSocket (`Live` line). Open two pages as two people with `?as=<email>` (people of `.forgeron/local/directory.json`) and watch one follow the other. In tests, `tool.realtime` lists what the actions published.
- **On a platform**: the room of a tool channel is a Durable Object of the gateway (`REALTIME`); an install without it answers `501 NOT_ENABLED` and nothing else changes.

## 12. Composition between tools

```ts
// forgeron.config.ts
uses: {
  crm: "^1.4.0";
}

// in an action
const deals = await ctx.tools.crm.call("deals.list", { owner });
```

- The types of the called actions are generated from the target tool's published manifest.
- The call runs **with the person's identity**; in a scheduled task, with the tool's identity, which must have been given a profile in the target tool.
- A deployment is refused if the production version of the target tool does not satisfy the `uses` range.
- Views can directly call the actions of a tool declared in `uses`: `useAction("crm.deals.list", …)`.

## 13. Tests

Forgeron does not provide a test framework: we use **Vitest**. `forgeron/testing` adds a context.

```ts
import { createTestTool, mockFetch } from "forgeron/testing";

const tool = await createTestTool({
  seed: true,                                   // applies migrations + seed
  as: { email: "ely@acme.fr", profile: "commercial", userSecrets: { /* … */ } },
  secrets: { /* … */ },
  fetch: mockFetch({ "GET https://api.example.com/x": { ok: true } }),
  now: "2026-10-20T09:00:00+02:00",
  tools: { crm: { "deals.list": async () => [] } },   // stubs of the tools used
});

await tool.call("deals.move", { id, stage: "won" });  // goes through access, validation, events
tool.db;                                              // Kysely on the test database
tool.events;                                          // emitted events
tool.as({ profile: "support" }).call(…);              // another identity
```

- The identity (`as`, `tool.as(…)`) is `{ id?, email?, name?, teams?, profile?, permissions? }`. `profile` gives that profile's permissions, `permissions` gives exactly those; with neither, the person has what Everyone and their `teams` are given by default (the `admin` team gets all). `roles` is a type error.
- The database is an in-memory D1 on Cloudflare's local runtime, migrated on each `createTestTool`.
- `forgeron test` runs Vitest with this configuration; CI runs `forgeron test` before any deployment.

## 14. Build

`forgeron build` is specific to Forgeron; internally it relies on an existing bundler, without the developer configuring it.

Output in `.forgeron/build/`:

| File                       | Content                                                                                                                                                                                                                 |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `worker.js`                | The tool's Worker: actions, events, tasks, routing of the four interfaces                                                                                                                                               |
| `manifest.json`            | Name, version, actions (names, descriptions, JSON schemas, access, CLI options), views, scheduled tasks, event handlers (event and mode), profiles, resources, dependencies                                             |
| `changelog.json`           | The changelog entries of this version, structured                                                                                                                                                                       |
| `docs.json`                | The tool's `README.md` and the images it references, with their content (the manifest keeps their hashes under `docs`); only when the tool has a README or an icon                                                      |
| `migrations/`              | The compiled migrations, with their fingerprints                                                                                                                                                                        |
| `views/`                   | The views, as static files: one ES module per view (`views/pipeline.js`, whose default export is the `defineView` object), plus the chunks they share; each is listed in `manifest.json` under `views` with its `entry` |
| `openapi.json`, `mcp.json` | Generated descriptions, published with the version                                                                                                                                                                      |

### Documentation

The catalog (the member space of the console) shows a card per tool. Its text is the tool's `README.md`, technical and read by administrators, and its `GUIDE.md`, optional: the tool explained to the people who use it, with no technical detail (D-115). Both are collected at build with the images they reference with a relative path (`![](docs/a.png)`, `<img src="docs/a.png">`) and the config's `icon`. Nothing else is read: a link to another site is left as it is, and the console only shows images that come from the build. A build fails, naming the file, if a path leaves the tool folder (`..`, a link that leaves it), a file is over 1 MB (README, guide, image) or the whole over 5 MB, the icon is over 128 KB or is not a `.svg` or `.png`, an image is not `.png`, `.jpg`, `.webp`, `.gif` or `.svg`, its content is not what its extension says, or an SVG holds a script, an event handler, a `foreignObject` or an address outside the file. The platform checks all of it again when it receives the build. A README is plain markdown: the console does not render raw HTML in it.

The build fails if: an action has no `access` or `description`, an action name is duplicated, the schema differs from the last snapshot without a migration, an import leaves the tool (except npm packages), a view cites a non-existent action (read from the literal names given to `useAction` and `useMutation`; a name held in a variable is not checked), a view path is reserved by the platform or shared with another view, or code uses an undeclared resource (`ctx.db` without `resources.db`).

Deployment to production additionally fails if the version has no changelog entry, if the declared impact is lower than the detected impact (section 16), or if new resources are awaiting approval.

## 15. Versions, channels, deployment

A **branch** (GitHub) is where people work: Git is the versioning and the history, and Forgeron never moves code between branches. A **channel** (Forgeron) is where a tool is distributed, with its own database and its own access rule (D-125, [lifecycle.md](lifecycle.md)).

| Channel                                  | Created by                                                         | Takes                                                              | Database                                          | Who has access                                                            |
| ---------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------- | ------------------------------------------------------------------------- |
| `local`                                  | `forgeron dev`                                                     | your working copy                                                  | `.forgeron/local/dev.sqlite`                      | the developer                                                             |
| a branch's temporary channel (`preview`) | each push to a branch; removed when the branch is deleted          | every push of its branch, release or not                           | its own, filled by `preview.data` (seed or empty) | admins and developers; the people an admin publishes it to (D-119, D-129) |
| `production` (permanent, always there)   | the first release of the branch it follows (`main` unless changed) | only the releases of the branch it follows                         | its own                                           | the tool's availability (D-117)                                           |
| another permanent channel (`staging`…)   | an admin, on the tool's page                                       | only the releases of the branch it follows (or of the marketplace) | its own: it never touches production's            | admins; the people an admin publishes it to (D-129)                       |

- **A release** is a build made by `forgeron change` then `forgeron release` on a branch, with no change pending since (`changelog.json` says `released: true`). A build that is not a release never reaches a permanent channel. Pre-releases (`-rc.N`) are not supported: `forgeron release` numbers `x.y.z` only.
- **The update**: when a release lands on the branch a permanent channel follows, the channel takes it by itself when it updates by itself and the release asks for nothing new; otherwise it waits for an _Update_ by someone who holds `tools:write`, which approves what the release asks for in the same step. A marketplace tool's channels take the marketplace's releases the same way.
- **Rollback**: `forgeron rollback` puts the release a permanent channel served before back on traffic: no new code. Migrations are not rolled back automatically; `forgeron db rollback` does it explicitly.
- **Data**: a temporary channel starts empty (seed or empty per `preview.data`); an admin may replace its data by another branch's. A permanent channel's data is never copied, nor replaced.
- **Secrets**: production has its tool secrets and connections; every other channel uses the `preview` ones, so production's credentials never leave production.
- **Audit log**: every deployment, update and rollback is recorded (who, when, which version, which channel).
- **Two sources** (D-121): a tool is installed from a **marketplace** (its latest release; a newer one is an update) or added from a **GitHub repository** that holds only it (each pushed branch is a temporary channel).

### Publishing from GitHub

The build happens **in the tool repository's CI**, not on the platform: Forgeron does not host build machines, and the same path serves locally, in CI and in self-host.

```yaml
# .github/workflows/forgeron.yml, in the tool's repository (generated by forgeron init)
on:
  push:
    branches: ["**"]
  delete:
permissions:
  contents: read
  id-token: write # GitHub tells Forgeron which repository this is: no secret (D-123)
jobs:
  deploy:
    if: github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: forgeron-sh/monorepo/.github/actions/deploy@v<version>
  close: # the preview of a deleted branch goes
    if: github.event_name == 'delete' && github.event.ref_type == 'branch'
    # same steps, with close: "true" and branch: ${{ github.event.ref }}
```

For each tool in the repository (section 2), the action installs its dependencies (bun with a `bun.lock`, npm otherwise), then runs, with the CLI of the action's own release:

1. `forgeron test`;
2. `forgeron change check`;
3. `forgeron deploy`: build, upload to the gateway, migrations, the branch's temporary channel. Every branch, the one production follows included, deploys its temporary channel; when the build is a release, the permanent channels that follow the branch take it, by themselves or through an admin's update (D-125).

**Authentication, with no token** (D-123): with `id-token: write`, `forgeron deploy` and `forgeron preview close` ask GitHub Actions for an identity token whose audience is the workspace's address, and the gateway deploys the tool linked to the repository that runs (by GitHub's number for it, so a rename changes nothing). The workspace comes from `.forgeron/project.json`, or from `FORGERON_ENDPOINT` (the action's `endpoint`). A `FORGERON_TOKEN` (deployment token, section 4) still works, given as the action's `token`, for CI that is not GitHub's.

**The workspace's GitHub App** (D-123): an admin makes it from Settings → GitHub and installs it on an organisation. _Add from GitHub_ then lists the repositories it sees and links one in a click (adding the workflow when the repository has none); _New tool_ makes the repository, as `forgeron init` would, and links it before its first push. The app adds no build on the platform side: it closes the preview of a deleted branch (its webhook) and puts the preview's address beside the commit (a commit status `forgeron/preview`).

## 16. Versioning and changelog

Every tool has a mandatory **semver** version and **changelog**. Forgeron does not trust the declaration alone: it compares the new version's manifest with that of the last published version and checks that the announced impact is at least the one it detects.

### Build, version, release

Three words, three things, so that "every push creates a version" and "the version only changes with `forgeron release`" do not contradict each other:

|                  | Created by                      | Identifier                                                                                                         | Changes when        |
| ---------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------- |
| Build            | each push, or `forgeron deploy` | the commit (`a41f9e0`)                                                                                             | on every commit     |
| Version          | `forgeron release`              | semver (`1.5.0`)                                                                                                   | on every release    |
| What is deployed | `forgeron deploy`, an update    | `1.5.0-preview.<branch>+a41f9e0`: the version, the branch and the commit; a permanent channel serves the same name | on every deployment |

A push without a release therefore produces a new build of the current version: it deploys to its branch's temporary channel, never to a permanent channel.

A release is **required** for a permanent channel (D-125, which replaces D-121's `withoutRelease`): a build with no release, or one whose `changes/` still wait for `forgeron release`, is refused there; a release that declares less than what Forgeron detects too. A marketplace's publication is its release. Run `forgeron release` on the branch a permanent channel follows (`main` for production): it consumes `changes/`, so two branches releasing on their own would number the same version twice and conflict at the merge.

### Where the version lives

- The version is in `package.json` (`"version": "1.4.0"`), and only there. It only changes with `forgeron release`.
- A published version is identified by `v1.4.0+a41f9e0` (version + short commit). A preview carries `1.5.0-preview.<branch>.<n>`.
- `CHANGELOG.md`, at the root of the tool, is **generated**: it is not edited by hand.

### The `changes/` folder

Every notable change adds a small file, as Changesets do in the JavaScript ecosystem:

```bash
forgeron change
# ? Type: added | changed | fixed | removed | security   → added
# ? Impact: patch | minor | major                        → minor
# ? Description: CSV export of leads (deals.export)
```

```markdown
<!-- changes/2026-10-20-export-csv.md -->

---

type: added
bump: minor
---

New `deals.export` action: CSV export of the filtered leads.
```

One file per change rather than a single file: two branches never step on each other, and each pull request carries its own entry.

### What Forgeron detects

`forgeron change check` (in CI) and `forgeron build` compare the manifests:

| Detected change                                                       | Minimum impact |
| --------------------------------------------------------------------- | -------------- |
| Action removed or renamed                                             | `major`        |
| Required input field added, field type narrowed, output field removed | `major`        |
| Access level of an action raised                                      | `major`        |
| View removed or `path` changed                                        | `major`        |
| `destructive` migration                                               | `major`        |
| Action added, optional input field added, output field added          | `minor`        |
| New view, new scheduled task, new resource                            | `minor`        |
| Description changed, internal code, non-destructive migration         | `patch`        |

If `changes/` is empty while the manifest changed, or if the declared impact is lower than the detected impact, a permanent channel refuses the build. Temporary channels are not blocked.

For other tools, the impact matters: a tool that declares `uses: { crm: "^1.4.0" }` never automatically receives a `2.0.0` version of the CRM.

### The baseline

`forgeron release` also writes `.forgeron/released.json` (committed): the manifest and the migrations of the version it released. `forgeron change check` and `forgeron build` compare with it, until the platform can serve the last published manifest. Before the first release there is no baseline and nothing is detected. A new migration marked `destructive` counts as `major`.

`changelog.json` holds the pending entries, or those of the last release when none is pending, with `declared` (the strongest bump), `detected`, `pendingApproval` and `released` (no change pending, and the version is the one `forgeron release` wrote: the build is a release, D-125). A host calls `assertDeployable` (`@forgeron/hosting`) before taking a build to a permanent channel.

### `forgeron release`

1. Reads `changes/`, computes the new version (the strongest impact wins).
2. Writes the entry in `CHANGELOG.md`, with a written part (the files from `changes/`) and a generated technical part.
3. Updates `package.json`, empties `changes/`, creates the commit and the `crm@1.5.0` tag.

```markdown
## 1.5.0 — 2026-10-20

### Added

- New `deals.export` action: CSV export of the filtered leads.

### Fixed

- `contacts.search` now ignores accents.

### Technical

- Actions added: `deals.export`
- Migrations: `0003_deals_export_index`
- Resources: no new ones
```

### Where the changelog is read

- **Console**: a tool's page shows the version of each channel and "what it contains" compared with the previous one (the Releases tab).
- **Admin MCP**: `tool_changelog` ("What has changed in the CRM since 1.3?").
- **CLI**: `forgeron changelog crm --since 1.3.0`.
- **Build**: `changelog.json` is published with each version, so that the console, the MCP and dependent tools read it without parsing Markdown.

## 17. The admin MCP

In addition to each tool's MCP server, the workspace exposes **a Forgeron MCP server** for administration. You add it once in Claude and manage the whole workspace in conversation: search for a template, install it, look at its versions, grant access, see who uses what.

|                    | A tool's MCP                          | Forgeron MCP                              |
| ------------------ | ------------------------------------- | ----------------------------------------- |
| Address            | `https://acme.forgeron.app/t/crm/mcp` | `https://acme.forgeron.app/mcp`           |
| Used for           | Using the tool (its actions)          | Administering the workspace and its tools |
| For whom           | The tool's users                      | The workspace's developers and admins     |
| Self-host or local | —                                     | `forgeron mcp` (stdio)                    |

### Exposed tools

Each tool calls the platform's own routes with the signed-in person's identity, so it has the guard, the validation and the audit lines of the console. `/mcp` is authenticated with a Bearer token limited to the workspace: a **CLI token** (`forgeron login`, D-079) or an **OAuth token** that an MCP client such as a Claude connector got by signing in at `/oauth/authorize` (D-094: PKCE, one hour, renewed by a refresh token that rotates, revocable); the session cookie and a tool's tokens are refused. An OAuth token is good on `/mcp` only. The same sign-in works for a tool's MCP: `/t/<tool>/mcp` is its own OAuth resource, and the token it gives is for that tool and that path (D-095). A person is offered only the tools their permissions allow.

| MCP tool                         | What it does                                                                                                                                                                                                                                                      | Needs              | Destructive |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ----------- |
| `catalog_search`                 | Searches the workspace's catalog of tools                                                                                                                                                                                                                         | signed in          |             |
| `catalog_get`                    | A tool's card: what it does, how to connect, what the caller may call                                                                                                                                                                                             | signed in          |             |
| `tools_list`                     | The workspace's tools, their versions per environment                                                                                                                                                                                                             | signed in          |             |
| `tool_get`                       | Tool detail: versions per environment and its card                                                                                                                                                                                                                | signed in          |             |
| `tool_changelog`                 | A tool's changelog, optionally since a version                                                                                                                                                                                                                    | `tools:read`       |             |
| `tool_versions`                  | Versions and environments                                                                                                                                                                                                                                         | `tools:read`       |             |
| `secrets_status`                 | A tool's secrets that are set or missing, **never their values**                                                                                                                                                                                                  | `tools:read`       |             |
| `secret_request`                 | A link where you type a tool's secret yourself; single use, never the value                                                                                                                                                                                       | `tools:write`      |             |
| `usage_report`                   | Authenticated calls per tool and per person over a period, counts only (D-093)                                                                                                                                                                                    | `usage:read`       |             |
| `template_list`                  | The templates of the catalog and the resources each asks for                                                                                                                                                                                                      | `tools:write`      |             |
| `marketplace_list`               | The official catalogue and the marketplaces the workspace added (D-116); adding, syncing or removing one is done in the console                                                                                                                                   | `marketplace:read` |             |
| `marketplace_tools`              | What a marketplace offers, with the resources each tool would ask for                                                                                                                                                                                             | `marketplace:read` |             |
| `tool_install_plan`              | What installing a template, or a tool of a marketplace (`marketplace`), would create; returns a plan identifier (15 minutes, single use)                                                                                                                          | `tools:write`      |             |
| `tool_install`                   | Creates the tool of a plan, once; takes only the plan's identifier                                                                                                                                                                                                | `tools:write`      | yes         |
| `tool_source`                    | Where a tool comes from and its permanent channels: for each, the branch it follows, what it serves and the release waiting, with its plan (D-125)                                                                                                                | `tools:read`       |             |
| `tool_update`                    | Puts the release `tool_source` showed on a permanent channel (`channel`, production by default), approving what it asks for when told (never allows a destructive migration)                                                                                      | `tools:write`      | yes         |
| `tool_rollback`                  | Puts a channel back on the version it served before                                                                                                                                                                                                               | `tools:publish`    | yes         |
| `resources_pending`              | The versions awaiting a resource approval                                                                                                                                                                                                                         | `tools:approve`    |             |
| `resources_approve`              | Approves one pending request for a resource                                                                                                                                                                                                                       | `tools:approve`    | yes         |
| `access_list`                    | A tool's profiles, what Everyone and each team is given in it and the exceptions by action, or the members and their teams                                                                                                                                        | `access:read`      |             |
| `access_grant` · `access_revoke` | Gives a subject (`everyone` or `team:<id>`) a profile of a tool, custom `permissions` or `all`, or nothing on revoke (`tool`, `subject`, D-127, D-137); or allows or refuses a subject one action (`tool`, `subject`, `action`). A group is not a subject (D-091) | `access:write`     | yes         |
| `team_list`                      | The workspace's teams, their members and what each may do on Forgeron (`permissions` as stored, `effective` with what they imply)                                                                                                                                 | signed in          |             |
| `member_set_teams`               | Replaces the teams a member is in (`person`, `teams`); you only add or remove a team whose permissions you hold                                                                                                                                                   | `members:write`    | yes         |
| `team_set_members`               | Replaces the members of a team (`team`, `members`); you only change a team whose permissions you hold, and the admin team keeps one member                                                                                                                        | `teams:write`      | yes         |
| `team_set_permissions`           | Replaces the permissions of a team (`team`, `permissions`; `*` is every one); you only give what you hold, and the admin team's cannot change                                                                                                                     | `teams:write`      | yes         |

**The rest of the console (D-139).** Every other administration the console offers is a tool too, one tool per route of the platform contract, with that route's own input, guard, validation and audit line. Each carries the permission its route requires; a person is offered only those they hold.

| Area                          | Read                                                                                                           | Change (carry the `destructiveHint`)                                                                                                                                                                                                                                         |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The workspace                 | `workspace_get`, `permissions_list`, `audit_list`                                                              |                                                                                                                                                                                                                                                                              |
| A tool and its channels       | `tool_manifest`, `tool_branches`, `tool_activity`, `tool_ci`                                                   | `preview_close`, `tool_delete` (`confirm` is its name), `tool_source_set`, `channel_add`, `channel_update`, `channel_remove`, `branch_data_copy`                                                                                                                             |
| Who may add or use a tool     | `availability_get`, `preview_availability_get`                                                                 | `availability_set`, `preview_availability_set` (refused while there is no version to publish)                                                                                                                                                                                |
| Its database                  | `db_environments`, `db_tables`, `db_schema`, `db_table`, `db_rows`, `db_migrations`                            | `db_query` (a write needs `write: true`, and on production `confirm`)                                                                                                                                                                                                        |
| People and teams              | `membership_settings_get`, `connections_list`, `user_secret_holders`, `user_setup_list`                        | `invitation_send`, `invitation_withdraw`, `member_remove`, `membership_settings_set`, `team_create`, `team_delete`, `person_tokens_revoke`, `connection_revoke`, `user_secrets_revoke`, `user_secret_revoke`, `user_setup_clear`, `user_setup_value_clear`, `secrets_reseal` |
| Marketplaces, GitHub, sign-in | `marketplace_tool_get`, `github_get`, `github_repositories`, `identity_provider_get`, `connector_clients_list` | `marketplace_add` (public only), `marketplace_remove`, `marketplace_sync`, `github_link_repository`, `github_create_tool`, `github_disconnect`, `identity_provider_remove`, `connector_client_remove`                                                                        |
| The platform                  | `platform_update_get`, `platform_update_run`                                                                   | `platform_update_start`                                                                                                                                                                                                                                                      |

**Left out on purpose**: anything that takes or gives a secret (a secret's or a per-person secret's value, an OAuth client secret, the sign-in provider that carries one, a private marketplace's read token, a deployment or CLI token, `secret_request`'s link being filled in); what is not JSON or not an administrator's (a CSV export, an image, a person's consent flow, library and picture, a deployment, which is CI's); and what has a safer way in (installing from a template or a marketplace: `tool_install_plan` then `tool_install`). The explorer's `platform` and `reveal` switches are not offered.

`tool_changelog` needs `tools:read` because the route that carries the changelog does (the version list shows the commits and what changed); anyone signed in reads a tool's card. A tool is listed only to the people who hold what it needs.

### Safeguards

- **Secret values never go through Claude.** No tool reads or writes a secret value. `secret_request` returns a link to a console page where the person types it: the link is single use, lasts 15 minutes, is bound to the person and works only on a signed-in session of theirs (D-083).
- **Installing takes two steps.** `tool_install_plan` returns the plan and the requested resources; `tool_install` only accepts that plan's identifier. An instruction slipped into a document cannot install a tool in one go.
- **Destructive tools** carry the MCP `destructiveHint` annotation, so the client asks before it calls them.
- **No elevation.** The MCP acts with the rights of the signed-in person, read from the token's person at each call and never from an argument: it cannot approve what they could not approve in the console, and every tool it offers is the console's own route behind the same guard. Changing a team is checked as the console does: nobody gives what they do not hold.
- **Everything that changes something is logged**, with the mention "via Forgeron MCP" (`via` of the audit line).

### Example

> "Install a CRM for us and give the sales team access."
>
> Claude calls `catalog_search("crm")`, then `tool_install_plan`: the CRM template requests a database, file storage and the sending of Microsoft 365 emails. Claude shows this summary and asks for confirmation. Once approved, `tool_install` creates the tool, then `access_grant({ tool: "crm", subject: "team:sales", profile: "commercial" })`. Claude finishes by giving the CRM's MCP address to add.

## 18. The npm packages

Two names (D-086, D-122): `forgeron` is the **CLI** (`npx forgeron`), and the `@forgeron` organization holds the packages a tool imports. The published ones are released together, under **one version**, by release-please; each has its own changelog.

### Published

| Package              | Content                                                                                                                                                                                      | Built                                                                                                     |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `forgeron`           | The CLI (`forgeron` binary)                                                                                                                                                                  | One file for Node (tsdown), with the compiler, hosting, registry, platform contract and playground inside |
| `@forgeron/sdk`      | `defineConfig`, `action`, `on`, `schedule`, `z`, `ToolError`; `@forgeron/sdk/db` (schema, migrations, `sql`); `@forgeron/sdk/react` (views, React an optional peer); `@forgeron/sdk/testing` | ES modules and types (tsdown)                                                                             |
| `@forgeron/runtime`  | The runtime a tool's Worker runs: a dependency of the SDK and the CLI, never imported by a tool                                                                                              | ES modules and types                                                                                      |
| `@forgeron/manifest` | The manifest schema and the comparison of two versions: a dependency of the SDK, the runtime and the CLI                                                                                     | ES modules and types                                                                                      |

A tool depends on `@forgeron/sdk` (and on `forgeron` to run the CLI); `forgeron init` writes both. The CLI resolves the runtime and the SDK it bundles into a tool's Worker from where it is installed.

How it is made (`scripts/packages.ts`): each package has a `tsdown.config.ts` that builds `dist/`; `bun run packages:build` builds them and writes `dist/package.json` (exports on the built files, `workspace:*` replaced by the version); `bun run packages:smoke` installs them from their archives in an empty folder and runs `forgeron init`, build, test and bundle. CI runs both on every pull request; the release workflow runs them again, then publishes by trusted publishing (OIDC, no token; the first publication of each package by hand, D-122). The workspace keeps importing `src/`.

### Not published yet

| Package                      | Content                                                                       | Why later                                                                                          |
| ---------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `@forgeron/ui`               | React components of the design system (`Page`, `Table`, `Board`, `BarChart`…) | Optional, heavy, versioned with the design system; also used by the site and the console           |
| `@forgeron/connector-<name>` | Connectors: `microsoft-365`, `google-workspace`…                              | Each bundles a third-party client; a tool installs only the ones it uses                           |
| `@forgeron/template-<name>`  | Catalog templates (`crm`, `inventory`, `dashboard`)                           | `forgeron init --template crm` downloads them; marketplaces are the way to share tools now (D-116) |
| `@forgeron/compiler`         | The build of a tool                                                           | Bundled in the CLI: nothing else needs it                                                          |

### `forgeron/ui` or `@forgeron/ui`?

`@forgeron/ui`. Three reasons:

1. A tool without a view (Odoo) must not download React and a component library.
2. The components follow the design system, not the runtime: a visual fix must not force a new SDK version.
3. The showcase site and the console use the same components without depending on the SDK.

Conversely, `@forgeron/sdk/react` remains a subpath of the SDK: its hooks speak the runtime protocol and are released with it.

### To reserve

- `create-forgeron`, if we want `npm create forgeron` in addition to `npx forgeron init`.
- `@forgeron/cli` and `@forgeron/core`, as empty packages that point to `forgeron`, so that nobody else takes them.

## 19. What Forgeron reuses

| Need                 | Tool reused                                                                     | What Forgeron adds                                                                             |
| -------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Execution            | Cloudflare Workers; Workers for Platforms (cloud), standard Workers (self-host) | One Worker per tool and version, the routing, the identity gateway                             |
| Database             | Cloudflare D1                                                                   | One database per tool and environment                                                          |
| Queries              | Kysely                                                                          | Types generated from the schema                                                                |
| Migrations           | Kysely (schema builder)                                                         | The schema, the generator, the tracking, application at deployment, the expand / contract rule |
| Schemas              | Zod                                                                             | Conversion to JSON Schema, OpenAPI and CLI options                                             |
| Files, cache, queues | R2, KV, Queues                                                                  | Namespaces per tool and environment, the scopes                                                |
| Tests                | Vitest                                                                          | `forgeron/testing`                                                                             |
| Local dev            | Cloudflare's local runtime (workerd, Miniflare)                                 | `forgeron dev`, the playground                                                                 |
| Views                | React                                                                           | The hooks, `@forgeron/ui`, serving behind the SSO                                              |
| AI protocol          | MCP                                                                             | The generated MCP server, OAuth, secret elicitation                                            |

## 20. Open questions

- Execution: decided (`DECISIONS.md`, D-009 and D-010). A tool is an ordinary Worker with its own D1 database per environment, in the cloud (Workers for Platforms) as in self-host (standard Workers).
- Transaction per action (§6, §9): decided, D-012. D1 has atomic batches and no interactive transaction, so an action is atomic through one `ctx.db.batch()`. Still to do: the design of a `sync` handler's writes joining that batch (with `@forgeron/sdk/db`), and a check on a remote D1.
- Is D1 enough for all tools, or do we need a Postgres option (Hyperdrive) from the start?
- Views: client-side rendering only, or server rendering?
- CSP sandbox for React views and `@forgeron/ui`: decided (`DECISIONS.md`, D-082; `docs/spikes/react-views-sandbox.md`). The sandbox is kept and views stay on the workspace origin. Tested: storage, cookies, `indexedDB` and service workers throw (a view keeps no state in the browser); downloads work; popups open but stay sandboxed; the URL parameters work. Still to do: CORS on `/_f/call`, the view's mount entry, CSS bundling, renewal of the 15-minute token.
- Should more than two levels be allowed in action names (`crm.deals.notes.add`)?
- Do we need a "tool owner" distinct from the platform permissions, so that a developer can administer their tool without holding `tools:write` on all of them?
- Should the changelog be visible to end users (for example "what's new" in Claude or in views), or only to admins?
