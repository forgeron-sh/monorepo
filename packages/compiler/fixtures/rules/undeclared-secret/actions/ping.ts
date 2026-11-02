import { action, z } from "@forgeron/sdk";

export default action({
  description: "Reads a secret nobody declared.",
  access: "read",
  input: z.object({}),
  run: (ctx) => ctx.secrets.API_KEY,
});
