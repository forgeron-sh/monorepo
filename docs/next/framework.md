# Target — the framework

> Status: proposal (21 November 2026). It describes the second version of the framework. [`../sdk.md`](../sdk.md) stays authoritative for the released API until each part below is decided and moved there.

The framework is what a tool author, human or agent, touches: the repository layout, the definitions, the CLI and the harness. It has one job: **a sentence of intent becomes a correct change, and a wrong change is refused early with a message that says how to fix it.**

## 1. Two repository shapes

Both are supported. The first is the default and the one the documentation teaches.

|                  | Workspace repository                                          | Standalone repository                                                                         |
| ---------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| For              | the tools a company runs on, which must agree with each other | a test, a niche tool for one person or one team                                               |
| Created by       | `forgeron init`                                               | `forgeron init --standalone`                                                                  |
| Tools            | many, under `tools/`                                          | one, at the root                                                                              |
| Bridges          | links and events between its tools, checked at build time     | calls to deployed tools only (`uses`, by version range)                                       |
| Checks and tests | one command for all tools, tests that cross tools             | the tool's own                                                                                |
| Moving later     | —                                                             | `forgeron adopt <repo>` opens a pull request that brings the tool into a workspace repository |

A tool has the same shape in both. Nothing in a tool's folder knows which kind of repository holds it.

### Layout of a workspace repository

```text
acme-tools/
├── forgeron.workspace.ts      # the workspace: name, platform address, shared settings
├── tools/
│   ├── contacts/              # one folder per tool (section 2)
│   ├── crm/
│   └── helpdesk/
├── bridges/                   # what connects tools: one file per link or sync
│   ├── deal-invoice.link.ts
│   └── odoo-partners.sync.ts
├── shared/                    # code several tools import; never exposed
├── tests/                     # tests that cross tools, run on a local workspace
├── recipes/                   # the team's own recipes (section 5)
├── AGENTS.md                  # generated, then owned by the team
├── .forgeron/                 # generated: types of each tool's actions, lockfile of catalog origins
├── .github/workflows/forgeron.yml
└── package.json               # bun workspaces over tools/*
```

Rules:

- `tools/<name>/` is the only place a tool may be. The name of the folder is the name of the tool.
- A tool imports from `shared/` and from the public packages. It never imports another tool's files: it reaches another tool through a bridge or a call. A lint rule and the build both refuse it.
- A bridge lives outside both tools it connects, in `bridges/`. Neither tool depends on the other; the bridge depends on both.
- Our own repository follows the same layout under `tools/`, so the suite we ship is the first user of what we ask of customers.

## 2. A tool

```text
tools/crm/
├── forgeron.config.ts         # name, interfaces, profiles, resources
├── models/                    # one model per file
│   └── deal.ts
├── actions/                   # <group>/<verb>.ts → "deals.move"
├── views/                     # React pages on @forgeron/ui
├── events/                    # handlers of events, the tool's own or another's
├── jobs/                      # scheduled work
├── workflows/                 # durable, multi-step work
├── plugins/                   # typed contributions installed into this tool
├── lib/                       # private code
├── tests/
├── changes/                   # changes awaiting release
└── package.json
```

What changes from today:

- `db/schema.ts` gives way to `models/`, one file per model (section 3). Migrations are still generated and reviewed.
- `workflows/` and `plugins/` are new.
- `resources` names contracts, not products: `database()`, not `database({ engine: "d1" })`.

One rule holds everywhere: **a file in a convention folder exports a single default definition**, and its path is its name. The path is the registry; there is no list to keep in sync.

## 3. Definitions

| Definition       | File                        | Yields                                                                              | State  |
| ---------------- | --------------------------- | ----------------------------------------------------------------------------------- | ------ |
| `defineConfig`   | `forgeron.config.ts`        | the manifest: interfaces, profiles, resources                                       | exists |
| `defineModel`    | `models/<name>.ts`          | table and migration, validators, default list and form, MCP schema, record services | new    |
| `action`         | `actions/<group>/<verb>.ts` | one operation on MCP, API, CLI and web                                              | exists |
| `defineView`     | `views/<name>.tsx`          | a page                                                                              | exists |
| `on`             | `events/<name>.ts`          | a handler                                                                           | exists |
| `schedule`       | `jobs/<name>.ts`            | a scheduled task                                                                    | exists |
| `defineWorkflow` | `workflows/<name>.ts`       | durable steps with sleep and wait-for-event                                         | new    |
| `defineEvent`    | `models/` or `events/`      | a typed, versioned event other tools may subscribe to                               | new    |
| `defineLink`     | `bridges/<a>-<b>.link.ts`   | a link between two models of two tools                                              | new    |
| `defineSync`     | `bridges/<name>.sync.ts`    | a sync with an outside system: direction, conflict policy, rate budget              | new    |
| `definePlugin`   | a package or `plugins/`     | a typed contribution to a tool: models, fields, actions, views, hooks               | new    |

### `defineModel`, the single source

A model is declared once. Everything that can be derived is derived, and can be overridden.

