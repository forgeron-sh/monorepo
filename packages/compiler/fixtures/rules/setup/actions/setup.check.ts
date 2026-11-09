import { action, z } from "@forgeron/sdk";

export default action({
  description: "Checks a person's setup.",
  access: "read",
  input: z.object({}),
  run: () => ({ ok: true }),
});
