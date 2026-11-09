import { action, z } from "@forgeron/sdk";

export default action({
  description: "Ping.",
  access: "read",
  input: z.object({}),
  run: () => ({}),
});
