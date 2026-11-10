# forgeron

The Forgeron CLI: create a tool, run it locally, test it, release it and deploy it.

```sh
npx forgeron init my-tool      # a tool alone in its repository, with its CI workflow
cd my-tool && npm install
npx forgeron dev               # run it locally: API, MCP server, views, playground
npx forgeron test              # build it and run its tests
npx forgeron change --type added --bump minor -m "…"   # describe a change
npx forgeron release           # on the production branch: version, CHANGELOG.md, tag
```

`npx forgeron init marketplace` creates a marketplace of tools. Every command: `npx forgeron --help`.

Documentation: [the SDK](https://github.com/forgeron-sh/monorepo/blob/main/docs/sdk.md) and [the life of a tool](https://github.com/forgeron-sh/monorepo/blob/main/docs/lifecycle.md). Needs Node 24 or later.

## In the monorepo

Node. Depends on `@forgeron/sdk`, `@forgeron/compiler` and `@forgeron/hosting`; nothing depends on it (D-003). The published build bundles the compiler, hosting, registry, platform contract and playground into one file; the SDK, the runtime and the manifest stay npm dependencies (D-122).
