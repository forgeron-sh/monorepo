import { action, z } from "@forgeron/sdk";

export default action({
  description: "Same name.",
  access: "read",
  input: z.object({}),
  run: () => 1,
});
