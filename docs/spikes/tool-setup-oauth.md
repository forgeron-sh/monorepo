# Spike FOR-171: tool setup during the OAuth connection

Project "Identity, access and usage log". Written 2026-11-09. Documentation only: no code was changed and
nothing was run against Cloudflare or a real MCP client. The owner's direction (oral, 2026-11-07, as quoted in
the ticket) is taken as the brief; where it leaves a choice open, this report recommends one and marks it
**Decision for the owner**.

## Verdict

1. **Yes: let a tool declare a `setup`, and ask for it on the web at the moment a person connects.** One
   declaration (`setup` in `forgeron.config.ts`) lists what a person must give before using the tool: plain
   fields (first name, last name, a team), secret fields (an Odoo API key) and the delegated connectors the
   tool already declares. The OAuth authorization step shows it, validates it, stores it, and only then asks
   the person to allow the connection.
2. **It replaces the first-use page, not the secrets model.** `/t/<tool>/secrets` becomes `/t/<tool>/setup`
   (the old path stays as an alias), the `428` and the MCP URL elicitation point at it, and
   `resources.userSecrets` stays valid as shorthand for secret fields. The sealed storage of D-036 and the
   connector consent of D-046 are kept and are not rewritten.
3. **A prerequisite is missing in the code, and it is the first ticket.** D-094 serves OAuth for the
   workspace's admin MCP at `/mcp` only. A person connecting Claude to `/t/odoo/mcp`, which is the Odoo
   gateway's use, still cannot sign in with OAuth: D-035 says tool MCP tokens are `fgt` tokens from
   `POST /auth/token`, and the gateway's tool path refuses any scoped token. Setup at connection time needs
   OAuth for tool resources first.
4. **The CLI prompt goes.** The owner wants the web as the single place. `promptUserSecrets` and the hidden
   prompt of `forgeron secrets set --user` (D-036) are removed; the CLI prints the setup link.
5. **Proxy mode (FOR-172) stays a separate decision**, but this design leaves it a hook: where a secret is
   kept after the page (sealed in the platform D1, or carried by the token) is a property of the field, not
   of the page.

## Question

A tool can need, per person, something before it works: today only secrets (`resources.userSecrets`, asked
after a `428`, D-036) and connector consent (D-046, same shape). The owner wants these asked when the person
connects a client to the tool, on the web only, with the tool declaring what it needs and each interface free
to draw and run it. How is that declared, where is it stored, how does the OAuth step show and check it, and
what does it change in `docs/sdk.md` §10?

## Method

Read: `docs/sdk.md` §10 (secrets, connectors), D-013, D-035, D-036, D-046, D-048, D-079, D-082, D-084, D-094;
`apps/gateway/src/dispatch/user-secrets.ts` (the page and the header), `identity/mcp-oauth/mcp-oauth.ts`
(D-094), `identity/authn/caller.ts`, `packages/runtime/src/engine.ts` (the `428`), the Odoo template's
`forgeron.config.ts`, and the views spike (`docs/spikes/react-views-sandbox.md`). Linear: FOR-171, FOR-172,
FOR-26 read on 2026-11-09. Everything below about the code is read, not run.

## What exists today

| Piece                               | Where                                   | What it does                                                                                            |
| ----------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `resources.userSecrets`             | manifest, `diff.ts`                     | Names, labels and reasons of per-person secrets; a new one is a `minor` change needing approval         |
| `/t/<tool>/secrets`                 | `dispatch/user-secrets.ts`              | Page, JSON route for the CLI, sealed storage `user_secrets` keyed by tool, person, name                 |
| `428 SECRET_REQUIRED` + elicitation | `runtime/engine.ts`, `mcp.ts`           | A call with a missing secret or consent fails with a link; MCP 2025-11-25 clients get `-32042` URL mode |
| Delegated connector consent         | `dispatch/connector-tokens.ts`          | Same shape: header with the caller's token, or a link to the consent route                              |
| CLI prompt                          | `apps/cli/.../user-secrets.ts`          | Hidden prompt on a `428`, and `forgeron secrets set --user`                                             |
| OAuth for MCP clients               | `identity/mcp-oauth/` (D-094)           | Admin MCP only: audience `<workspace>/platform`, scope `mcp`                                            |
| Tool MCP tokens                     | `POST /auth/token`, `forward()` (D-035) | `fgt` tokens for `<workspace>/<tool>`, no scope, made by a signed-in person; no OAuth                   |

