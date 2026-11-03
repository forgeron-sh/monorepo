import { seed } from "@forgeron/sdk/db";

export default seed(async ({ db }) => {
  await db.insertInto("companies").values({ name: "Seeded Co" }).execute();
});
