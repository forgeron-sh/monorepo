# @forgeron/connector-odoo

Odoo connector (docs/sdk.md sections 10 and 18). It implements `defineConnector` from
`@forgeron/sdk`: `odoo({ url, db, login })` returns the connector definition for one Odoo instance.

- Reaches only the host of `url` (https). Any other host raises `FORBIDDEN`.
- `ctx.connectors.<name>` exposes the authenticated `fetch` and `call(model, method, args, kwargs)`,
  `searchRead(model, domain, options)`: Odoo's `execute_kw` over `/jsonrpc`. The session token is the
  Odoo API key; an Odoo error becomes `ToolError("UPSTREAM")`.
- Modes `delegated` (the person's own API key) and `application` (a service user's key). Odoo has
  no OAuth scopes: `scopes` is empty, access is the Odoo user's own rights.
- Per-person consent and key collection belong to the platform, not to this package.
- Tests simulate Odoo with `mockFetch`; no real instance or key is used.
