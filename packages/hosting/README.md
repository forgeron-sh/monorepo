# @forgeron/hosting

Deploys a tool and its resources, whatever the hosting mode (D-009).

## Planned contents

- Interface: `provision`, `upload`, `activate`, `teardown` (`migrate` comes with the database, `sdk.md` §8)
- `cloud` mode: Workers for Platforms, Forgeron account
- `self-host` mode (`createSelfHostHosting`): classic Workers through the Cloudflare API, customer account. The code is uploaded as a Worker _version_ and `activate` creates the deployment, so a failed migration leaves the previous version serving. Names: `<workspace>--<tool>--<environment>`, the resources `<worker>--db|cache|files`.
- `deploy(hosting, environment, build)`: `assertDeployable`, provision, upload, migrate (destructive refused in pilot and production without `allowDestructive`), activate. `teardownPreview` for a merged or deleted branch.
- `local` mode (`@forgeron/hosting/local`): `forgeron dev`. A Worker run by workerd through Miniflare, behind a local server that plays the gateway: it forwards requests with the developer's identity (`x-forgeron-user`, every role of the tool by default). A new build keeps the URL of the one it replaces.

## Notes

Neutral entry point (`index.ts`, checked by `bun run neutral`): plain data in and out, no Node API. The `local` mode is Node-only and lives behind its own sub-path. HTTP calls to the Cloudflare API through `fetch`, usable from the gateway and from the CLI. See `docs/ARCHITECTURE.md`, "Hosting modes".