Two facts shape the proposal. First, a person is asked **after** a failed call, which is a bad first
impression and, over MCP, depends on the client showing a link. Second, the page and the stored values are
**per tool, not per environment** (FOR-174 settled this on 2026-11-09), so a setup has no environment.

## Proposal

### 1. The declaration

A new optional key, beside `resources`, because it is about the person and not about a resource the platform
provisions:

```ts
setup: {
  fields: {
    firstName: field.text({ label: "First name", required: true }),
    lastName:  field.text({ label: "Last name", required: true }),
    team:      field.choice({ label: "Team", options: ["support", "sales"] }),
    ODOO_LOGIN:   field.secret({ label: "Odoo login (email)", why: "Identify you to Odoo" }),
    ODOO_API_KEY: field.secret({ label: "Odoo API key", help: "Odoo › Preferences › Account Security", why: "…" }),
  },
  check: "setup.check",   // optional: an action that validates the values (see 3)
}
```

- `field.text`, `field.choice` are plain values; `field.secret` is today's `userSecrets` entry. A tool with
  only `resources.userSecrets` keeps working: the manifest reads it as `setup.fields` of type secret.
- Delegated connectors need no new key: the connectors the tool already declares in `resources.connectors`
  appear in the setup as steps ("Connect Microsoft 365"), using the consent route of D-046.
- The manifest diff treats a new required field like a new per-person secret: `minor`, shown to the admin
  as a request. `why` stays mandatory for a secret, as today.
- A required field makes `ctx.user.setup.<name>` (plain) and `ctx.userSecrets.<NAME>` (secret) available and
  non-empty in every action, or the call does not start.

### 2. Where it is stored

- **Secret fields**: unchanged, `user_secrets`, sealed (D-036).
- **Plain fields**: a new table `user_setup` (tool, person, name, value, updated at), **not sealed**. They are
  not secrets, an administrator needs them to support the person (a first name, a team), and the tool gets
  them in a header `x-forgeron-user-setup` that only the gateway sets, exactly as it does for
  `x-forgeron-user-secrets`. They are personal data: they are removed when the person is removed from the
  workspace, and the admin can list and clear them as they can for secrets today.
- No value of either kind is ever in a log, an audit line or a route's answer to anyone but the person (the
  page shows a plain field's value to its owner, a secret as "set").

### 3. The check

A setup often needs more than a type check: is this Odoo key real? The tool declares an optional `check`
action. The gateway calls it through the normal runtime path with the submitted values passed for that call
only (the header of the secrets, extended) and stores them **only if it answers ok**. A failure comes back as
a message per field, shown on the page. The action is internal: not on MCP, CLI or API, and it has no access
level of its own that a person could call.

### 4. How the OAuth step shows it

`/oauth/authorize` (D-094) gains a tool resource: `resource=https://<workspace>.<domain>/t/<tool>/mcp`.

1. The person signs in (session), as today.
2. If the tool's setup is incomplete for them (a required field absent, a connector without consent), the
   page is the setup page: the generated form, then the connector steps, in order. Submitting runs the check.
3. Then the existing consent click: "Allow Claude to use _Odoo gateway_ as you".
4. The code and the tokens are bound to `<workspace>/<tool>` with the `mcp` scope: good on that tool's `/mcp`
   and nowhere else, one hour, renewed by the rotating refresh token, as D-094.

The same page is what the `428` and the MCP URL elicitation link to, at `/t/<tool>/setup`, for what OAuth
cannot cover: a person who connected before a field was added, an API or CLI caller, a refresh that finds a
new required field. A refresh does not show a page: the next call answers `428` with the link.

### 5. Which interface draws it

The web page is generated from the declaration (a form, then the connector steps). A tool may later replace
the form with a React view: the views spike keeps the CSP sandbox and the `_f/call` token, so such a view
would post to a platform route with a short token, never read the session. That is a later ticket and is not
needed for Odoo. The CLI and the MCP do not collect anything: they print or return the link.

## Relation to what exists, and what it replaces

| Today                                              | After                                                                                                                                   |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `/t/<tool>/secrets` page and JSON route            | `/t/<tool>/setup`; `/secrets` stays an alias for a while; the JSON route is kept for scripts only if the owner says so (see decision 2) |
| CLI hidden prompt on a `428`, `secrets set --user` | Removed; the CLI prints the link                                                                                                        |
| `-32042` URL elicitation to `/secrets`             | Same mechanism, link to `/setup`; rarely reached, since OAuth asks first                                                                |
| `resources.userSecrets`                            | Kept, read as secret fields of `setup`                                                                                                  |
| Connector consent route (D-046)                    | Kept; shown as a step of the setup page                                                                                                 |
| Sealed `user_secrets` (D-036)                      | Kept                                                                                                                                    |
| MCP tokens for tools from `POST /auth/token`       | Kept for the CLI and API; MCP clients get OAuth tokens (`mcp` scope)                                                                    |

