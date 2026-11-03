import { seed } from "@forgeron/sdk/db";

export default seed(async ({ db }) => {
  await (db as any).insertInto("things").values({ name: "seeded" }).execute();
});
