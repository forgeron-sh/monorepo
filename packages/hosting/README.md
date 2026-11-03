# @forgeron/hosting

Deploys a tool and its resources, whatever the hosting mode (D-009).

## Planned contents

- Interface: `provision`, `upload`, `activate`, `teardown` (`migrate` comes with the database, `sdk.md` §8)
- `cloud` mode (`createCloudHosting`): a user Worker in a dispatch namespace of Forgeron's account (Workers for Platforms), uploaded with its own D1, KV and R2 declared in the upload metadata. An upload to a namespace serves at once, so `upload` only keeps the build and `activate` sends the script, after `migrate`: a failed migration leaves the previous script serving. Same names as self-host. `ensureDispatchNamespace` creates the namespace. Tested against a simulated Cloudflare API; not yet tried on a real Workers for Platforms account (FOR-36).
- `self-host` mode (`createSelfHostHosting`): classic Workers through the Cloudflare API, customer account. The code is uploaded as a Worker _version_ and `activate` creates the deployment, so a failed migration leaves the previous version serving. Names: `<workspace>--<tool>--<environment>`, the resources `<worker>--db|cache|files`.
- `deploy(hosting, environment, build)`: `assertDeployable`, provision, upload, migrate (destructive refused in pilot and production without `allowDestructive`), activate. `teardownPreview` for a merged or deleted branch. A preview's database is created per branch, migrated, then filled according to `preview.data` (D-033): with the seed handed to `deploy`, else by the preview's own Worker on its first request (marker in `seed-marker.ts`).
- `local` mode (`@forgeron/hosting/local`): `forgeron dev`. A Worker run by workerd through Miniflare, behind a local server that plays the gateway: it forwards requests with the developer's identity (`x-forgeron-user`, every role of the tool by default). A new build keeps the URL of the one it replaces.

## Notes

Neutral entry point (`index.ts`, checked by `bun run neutral`): plain data in and out, no Node API. The `local` mode is Node-only and lives behind its own sub-path. HTTP calls to the Cloudflare API through `fetch`, usable from the gateway and from the CLI. See `docs/ARCHITECTURE.md`, "Hosting modes".
