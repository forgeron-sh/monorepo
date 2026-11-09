import { action, ToolError, z } from "@forgeron/sdk";
import { odoo } from "../../lib/odoo";

// What the platform asks before it keeps a person's Odoo login and key (D-101): the values about to
// be kept are `ctx.userSecrets`, and Odoo says whether they are good. Not on MCP, the CLI or the API.
export default action({
  description: "Checks a person's Odoo login and API key.",
  access: "read",
  input: z.object({}),
  async run(ctx) {
    try {
      await odoo(ctx).call("res.users", "search_count", [[]]);
      return {};
    } catch (error) {
      if (error instanceof ToolError && error.code === "FORBIDDEN") {
        return { errors: { ODOO_API_KEY: "Odoo refused this login and API key." } };
      }
      throw error;
    }
  },
});
