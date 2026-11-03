# @forgeron/connector-microsoft-365

Microsoft 365 connector (docs/sdk.md sections 10 and 18), built on `defineConnector` from
`@forgeron/sdk`.

```ts
import { connector, defineConfig } from "forgeron";

resources: {
  connectors: {
    microsoft: connector("microsoft-365", { mode: "delegated", scopes: ["Mail.Send"], why: "…" }),
  },
}
// ctx.connectors.microsoft.graph.get("/me")
```

- Reaches only `graph.microsoft.com`; any other host raises `FORBIDDEN`.
- `ctx.connectors.<name>.graph` is a thin Microsoft Graph client (`get`, `post`, `patch`, `delete`
  on `https://graph.microsoft.com/v1.0`, plus `list` that follows `@odata.nextLink`). The
  authenticated `fetch` is also available. A Graph error becomes a `ToolError`
  (`NOT_FOUND`, `FORBIDDEN`, `RATE_LIMITED`, `UPSTREAM`).
- Modes `delegated` (the person's consent) and `application` (the admin's consent). The scopes
  are the Graph permission names listed in `MICROSOFT_365_SCOPES`.
- Per-person consent belongs to the platform. Tests simulate Graph with `mockFetch`.
