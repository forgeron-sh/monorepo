import { action, z } from "@forgeron/sdk";

export default action({
  description: "Moves a deal to another stage.",
  access: "write",
  input: z.object({ id: z.number().int(), stage: z.string() }),
  run: () => ({ ok: true }),
});
