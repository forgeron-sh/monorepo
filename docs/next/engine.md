# Target — the engine

> Status: proposal (21 November 2026). The engine is what coordinates tools: who may use what, how tools reach one another, what is spent. Today it is `apps/gateway` with `registry`, `platform-contract` and `hosting`.

## 1. What the engine owns

| Area            | Owns                                                               | Today                                         | Target                                           |
| --------------- | ------------------------------------------------------------------ | --------------------------------------------- | ------------------------------------------------ |
| Identity        | people, sign-in, sessions, tokens                                  | done (OIDC, SAML, OAuth 2.1, audience tokens) | storage moved onto contracts so it runs on Anvil |
| Access          | teams, permissions, which team may use which tool and action       | done (D-137)                                  | plus record-level rules declared by models       |
| Registry        | tools, builds, versions, channels, approvals                       | done, D1-shaped                               | on the `database` contract                       |
| Dispatch        | a request reaches the right tool, channel and interface            | done (dispatch namespace or service binding)  | a third path: Anvil's router                     |
| Secrets         | one vault, application and personal                                | done (sealed, D-105 to D-111)                 | unchanged                                        |
| Audit           | who did what                                                       | done                                          | unchanged                                        |
| Bridges         | events, links, syncs between tools                                 | calls only (`uses`)                           | new: section 3                                   |
| Metering        | what each team, tool and person consumes                           | a call counter (D-093)                        | new: section 4                                   |
| AI gateway      | every model call, its key, its budget                              | nothing                                       | new: section 5                                   |
| Record services | activity, attachments, search, custom fields, sequences, documents | nothing                                       | new: section 6                                   |
| Shell           | the workspace's own screens                                        | `apps/console`, deleted                       | new: `apps/shell`, section 7                     |

## 2. The engine runs on contracts

The gateway and the registry stop reading Cloudflare bindings. They take the same contracts a tool takes, from a provider chosen at start. This is what lets the whole platform, not only the tools, run on Anvil.

What has to move, from the audit of the code:

| Piece           | Cloudflare-specific today                                 | Becomes                                                                  |
| --------------- | --------------------------------------------------------- | ------------------------------------------------------------------------ |
| Registry        | Kysely on D1, D1 Time Travel for restore points           | `database`; restore points are a provider capability                     |
| OAuth provider  | `@cloudflare/workers-oauth-provider`, state in KV         | a portable implementation over `kv`; choice in [libraries](libraries.md) |
| Registry cache  | KV                                                        | `kv`                                                                     |
| Realtime        | one Durable Object, `REALTIME`                            | `realtime`                                                               |
| Tool deployment | Cloudflare REST API, dispatch namespace, service bindings | `hosting` modes: `cloud`, `self-host`, `anvil`                           |
| Self-update     | redeploys the gateway Worker (D-138)                      | on Anvil: the binary's own update                                        |

This is the least known part of the plan and has its own spike (issue A-06).

## 3. Bridges

Three ways for tools to connect. None gives a tool access to another's tables.

### Calls — exists

`uses: { crm: "^1.4.0" }` and `ctx.tools.crm.call("deals.list", input)`. Typed, run as the caller.

### Events — new

```ts
// tools/crm/events/deal-won.ts
export default defineEvent({
  name: "deal.won",
  version: 1,
  payload: z.object({ dealId: id("crm.deal"), amount: money() }),
});

// tools/invoices/events/on-deal-won.ts
export default on("crm:deal.won", async ({ event, ctx }) => {
  /* draft an invoice */
});
```

- Written to an **outbox** in the publisher's database, in the same atomic batch as the change that caused it. A dispatcher delivers it through the `queue` contract.
- At-least-once, unordered. Every delivery carries an idempotency key; the handler helper deduplicates on it.
- A subscriber runs with the tool's identity, which must hold a profile in the publisher.
- Changing a payload incompatibly is a new version; the build refuses to drop a version a deployed subscriber still uses.

### Links — new

```ts
// bridges/deal-invoice.link.ts
export default defineLink({
  from: crm.deal,
  to: invoices.invoice,
  kind: "one-to-many",
  as: { from: "invoices", to: "deal" },
  onDelete: "unlink",
});
```

