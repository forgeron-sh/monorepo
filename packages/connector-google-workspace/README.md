# @forgeron/connector-google-workspace

Connector `google-workspace` (`docs/sdk.md` §10, §18). Implements `defineConnector` from `@forgeron/sdk`.

- Hosts: `*.googleapis.com` only.
- Modes: `delegated`, `application`.
- Scopes: the catalog in `src/index.ts` (Gmail, Calendar, Drive, Sheets, Docs).
- Client: an authenticated `fetch`; no Google client is bundled.
- The per-person consent flow is the platform's, not this package's.
