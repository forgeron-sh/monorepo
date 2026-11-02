import { action, z } from "@forgeron/sdk";
import { odoo, TICKET_FIELDS } from "../../lib/odoo";

export default action({
  description: "Lists Odoo support tickets, by default those assigned to me.",
  access: "read",
  input: z.object({
    mine: z.boolean().default(true).describe("Only my tickets"),
    stage: z.string().optional().describe('Stage name, e.g. "In progress"'),
    limit: z.number().int().max(100).default(20),
  }),
  // forgeron odoo tickets list --mine --stage "In progress"
  async run(ctx) {
    const { input } = ctx;
    const domain: unknown[] = [];
    if (input.mine) domain.push(["user_id.login", "=", ctx.userSecrets.ODOO_LOGIN]);
    if (input.stage) domain.push(["stage_id.name", "=", input.stage]);
    return odoo(ctx).call("helpdesk.ticket", "search_read", [domain], {
      fields: TICKET_FIELDS,
      limit: input.limit,
      order: "create_date desc",
    });
  },
});
