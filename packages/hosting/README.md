# @forgeron/hosting

Deploys a tool and its resources, whatever the hosting mode (D-009).

## Planned contents

- Interface: `provision`, `upload`, `migrate`, `activate`, `teardown`
- `cloud` mode: Workers for Platforms, Forgeron account
- `self-host` mode: classic Workers through the Cloudflare API, customer account
- `local` mode: `forgeron dev`

## Notes

Neutral: HTTP calls to the Cloudflare API through `fetch`, usable from the gateway and from the CLI. See `docs/ARCHITECTURE.md`, "Hosting modes".
