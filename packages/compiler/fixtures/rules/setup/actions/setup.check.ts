import { action, z } from "@forgeron/sdk";

// What the platform asks before it keeps a person's setup (D-101): it reads the values about to be given.
export default action({
  description: "Checks a person's setup.",
  access: "read",
  input: z.object({}),
  run: (ctx) => ({
    errors: {
      ...(ctx.user.setup.firstName === "Nobody" ? { firstName: "That name is not accepted." } : {}),
      ...(ctx.userSecrets.ODOO_API_KEY === "wrong"
        ? { ODOO_API_KEY: "Odoo refused this key." }
        : {}),
    },
  }),
});
