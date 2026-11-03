import { action, z } from "@forgeron/sdk";

export default action({
  description: "Lists the caller's Gmail messages.",
  access: "read",
  input: z.object({}),
  run: async (ctx) => {
    const google = ctx.connectors.google as {
      fetch(url: string): Promise<{ json(): Promise<unknown> }>;
    };
    return google
      .fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages")
      .then((r) => r.json());
  },
});