- The link table belongs to the engine, not to either tool. Neither tool holds a foreign key. (Medusa's model.)
- A read that crosses a link asks each side for what the reader may see; a link never reveals a record its reader cannot open.
- A deleted record leaves no dangling link: `onDelete` is `unlink`, `restrict` or `cascade`, enforced by the engine through the event the deletion emits.

### Syncs — new

A sync is a bridge to an outside system, declared with: the direction (in, out, both), the field mapping, the conflict policy, the idempotency key, a rate budget, and a dry run that reports what it would change. Two-way syncs mark their own writes so they do not echo.

## 4. Metering and budgets

One event per consumption: who (person, team), what (tool, action), which resource (compute, storage, AI), how much, in one unit. The pricing page calls the unit Fuel.

- Events are written by the runtime and the AI gateway, never by tool code.
- A budget is a limit on a scope (workspace, team, tool, person) and a window (day, month). When a budget is spent the call is refused with a stable error; when spend cannot be checked the call is refused too.
- The same events feed the usage screens and, on Forgeron Cloud, the invoice.

## 5. The AI gateway

Every model call goes through it: `ctx.ai` from a tool, and people's own agents with a key the gateway mints.

| Function  | Rule                                                                                         |
| --------- | -------------------------------------------------------------------------------------------- |
| Keys      | minted per team and tool, or per person; revocable; never the provider's key                 |
| Models    | allow-lists as named groups; a tool asks for a capability (`chat`, `embed`), a group maps it |
| Budgets   | section 4; checked before the call from an estimate, settled after from the real usage       |
| Providers | the workspace's own keys, or ours on Forgeron Cloud; failover in a declared order            |
| Logs      | per workspace: off, metadata only, or full; personal data masked when full                   |
| Interface | provider-neutral chat and embeddings, streaming; an OpenAI-compatible endpoint for agents    |

Two backends behind one interface. On Cloudflare, AI Gateway carries routing, caching, logs and key storage. On Anvil, a small proxy does the same from the binary. Keys, budgets and permissions stay in the engine on both: they are the product, and they must behave the same everywhere.

## 6. Record services

Services a model turns on (`services: { activity: true, … }`, see [framework](framework.md)). They live in `@forgeron/kernel` and are served by the engine, so every tool's records behave alike and the shell can show them alike.

| Service        | Gives a record                                               | Built on                         |
| -------------- | ------------------------------------------------------------ | -------------------------------- |
| Activity       | a timeline: changes, comments, mentions, what a bridge did   | `database`, events               |
| Attachments    | files                                                        | `blob`                           |
| Search         | full text, across tools, filtered by what the reader may see | `database` (FTS), later `search` |
| Custom fields  | fields an admin adds without code                            | `database`                       |
| Sequences      | gapless numbering (`INV-2026-0042`)                          | `database`                       |
| Documents      | a PDF from a template                                        | `blob`                           |
| Import, export | CSV in and out                                               | `blob`, `queue`                  |

Shared entities are not kernel. **Contacts** (people and organisations) is a tool; others link to it.

## 6b. Observability

What happened in a tool, for the person who has to fix it. Usage (section 4) says how much; observability says what and why.

| Signal        | Scope                         | Today                                  |
| ------------- | ----------------------------- | -------------------------------------- |
| Calls         | per tool, action, interface   | counted (D-093)                        |
| Time per call | per step of the call path     | measured, in a response header (D-142) |
| Errors        | per tool and channel          | not collected                          |
| Logs          | per tool and channel          | not collected                          |
| Traces        | across a bridge, tool to tool | not collected                          |

- A tool writes nothing special: the runtime records calls, timings and errors, and captures what the tool logs.
- It is a contract (`observability`, wave 2), so the shell reads the same shape on both platforms: Cloudflare's own observability on one side, Anvil's store on the other, with an OpenTelemetry export for teams that have their own stack.
- A trace follows a call through a bridge, so a failure in one tool caused by another can be read in one place.
- Retention is a setting of the workspace; logs may hold personal data and follow the same policy as the AI gateway's.

## 7. The shell

`apps/shell` replaces the console. Its reference is `docs/prototypes/console-home.html`.

- **For everyone**: the tools they may use, an inbox (requests for a secret, an approval, a build to look at), search across tools.
- **For admins**: members and teams, access by team and action, the vault, usage and budgets, observability (calls, time per call, errors, logs), bridges, the audit log, the catalog with Add and Fork ([distribution](distribution.md)), sign-in and domains.
- Built on `@forgeron/ui`, served by the gateway, talking to the platform API through `@forgeron/platform-contract`, which stays.
- Every admin action stays available in the admin MCP and the CLI. The shell is one of three doors, never the only one.

Until the shell exists, the gateway serves a placeholder and administration goes through the MCP and the CLI.

## 8. Packages

| Package                | Depends on                               | Never imports           |
| ---------------------- | ---------------------------------------- | ----------------------- |
| `@forgeron/bridges`    | `contracts`, `manifest`, `permissions`   | the gateway, a provider |
| `@forgeron/metering`   | `contracts`, `permissions`               | the gateway, a provider |
| `@forgeron/ai-gateway` | `contracts`, `metering`, `permissions`   | the gateway             |
| `@forgeron/kernel`     | `contracts`, `permissions`               | the gateway, a provider |
| `apps/gateway`         | all of the above, `registry`, `hosting`  | another app             |
| `apps/shell`           | `ui`, `platform-contract`, `permissions` | the gateway's source    |
