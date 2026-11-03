import { on } from "@forgeron/sdk";

interface Synced {
  source: "csv" | "sharepoint";
  items: number;
  updated: number;
  by: string;
}

// Runs inside the action or the job: if it fails, so does the import.
export default on<Synced>("inventory.synced", async ({ payload, db }) => {
  await db
    .insertInto("sync_runs")
    .values({
      source: payload.source,
      items: payload.items,
      updated: payload.updated,
      by_email: payload.by,
    })
    .execute();
});
