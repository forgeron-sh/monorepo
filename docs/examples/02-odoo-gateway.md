# Example 2 — An Odoo gateway

## The constraint

The company keeps Odoo for its accounting and support, but teams want to query their tickets **from Claude**. The rules:

- each person signs in with their **Microsoft** account (company SSO);
- each person uses **their own Odoo API key**, entered once, never visible to the developer or to colleagues;
- Claude must only see what the person would see in Odoo;
- no web interface: Claude and the terminal are enough;
- Odoo is slow: reference lists (teams, stages) must be cached.

This is exactly the Odoo MCP gateway already built by hand internally. With Forgeron, it becomes a tool of a few files.

## What the constraint requires of the SDK

| Need                        | SDK answer                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------------ |
| A tool without a database   | `resources.db` absent: no database is created                                                          |
| One key per person          | `resources.userSecrets` declared in the config, collected by the platform, read with `ctx.userSecrets` |
| SSO Microsoft               | Configured at the workspace level; the tool has nothing to code                                        |
| Only call Odoo              | A list of allowed outbound hosts (`resources.network`); any other call is blocked                      |
| Expose only MCP and CLI     | `interfaces: { mcp: true, cli: true }`                                                                 |
| Cache                       | `resources.cache` and `ctx.cache` (KV), with a time-to-live                                            |
| Surface Odoo errors cleanly | `ToolError` with a code, translated for each interface                                                 |

## The file tree

```text
odoo/
├── forgeron.config.ts
├── lib/
│   └── odoo.ts                   # minimal JSON-RPC client
├── actions/
│   ├── tickets/
│   │   ├── list.ts               # → tickets.list
│   │   ├── get.ts                # → tickets.get
│   │   └── reply.ts              # → tickets.reply
│   └── teams/
│       └── list.ts               # → teams.list
├── tests/
│   └── tickets.test.ts
└── .forgeron/project.json
```

## The configuration

```ts
// forgeron.config.ts
import { defineConfig, kv } from "forgeron";

export default defineConfig({
  name: "odoo",
  title: "Odoo gateway",
  description: "Odoo support tickets, with each person's own permissions.",

  interfaces: { mcp: true, cli: true },

  resources: {
    // Tool secrets: set by the admin (forgeron secrets set ODOO_URL)
    secrets: {
      ODOO_URL: { why: "Address of the Odoo instance" },
      ODOO_DB: { why: "Name of the Odoo database" },
    },
    // Per-person secrets: requested from each person on first use
    userSecrets: {
      ODOO_API_KEY: {
        label: "Odoo API key",
        help: "Odoo › Preferences › Account Security › New API Key",
        why: "Read and reply to your tickets with your own Odoo permissions",
      },
      ODOO_LOGIN: { label: "Odoo login (email)", why: "Identify you to Odoo" },
    },
    network: { allow: ["*.odoo.com", "odoo.acme.fr"], why: "Calls to the Odoo API" },
    cache: kv(),
  },

  roles: {
    support: { label: "Support", grants: ["read", "write"] },
    reader: { label: "Read-only", grants: ["read"] },
  },
});
```

### How each person's key is collected

1. The person adds the tool's MCP server in Claude and signs in with Microsoft.
2. On their first call, the platform notices that `ODOO_API_KEY` is missing.
   - On MCP, the call returns an input request (MCP elicitation) or, if the client does not support it, a link to a platform page.
   - On the CLI, `forgeron odoo tickets list` asks for the key in the terminal, or you set it with `forgeron secrets set --user ODOO_API_KEY`.
3. The key is encrypted and tied to the person and the tool. The developer cannot read it; the admin can revoke it.

## The Odoo client

```ts
// lib/odoo.ts
import { ToolError, type Context } from "forgeron";

export function odoo(ctx: Context) {
  const url = ctx.secrets.ODOO_URL;
  const db = ctx.secrets.ODOO_DB;
  const login = ctx.userSecrets.ODOO_LOGIN;
  const key = ctx.userSecrets.ODOO_API_KEY;

  async function call<T>(model: string, method: string, args: unknown[], kwargs = {}): Promise<T> {
    const res = await ctx.fetch(`${url}/jsonrpc`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "call",
        params: {
          service: "object",
          method: "execute_kw",
          args: [db, login, key, model, method, args, kwargs],
        },
      }),
    });
    const body = await res.json();
    if (body.error) {
      const denied = /AccessDenied|AccessError/.test(body.error.data?.name ?? "");
      throw new ToolError(
        denied ? "FORBIDDEN" : "UPSTREAM",
        body.error.data?.message ?? "Odoo error",
      );
    }
    return body.result as T;
  }

  return { call };
}
```

