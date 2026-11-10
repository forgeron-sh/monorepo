# @forgeron/sdk

Write a Forgeron tool: its configuration (`defineConfig`), its actions (`action`), its database (`@forgeron/sdk/db`), its views (`@forgeron/sdk/react`) and its tests (`@forgeron/sdk/testing`).

```ts
import { action, z } from "@forgeron/sdk";

export default action({
  description: "Sends back the message it receives.",
  access: "read",
  input: z.object({ message: z.string() }),
  run: ({ input }) => ({ message: input.message }),
});
```

Start a tool with `npx forgeron init`. Documentation: [docs/sdk.md](https://github.com/forgeron-sh/monorepo/blob/main/docs/sdk.md).

## In the monorepo

Imports neither `@forgeron/compiler` nor `@forgeron/hosting` (`sdk-stays-light` rule): a tool never ships build or deployment tooling. React is an optional peer dependency.
