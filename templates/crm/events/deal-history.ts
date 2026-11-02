import { on } from "@forgeron/sdk";

interface DealMoved {
  dealId: string;
  from: string;
  to: string;
  by: string;
}

// Runs inside the action: if it fails, so does the move.
export default on<DealMoved>("deal.moved", async ({ payload, db }) => {
  await db
    .insertInto("deal_events")
    .values({
      deal_id: payload.dealId,
      from_stage: payload.from,
      to_stage: payload.to,
      by_email: payload.by,
    })
    .execute();
});
