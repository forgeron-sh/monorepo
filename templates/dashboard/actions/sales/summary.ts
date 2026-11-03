import { action, z } from "@forgeron/sdk";
import { listDeals, STAGES } from "../../lib/crm";

export default action({
  description: "Number and amount of leads by stage, and the amount won since a date.",
  access: "read",
  input: z.object({
    owner: z.string().email().optional().describe("Limit to one salesperson"),
    since: z
      .string()
      .date()
      .optional()
      .describe("Start of the period (YYYY-MM-DD), the 1st of the current month by default"),
  }),
  cli: {},
  async run({ input, tools, now }) {
    const since = input.since ?? `${now().toISOString().slice(0, 7)}-01`;
    const deals = await listDeals(tools, input.owner);

    const totals = STAGES.map((stage) => {
      const inStage = deals.filter((d) => d.stage === stage);
      return {
        stage,
        count: inStage.length,
        amount: inStage.reduce((sum, d) => sum + (d.amount ?? 0), 0),
      };
    });
    const won = deals
      .filter((d) => d.stage === "won" && d.updated_at.slice(0, 10) >= since)
      .reduce((sum, d) => sum + (d.amount ?? 0), 0);

    return { since, totals, won };
  },
});
