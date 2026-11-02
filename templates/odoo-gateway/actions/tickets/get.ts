import { action, ToolError, z } from "@forgeron/sdk";
import { odoo, TICKET_FIELDS } from "../../lib/odoo";

export default action({
  description: "Gets one Odoo support ticket by its number.",
  access: "read",
  input: z.object({ id: z.number().int().describe("Ticket number") }),
  cli: { args: ["id"] },
  async run(ctx) {
    const found = await odoo(ctx).call<unknown[]>(
      "helpdesk.ticket",
      "search_read",
      [[["id", "=", ctx.input.id]]],
      { fields: [...TICKET_FIELDS, "description"], limit: 1 },
    );
    // Odoo hides what the person may not read: a missing ticket and a forbidden one look alike.
    if (!found[0]) throw new ToolError("NOT_FOUND", `Ticket ${ctx.input.id} not found.`);
    return found[0];
  },
});
