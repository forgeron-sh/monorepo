# @forgeron/hosting

Deploys a tool and its resources, whatever the hosting mode (D-009).

## Planned contents

- Interface: `provision`, `upload`, `activate`, `teardown` (`migrate` comes with the database, `sdk.md` §8)
- `cloud` mode: Workers for Platforms, Forgeron account
- `self-host` mode: classic Workers through the Cloudflare API, customer account
- `local` mode (`@forgeron/hosting/local`): `forgeron dev`. A Worker run by workerd through Miniflare, behind a local server that plays the gateway: it forwards requests with the developer's identity (`x-forgeron-user`, every role of the tool by default). A new build keeps the URL of the one it replaces.

## Notes

Neutral entry point (`index.ts`, checked by `bun run neutral`): plain data in and out, no Node API. The `local` mode is Node-only and lives behind its own sub-path. HTTP calls to the Cloudflare API through `fetch`, usable from the gateway and from the CLI. See `docs/ARCHITECTURE.md`, "Hosting modes".
