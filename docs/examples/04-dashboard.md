# Example 4 — A sales dashboard

## The constraint

Sales management does not want a BI tool. It wants **one page** for the Monday meeting:

- the amount of leads by stage, and what was won this month;
- a filter by salesperson, shareable by link;
- leads with no activity for 30 days;
- the same figures **available by asking Claude** ("How much did we win this month?").

The data is already in the CRM ([example 1](01-crm.md)). The dashboard must **not copy** that data or bypass its permissions.

## What the constraint requires of the SDK

| Need                            | SDK answer                                                                              |
| ------------------------------- | --------------------------------------------------------------------------------------- |
| Reuse another tool's data       | `uses` in the config and `ctx.tools.<name>.call(...)`: one tool calls another's actions |
| Respect permissions             | Calls between tools are made **with the person's identity**: no hidden superuser        |
| Compute metrics                 | Aggregation actions in the dashboard tool, also exposed to Claude                       |
| A lightweight page              | A React view, with hooks and chart components                                           |
| A shareable filter              | View parameters bound to the URL (`params`)                                             |
| Restrict the page to management | `access` on the view, as on an action                                                   |

## The file tree

```text
dashboard/
├── forgeron.config.ts
├── actions/
│   └── sales/
│       ├── summary.ts         # → sales.summary
│       └── stale.ts           # → sales.stale
├── views/
│   └── monday.tsx             # → /monday
└── tests/
```

## The configuration

```ts
// forgeron.config.ts
import { defineConfig } from "forgeron";

export default defineConfig({
  name: "dashboard",
  title: "Sales dashboard",
  interfaces: { mcp: true, web: true, cli: true },

  // Dependencies: the tool calls the actions of these tools, with a minimum version
  uses: { crm: "^1.4.0" },

  roles: {
    management: { label: "Management", grants: ["read"] },
  },
});
```

`uses` serves three purposes: generating the types of the CRM's actions, refusing a deployment if the CRM version in production is incompatible, and displaying the dependency in the console.

## Actions

```ts
// actions/sales/summary.ts
import { action, z } from "forgeron";

export default action({
  description: "Lead amount by stage and amount won over a period.",
  access: "read",
  input: z.object({
    owner: z.string().email().optional().describe("Limit to one salesperson"),
    since: z
      .string()
      .date()
      .optional()
      .describe("Start of period, defaults to the 1st of the month"),
  }),
  async run({ input, tools, now }) {
    const since = input.since ?? now().startOf("month").toISODate();
    const deals = await tools.crm.call("deals.list", { owner: input.owner });

    const byStage = Object.groupBy(deals, (d) => d.stage);
    const totals = Object.entries(byStage).map(([stage, ds]) => ({
      stage,
      count: ds!.length,
      amount: ds!.reduce((s, d) => s + (d.amount ?? 0), 0),
    }));
    const won = deals
      .filter((d) => d.stage === "won" && d.updated_at >= since)
      .reduce((s, d) => s + (d.amount ?? 0), 0);

    return { since, totals, won };
  },
});
```

`tools.crm.call("deals.list", …)` is typed from the CRM's manifest. The call goes through the platform with **the person's identity**: if they have no access to `deals.list` in the CRM, the dashboard fails with `FORBIDDEN`, showing nothing.

`now()` is the clock provided by the context: it respects the workspace time zone and is frozen in tests.

## The view

```tsx
// views/monday.tsx
import { defineView, useAction, useParams } from "forgeron/react";
import { Page, Stat, BarChart, Table, Select } from "@forgeron/ui";
import { z } from "forgeron";

export default defineView({
  title: "Monday meeting",
  path: "/monday",
  access: "read",
  params: z.object({ owner: z.string().email().optional() }), // ?owner=… in the URL

  component() {
    const [params, setParams] = useParams();
    const summary = useAction("sales.summary", { owner: params.owner });
    const stale = useAction("sales.stale", { owner: params.owner, days: 30 });
    const owners = useAction("crm.users.list", {}); // action of a tool declared in uses

    return (
      <Page
        title="Monday meeting"
        actions={
          <Select
            label="Salesperson"
            value={params.owner}
            options={owners.data}
            onChange={(owner) => setParams({ owner })}
          />
        }
      >
        <Stat label="Won this month" value={summary.data?.won} format="currency" />
        <BarChart data={summary.data?.totals} x="stage" y="amount" />
        <Table
          title="No activity for 30 days"
          rows={stale.data?.items}
          columns={["title", "company", "owner_email", "updated_at"]}
        />
      </Page>
    );
  },
});
```

- `useAction` handles loading, errors and refreshing; `useMutation` is for writes ([example 1](01-crm.md)).
- `@forgeron/ui` follows the Forgeron design system (black and white, sharp corners). Using it is recommended, not required: any React component works.
- The page is served at `https://acme.forgeron.app/t/dashboard/monday?owner=ely@acme.fr`, behind SSO.

## What users see

| Interface    | Example                                                       |
| ------------ | ------------------------------------------------------------- |
| Web          | the `/monday` page, filtered by link                          |
| Claude (MCP) | "How much did we win this month?" → `dashboard_sales_summary` |
| CLI          | `forgeron dashboard sales summary --owner ely@acme.fr --json` |

## What the example decides for the SDK

- Tools **compose**: `uses` declares a versioned dependency, `ctx.tools` calls another tool's actions, with the person's permissions.
- A view is declared like an action: `path`, `access`, `params` validated by Zod.
- Metrics are **actions**, so they are also available to Claude and the CLI: the view has no hidden logic.
- `ctx.now()` provides a controllable clock.
- `@forgeron/ui` is an optional component library, aligned with the design system.
