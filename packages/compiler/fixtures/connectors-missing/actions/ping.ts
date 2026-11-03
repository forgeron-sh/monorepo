import { action, z } from "@forgeron/sdk";

export default action({
  description: "Answers pong.",
  access: "read",
  input: z.object({}),
  run: () => ({ pong: true }),
});
