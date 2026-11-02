# Forgeron — documentation

This folder imagines the Forgeron SDK starting from concrete cases. Each example starts from a **business constraint**, derives what the SDK must offer, then shows the complete tool as a developer would write it. `sdk.md` then consolidates all the decisions into a single specification.

> Status: working proposal. API, command and file names are to be validated by the team.

## Files

- [`white-paper.md`](white-paper.md) — the vision, the product, the targets, the business model, the roadmap.
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — the plan of the monorepo that builds Forgeron: apps, packages, templates, hosting modes, tooling, delivery.
- [`DECISIONS.md`](DECISIONS.md) — the decision log, dated, with what was ruled out and why.
- [`design-system.md`](design-system.md) — the guidelines: colors, typography, logo, components. The files (tokens, fonts, logos) are in `../assets/`.

| File                                                         | Starting constraint                                         | What the example brings out                                                                                                                                                                     |
| ------------------------------------------------------------ | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`examples/01-crm.md`](examples/01-crm.md)                   | A light CRM: contacts, companies, leads, usable from Claude | Base schema, migrations (structure and data), actions, roles and access, history, React view, tests                                                                                             |
| [`examples/02-odoo-gateway.md`](examples/02-odoo-gateway.md) | Query Odoo from Claude with each person's API key           | Tool without a database, per-person secrets, Microsoft SSO, allowed outbound calls, cache, errors, partial interfaces                                                                           |
| [`examples/03-data-hub.md`](examples/03-data-hub.md)         | A business data repository fed by imports and syncs         | Files (R2), CSV import, scheduled jobs, Microsoft 365 connector, JSON columns, two-step destructive migration                                                                                   |
| [`examples/04-dashboard.md`](examples/04-dashboard.md)       | A light sales dashboard, on top of the CRM                  | React views, data hooks, composition between tools, access by view, URL parameters                                                                                                              |
| [`sdk.md`](sdk.md)                                           | —                                                           | The consolidated specification: structure, config and resources, CLI, runtime, database and migrations, interfaces, tests, build, deployment, versioning and changelog, admin MCP, npm packages |

## Shared principles

1. **An enforced shape.** All tools have the same tree. An action's name comes from its file path.
2. **One action, four interfaces.** MCP, API, CLI and Web are generated from the same declaration.
3. **Don't reinvent.** Kysely for SQL, Zod for schemas, Vitest for tests, React for views, Cloudflare for execution. Forgeron builds the shape, the migrations, the build, the permissions and the deployment.
4. **Safe by default.** No action without an access level; no secret in the code; no undeclared outbound call.
