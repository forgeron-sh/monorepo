# Template `crm`

Companies, contacts and leads, usable from Claude.

Specification: [`docs/examples/01-crm.md`](../../docs/examples/01-crm.md). This folder follows the mandatory shape of a tool (`docs/sdk.md` §2); `forgeron.config.ts` will be added with the SDK.

- Version: carried by `package.json`, changed only by `forgeron release` (D-007).
- Serves as an SDK integration test: it must compile, pass its tests and deploy to preview on every PR.
- Only uses the public API (`@forgeron/sdk`, `@forgeron/ui`, connectors).
