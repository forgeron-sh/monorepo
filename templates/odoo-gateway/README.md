# Odoo gateway

Odoo support tickets from Claude, with each person's own permissions.

## What it does

- Lists your tickets, opens one, and replies to the customer.
- Lists the support teams.
- Each call carries **your** Odoo API key, so Odoo decides what you may see and do.

## How to use it

- The first time, you are asked for your Odoo login and your Odoo API key; they are kept for you only.
- In Claude: "my open tickets", "show ticket 12345", "reply to ticket 12345 that the part ships Monday". A reply asks for your confirmation before it is sent.
- In a terminal: `forgeron odoo tickets list`.

## Permissions

| Role      | May                               |
| --------- | --------------------------------- |
| `reader`  | List and read tickets and teams   |
| `support` | The same, and reply to a customer |

The tool is available in Claude and in the command line only.

## For developers

This is the template `odoo-gateway`.

Query Odoo from Claude with each person's API key.

Specification: [`docs/examples/02-odoo-gateway.md`](../../docs/examples/02-odoo-gateway.md). This folder follows the mandatory shape of a tool (`docs/sdk.md` §2).

| Action          | Access  | What it does                                           |
| --------------- | ------- | ------------------------------------------------------ |
| `tickets.list`  | `read`  | Lists tickets, by default those assigned to the caller |
| `tickets.get`   | `read`  | Gets one ticket by number                              |
| `tickets.reply` | `write` | Adds a customer-visible reply (asks for confirmation)  |
| `teams.list`    | `read`  | Lists the support teams, cached for one hour           |

Exposed on MCP and the CLI only (`interfaces`). Each call carries the person's own Odoo key, so Odoo enforces its own permissions.

### Tests

The Odoo upstream is simulated with `mockFetch`: no real secret is needed. `createTestTool` runs the tool **as built** (`.forgeron/build/`), so `bun run test` at the root builds the templates first (`scripts/build-templates.ts`).

```bash
bun run test
```

`tests/interfaces.test.ts` is a local MCP client: it lists the tools and calls them over `POST /mcp`, the way Claude does.

### Notes

- Version: carried by `package.json`, changed only by `forgeron release` (D-007).
- Serves as an SDK integration test: it must compile, pass its tests and deploy to preview on every PR.
- Only uses the public API (`@forgeron/sdk`, `@forgeron/ui`, connectors).
- Not yet: collecting the per-person secrets (FOR-95), reading tool secrets from the environment (FOR-98) and `forgeron dev` (FOR-11). Until then, secrets are given by the test platform.
