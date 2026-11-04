import { action, z } from "@forgeron/sdk";

export default action({
  description: "Lists the deals.",
  access: "read",
  input: z.object({ owner: z.string().optional() }),
  run: () => [] as Array<{ id: number }>,
});
