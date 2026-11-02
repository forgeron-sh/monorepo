import { action, z } from "@forgeron/sdk";
import { odoo } from "../../lib/odoo";

// Cached for one hour, shared by everyone: reference data, never read with a person's key
// in a way that could expose something to someone else.
export default action({
  description: "Lists the Odoo support teams.",
  access: "read",
  input: z.object({}),
  async run(ctx) {
    return ctx.cache.getOrSet("teams", { ttl: "1h", scope: "tool" }, () =>
      odoo(ctx).call("helpdesk.team", "search_read", [[]], { fields: ["id", "name"] }),
    );
  },
});