`ctx.fetch` is a standard `fetch`, filtered by `resources.network`. Since the request uses the person's key, **Odoo enforces its own permissions**: Claude only sees what the person would see.

## Actions

```ts
// actions/tickets/list.ts
import { action, z } from "forgeron";
import { odoo } from "../../lib/odoo";

export default action({
  description: "Lists Odoo support tickets, by default those assigned to me.",
  access: "read",
  input: z.object({
    mine: z.boolean().default(true).describe("Only my tickets"),
    stage: z.string().optional().describe('Stage name, e.g. "In progress"'),
    limit: z.number().int().max(100).default(20),
  }),
  // forgeron odoo tickets list --mine --stage "In progress"
  async run(ctx) {
    const { input } = ctx;
    const domain: unknown[] = [];
    if (input.mine) domain.push(["user_id.login", "=", ctx.userSecrets.ODOO_LOGIN]);
    if (input.stage) domain.push(["stage_id.name", "=", input.stage]);
    return odoo(ctx).call("helpdesk.ticket", "search_read", [domain], {
      fields: ["id", "name", "stage_id", "partner_id", "priority", "create_date"],
      limit: input.limit,
      order: "create_date desc",
    });
  },
});
```

```ts
// actions/teams/list.ts — cached for one hour, shared by everyone
export default action({
  description: "Lists the Odoo support teams.",
  access: "read",
  input: z.object({}),
  async run(ctx) {
    return ctx.cache.getOrSet("teams", { ttl: "1h", scope: "tool" }, () =>
      odoo(ctx).call("helpdesk.team", "search_read", [[]], { fields: ["id", "name"] }),
    );
  },
});
```

`scope: "tool"` shares the cache across users (reference data); `scope: "user"` (the default) keeps it separate for each person, so that data read with one person's key is never exposed to someone else.

```ts
// actions/tickets/reply.ts
export default action({
  description: "Adds a customer-visible reply to a ticket.",
  access: "write",
  confirm: true,
  input: z.object({ id: z.number().int(), message: z.string().min(1) }),
  cli: { args: ["id", "message"] },
  async run(ctx) {
    await odoo(ctx).call("helpdesk.ticket", "message_post", [[ctx.input.id]], {
      body: ctx.input.message,
      message_type: "comment",
      subtype_xmlid: "mail.mt_comment",
    });
    return { ok: true };
  },
});
```

## Tests

```ts
// tests/tickets.test.ts
import { it, expect } from "vitest";
import { createTestTool, mockFetch } from "forgeron/testing";

it("translates an Odoo denial into FORBIDDEN", async () => {
  const tool = await createTestTool({
    secrets: { ODOO_URL: "https://acme.odoo.com", ODOO_DB: "acme" },
    as: { roles: ["support"], userSecrets: { ODOO_LOGIN: "ely@acme.fr", ODOO_API_KEY: "test" } },
    fetch: mockFetch({
      "POST https://acme.odoo.com/jsonrpc": {
        error: { data: { name: "odoo.exceptions.AccessError", message: "Access denied" } },
      },
    }),
  });
  await expect(tool.call("tickets.list", {})).rejects.toMatchObject({ code: "FORBIDDEN" });
});
```

## What users see

| Interface    | Example                                                          |
| ------------ | ---------------------------------------------------------------- |
| Claude (MCP) | "Which urgent tickets are assigned to me?" → `odoo_tickets_list` |
| CLI          | `forgeron odoo tickets list --stage "In progress" --json`        |
| API, Web     | not exposed (`interfaces`)                                       |

## What the example decides for the SDK

- A tool can have **neither a database nor a view**: the config declares what exists.
- Two levels of secrets: tool-level (`secrets`) and person-level (`userSecrets`), with a collection flow handled by the platform on every interface.
- Outbound calls are **forbidden by default**; `resources.network.allow` lists the allowed hosts, with a `why` shown to the admin.
- `ctx.cache` is per-person by default, to avoid leaks between users.
- Errors go through `ToolError` and shared codes: `NOT_FOUND`, `FORBIDDEN`, `INVALID`, `CONFLICT`, `UPSTREAM`, `RATE_LIMITED`.
- Shared code lives in `lib/`, outside `actions/`, and is not exposed.