## Decisions for the owner

1. **Is the web really the only place?** Recommended: yes, as you said. It removes the CLI prompt and the
   `forgeron secrets set --user` command (D-036 would be amended). Alternative: keep the CLI path for
   scripts and CI. It costs one command and one route and a second place to maintain; it is the only way to
   set a per-person secret without a browser, which a headless CI could need.
2. **Are plain fields stored in clear?** Recommended: yes, and visible to the person and to admins. The
   alternative is sealing everything as a secret, which hides a first name from the admin who supports the
   person and from the tool's own logs of who did what.
3. **Does the tool get a `check` action?** Recommended: yes, optional. Without it nothing proves that an Odoo
   key works until the first call fails. The cost is that the check sees the plaintext values for one call
   (as `ctx.userSecrets` does in every call today).
4. **Per-tool OAuth first.** Recommended: ticket 1 below before anything else; without it this design has no
   entry point.
5. **Setup is per tool and per person, never per environment.** Recommended: keep it so (FOR-174's answer).
   A tool whose preview needs a different Odoo instance than production would need an environment-level
   secret (`resources.secrets`), which already exists.

## Proposed Linear tickets (not created)

1. **OAuth for tool resources.** Serve `/.well-known/oauth-protected-resource/t/<tool>/mcp`; accept
   `resource=…/t/<tool>/mcp` at `/oauth/authorize`; issue tokens for `<workspace>/<tool>` with the `mcp` scope;
   make the tool path (`forward`, `identify`) accept that scope on `/mcp` and nowhere else; a token for one
   tool stays useless on another. Tests through the whole gateway, as `gateway-mcp-oauth.test.ts`.
2. **The `setup` declaration.** Manifest schema and diff, the SDK's `field.*` helpers, `userSecrets` as
   shorthand, the compiler, `sdk.md` §10, the Odoo template moved to it. Type tests.
3. **Plain per-person values.** Migration `user_setup`, store, header `x-forgeron-user-setup`, runtime
   `ctx.user.setup`, deletion when a member is removed, admin list and clear routes.
4. **The setup page.** `/t/<tool>/setup` generated from the declaration, with the connector steps; alias of
   `/secrets`; the `428` and the elicitation point at it.
5. **The OAuth step runs the setup.** `/oauth/authorize` for a tool resource shows the setup before the
   consent click when it is incomplete.
6. **The `check` action.** Runtime path with values for one call, per-field messages, store on success only.
7. **Remove the CLI prompt** (if decision 1 is yes): `promptUserSecrets`, `secrets set --user`; the CLI
   prints the link. Amend D-036.
8. **A React setup view** (later, after the views are served and sandboxed).
9. **FOR-172's spike** reads this report: it decides where a secret lives after the page.

Tickets 1 to 5 are the minimum for the Odoo gateway (FOR-26) to be onboarded at connection.

## Risks

- **Personal data.** A first and last name per person is personal data of the workspace's people. It is
  deleted with the member, listed and clearable by an admin, and never in the audit log; the retention and
  the information to give people are the customer's and the owner's to confirm.
- **The check is an outbound call with a person's secret.** It runs in the tool's Worker under the tool's
  network allow-list like any action, and its values are not kept on failure. A tool's `check` could still
  send the value anywhere it is allowed to reach: the same trust as `ctx.userSecrets` today (D-036 "Know").
- **A page that asks for a secret is a phishing target.** The setup page is served by the gateway on the
  workspace origin, never by the tool, and the OAuth consent shows the client's name only as a claim next to
  its address (D-094).
- **A new required field blocks existing people** at their next call until they open the link. That is the
  intent; the admin sees it as a request when approving the version.

## Not tested

- Nothing was run. In particular: whether Claude, connecting to a tool's MCP URL, discovers the per-tool
  protected-resource document and passes `resource` as the MCP specification says; how a connector's
  browser step behaves with a page of several steps; the time a `check` against a real Odoo takes.
- The owner's direction is oral and quoted from the ticket; this report did not ask anyone.
- FOR-172's question (secrets carried by the token) is not answered here on purpose.
