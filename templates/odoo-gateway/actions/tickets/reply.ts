import { action, z } from "@forgeron/sdk";
import { odoo } from "../../lib/odoo";

export default action({
  description: "Adds a customer-visible reply to a ticket.",
  access: "write",
  confirm: true,
  input: z.object({ id: z.number().int(), message: z.string().min(1) }),
  cli: { args: ["id", "message"] },
  async run(ctx) {
    await odoo(ctx).call("helpdesk.ticket", "message_post", [[ctx.input.id]], {
      body: ctx.input.message,
      message_type: "comment",
      subtype_xmlid: "mail.mt_comment",
    });
    return { ok: true };
  },
});
