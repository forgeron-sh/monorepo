import { ToolError } from "@forgeron/sdk";

/** What the dashboard needs of a row of the CRM's `deals.list`. */
export interface Deal {
  id: string;
  title: string;
  stage: string;
  amount: number | null;
  owner_email: string;
  company: string;
  updated_at: string;
}

export const STAGES = ["lead", "qualified", "proposal", "negotiation", "won", "lost"] as const;

/** Reads the leads through the CRM, as the person who asks: the CRM decides what they may see. */
export async function listDeals(
  tools: Readonly<Record<string, { call(action: string, input?: unknown): Promise<unknown> }>>,
  owner: string | undefined,
): Promise<Deal[]> {
  const crm = tools.crm;
  if (!crm) throw new ToolError("UPSTREAM", "The CRM is not available.");
  const deals = (await crm.call("deals.list", owner ? { owner } : {})) as Deal[];
  const incomplete = deals.find((d) => typeof d.updated_at !== "string");
  if (incomplete) {
    throw new ToolError(
      "UPSTREAM",
      "The CRM's deals.list does not return updated_at, which the dashboard needs.",
    );
  }
  return deals;
}
