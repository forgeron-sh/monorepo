import { action, z } from "@forgeron/sdk";
import { listDeals } from "../../lib/crm";

export default action({
  description: "The salespeople who own at least one lead, for the filter of the dashboard.",
  access: "read",
  input: z.object({}),
  async run({ tools }) {
    const deals = await listDeals(tools, undefined);
    return [...new Set(deals.map((d) => d.owner_email))].sort();
  },
});
