import { action, z } from "@forgeron/sdk";

export default action({
  description: "Deletes everything.",
  access: "delete",
  input: z.object({ id: z.string() }),
  cli: { args: ["id"] },
  interfaces: ["mcp", "cli"],
  run: () => ({ purged: true }),
});
