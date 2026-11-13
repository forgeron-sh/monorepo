# @forgeron/runtime

The runtime a Forgeron tool runs on, in its Worker: actions, access by subject, database, and the four interfaces (MCP, API, CLI, web). A tool does not import it: `forgeron build` bundles it with the tool. Documentation: [docs/sdk.md](https://github.com/forgeron-sh/monorepo/blob/main/docs/sdk.md).

## In the monorepo

workerd only: no `node:*`, no compiler import (`runtime-stays-on-workers` rule).
