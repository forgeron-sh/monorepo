import { action, z } from "@forgeron/sdk";
import { listDeals } from "../../lib/crm";

const DAY = 24 * 60 * 60 * 1000;

export default action({
  description: "Open leads with no activity for a number of days, the oldest first.",
  access: "read",
  input: z.object({
    owner: z.string().email().optional().describe("Limit to one salesperson"),
    days: z.number().int().min(1).default(30),
  }),
  async run({ input, tools, now }) {
    const cutoff = new Date(now().getTime() - input.days * DAY).toISOString();
    const deals = await listDeals(tools, input.owner);
    const items = deals
      .filter((d) => d.stage !== "won" && d.stage !== "lost" && d.updated_at < cutoff)
      .sort((a, b) => a.updated_at.localeCompare(b.updated_at))
      .map(({ id, title, company, owner_email, stage, updated_at }) => ({
        id,
        title,
        company,
        owner_email,
        stage,
        updated_at,
      }));
    return { days: input.days, items };
  },
});