```ts
// tools/crm/models/deal.ts
import { defineModel, f } from "@forgeron/sdk";

export default defineModel({
  label: { one: "Deal", many: "Deals" },
  fields: {
    title: f.text().required(),
    amount: f.money(),
    stage: f.choice(["lead", "qualified", "won", "lost"]).default("lead"),
    closeDate: f.date(),
    owner: f.person(),
  },
  services: { activity: true, attachments: true, search: ["title"], customFields: true },
  access: { read: "read", write: "write", delete: "admin" },
});
```

From this the framework produces: the table and its migration; the input and output validators; `deals.list`, `deals.get`, `deals.create`, `deals.update`, `deals.delete` unless the tool writes its own; a default list and form view; the MCP tool schemas; and the record services asked for (timeline, files, search index, custom fields).

The exact field set and the override rules are the subject of issue F-01 and are not settled here.

### Typing

- Inference first. A tool's own types come from its definitions with no generation step.
- Generated only where inference cannot reach: the types of **another** tool's actions and events, written to `.forgeron/types/` by `forgeron dev` and checked in CI. In a workspace repository they come from the source next door; in a standalone repository, from the deployed manifest.
- A definition is validated when it is loaded. An error carries a stable code, the file, the declaration, the fix and a documentation address, and has a `--json` form.

## 4. The CLI

Every command works without a prompt (`--yes`) and can answer in JSON (`--json`). A command that changes something outside the machine has a `plan` that shows the change first.

| Command                                                  | Does                                                                                           | State   |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------- |
| `forgeron init`                                          | creates a workspace repository; `--standalone` for a single tool                               | changes |
| `forgeron add tool <name>`                               | a new empty tool, or `--from <catalog tool>` to fork one (see [distribution](distribution.md)) | new     |
| `forgeron add model\|action\|view\|job\|workflow <name>` | writes the file in the right place, with its test                                              | new     |
| `forgeron add <resource>`                                | declares a resource in the config and wires `ctx`                                              | new     |
| `forgeron add link <a> <b>`                              | writes the link in `bridges/`                                                                  | new     |
| `forgeron dev`                                           | runs the whole workspace on Anvil, watches, regenerates types                                  | changes |
| `forgeron check`                                         | types, lint rules of the framework, bridges, manifest diff, tests                              | new     |
| `forgeron test`                                          | tool tests and cross-tool tests on a local workspace                                           | changes |
| `forgeron plan`                                          | what a deploy would change: resources, migrations, permissions, bridges                        | new     |
| `forgeron deploy`                                        | applies the plan                                                                               | exists  |
| `forgeron update <tool>`                                 | brings a forked tool up to its catalog origin, as a pull request                               | new     |
| `forgeron adopt <repo>`                                  | moves a standalone tool into the workspace repository                                          | new     |

`forgeron check` is the one command an agent runs before it says it is done.

## 5. The harness

What an agent loads to work in a workspace repository. It ships in `@forgeron/harness` and is installed by `forgeron init`.

| Piece       | What it is                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md` | the layout, the rules of section 1, the commands, where to stop and ask                                                                                       |
| Skills      | `forgeron-tool` (create or change a tool), `forgeron-bridge`, `forgeron-recipe` (apply a recipe), `forgeron-review`                                           |
| Recipes     | a folder with `RECIPE.md` (when to use it, the steps, how to verify) and the model, action, view and test it adds                                             |
| Lint rules  | the conventions an agent breaks: an import across tools, an action without input validation, a view calling an undeclared tool, a product name in `resources` |
| Docs        | `llms.txt`, a Markdown copy of each page, the docs shipped inside the package so they match the installed version                                             |
| MCP         | the developer MCP that exists today: create, run, preview, publish                                                                                            |

A recipe is knowledge, not code that runs: the agent reads it and writes the change. A plugin is code that runs: it is installed and contributes through `definePlugin`. A recipe may install a plugin.

## 6. What a plugin may do

A plugin contributes; it does not rewrite. It may add models, add fields to a model that allows it (`customFields` or a named extension point), add actions and views, and subscribe to hooks the tool declares. It may not change an existing field, replace an action, or reach a table directly. A tool lists the extension points it offers; anything else is closed.

This is the opposite of Odoo's in-place inheritance, which is powerful and is what makes its upgrades painful.

## 7. Dependency rules to add

- A tool imports no other tool's files.
- `bridges/` imports the public surface of tools (models and events), never their `lib/` or `actions/`.
- A tool and `@forgeron/sdk` import no provider.
- `@forgeron/harness` depends on nothing a tool runs.

## 8. Open questions

| Question                                                            | Recommendation                                                                | Issue |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----- |
| The field set of `defineModel` and how a default view is overridden | settle in a grilling session, then write into `sdk.md`                        | F-01  |
| Does `defineModel` replace the table DSL or sit on top of it        | on top: `models/` compiles to the existing schema, so migrations keep working | F-02  |
| Generated CRUD actions: on by default or opt-in                     | on by default, each replaceable by a file of the same name                    | F-02  |
| Record-level permissions: in the model or in the engine             | declared in the model, enforced by the runtime on every interface             | E-10  |
| Lint rules as an oxlint plugin or an ESLint plugin                  | depends on the state of oxlint's plugin API; see [libraries](libraries.md)    | F-06  |
