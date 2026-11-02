import { action, z } from "@forgeron/sdk";

export default action({
  description: "Too deep.",
  access: "read",
  input: z.object({}),
  run: () => 1,
});
