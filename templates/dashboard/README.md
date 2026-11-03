# Template `dashboard`

One sales page for the Monday meeting, computed from the CRM without copying its data.

Specification: [`docs/examples/04-dashboard.md`](../../docs/examples/04-dashboard.md). This folder follows the mandatory shape of a tool (`docs/sdk.md` §2).

| Action          | Access | What it does                                                               |
| --------------- | ------ | -------------------------------------------------------------------------- |
| `sales.summary` | `read` | Count and amount of leads by stage, amount won since a date (1st of month) |
| `sales.stale`   | `read` | Open leads with no activity for `days` (30 by default), the oldest first   |
| `sales.owners`  | `read` | Salespeople who own leads, for the filter                                  |

`views/monday.tsx` is listed in the manifest at `/monday` and restricted to the `management` role (a level specific to this tool, granted only by that role): amount won this month, leads by stage, leads with no activity for 30 days. The filter is the `owner` parameter of the URL (`/monday?owner=ely@acme.fr`), so a link shares it. The same figures are the actions above, so Claude (`dashboard_sales_summary`) and the CLI get them too.

The dashboard has no database. Every figure is read from the CRM with `ctx.tools.crm.call("deals.list", …)`, which runs with the person's identity: if the CRM refuses them, the action fails and nothing is shown.

## What it expects of the CRM

The `crm` template is not changed by this template. `deals.list` must return `updated_at` on each lead, which it does not yet: until it does, the actions fail with `UPSTREAM` and say why rather than computing wrong figures.

## Differences from the example

- `uses: { crm: "^0.0.0" }`: the CRM template is at 0.0.0; the example's `^1.4.0` cannot be satisfied.
- No `crm.users.list` in the CRM: `sales.owners` derives the salespeople from the leads.
- The view is built by `forgeron build` and listed in the manifest. The runtime does not serve the page itself yet (only `/_f/call/<action>` for its calls), so the page is rendered in tests, not opened in a browser.
- `@forgeron/ui` `Stat` and `BarChart` take a formatted `value` and `title`, not `format="currency"` / `x` / `y`.

## Tests

```bash
bun run test
```

The CRM is simulated by stubs of `deals.list`; the clock is frozen with `now`.
