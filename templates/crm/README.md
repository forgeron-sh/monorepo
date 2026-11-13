# CRM

Companies, contacts and sales leads of the team, in one place you can ask Claude about.

## What it does

- Keeps the companies, the contacts and the leads (deals) of the sales team.
- Moves a lead from one stage to another and remembers who moved it, from where, to where.
- Answers from Claude, the API and the command line, with the same rules.

## How to use it

- In Claude, ask for what you need: "list the leads in negotiation", "find the contacts of Acme", "move this lead to won". Connect the tool first (see **Connect** on this page).
- In a terminal: `forgeron crm deals list`, `forgeron crm contacts search "Durand"`.
- Deleting a lead asks for a confirmation.

## Permissions

| Profile      | May                                |
| ------------ | ---------------------------------- |
| `support`    | Read companies, contacts and leads |
| `sales`      | Read, create and update            |
| `management` | The same, and delete a lead        |

Whoever gives access can change these for everyone or for a team in the tool's Access tab. If you cannot use the tool, ask them to give your team a profile.

## For developers

This is the template `crm`.

Companies, contacts and leads, usable from Claude.

Specification: [`docs/examples/01-crm.md`](../../docs/examples/01-crm.md). This folder follows the mandatory shape of a tool (`docs/sdk.md` §2). It is the integration test of the database layer: schema, migrations, typed `ctx.db`, events and profiles.

| Action             | Access   | What it does                                               |
| ------------------ | -------- | ---------------------------------------------------------- |
| `companies.list`   | `read`   | Lists companies, filtered on name or domain                |
| `companies.upsert` | `write`  | Creates a company, or updates the one with the same domain |
| `contacts.search`  | `read`   | Searches by last name, first name, email or company        |
| `contacts.create`  | `write`  | Creates a contact (`CONFLICT` if the email is taken)       |
| `contacts.update`  | `write`  | Updates only the fields given; `null` clears one           |
| `deals.list`       | `read`   | Lists leads with their company, by stage or owner          |
| `deals.create`     | `write`  | Creates a lead in the first stage                          |
| `deals.move`       | `write`  | Moves a lead to another stage and emits `deal.moved`       |
| `deals.delete`     | `delete` | Deletes a lead and its history (asks for confirmation)     |

`events/deal-history.ts` handles `deal.moved` and writes who moved the lead, from where, to where, into `deal_events`. Profiles: `sales` read and write, `support` read only, `management` also delete.

`deals.create` and `contacts.create` are not in the example, which assumes a seed (`db/seed.ts`, not available yet): without them nothing could be created.

### Tests

```bash
bun run test
```

`createTestTool` runs the tool **as built** on an in-memory database with the tables of the schema, so the root `bun run test` builds the templates first (`scripts/build-templates.ts`). The Odoo upstream of other templates is simulated; this one needs none.

### Types

`ctx.db` is a `Kysely<DB>` typed by `db/schema.ts`: a column that does not exist, a required field left out or a stage that is not in the pipeline are type errors. The types come from `.forgeron/generated/db.d.ts`, which `forgeron build` writes and git ignores, so `moon run crm:typecheck` builds first.

### Notes

- Migrations: `forgeron db generate` after a change of `db/schema.ts` (D-014: a rename is a drop and an add).
- Version: carried by `package.json`, changed only by `forgeron release` (D-007).
- Serves as an SDK integration test: it must compile, pass its tests and deploy to preview on every PR.
- Only uses the public API (`@forgeron/sdk`, `@forgeron/ui`, connectors).
- Not here: the pipeline view (FOR-56, FOR-59), the seed (FOR-116).
