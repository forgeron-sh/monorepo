import { action, z } from "@forgeron/sdk";

export default action({
  description: "The caller's Microsoft profile.",
  access: "read",
  input: z.object({}),
  run: async (ctx) => {
    const microsoft = ctx.connectors.microsoft as {
      graph: { get(path: string): Promise<unknown> };
    };
    return microsoft.graph.get("/me");
  },
});
