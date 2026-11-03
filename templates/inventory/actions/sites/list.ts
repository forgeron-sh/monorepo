import { action, z } from "@forgeron/sdk";

export default action({
  description: "Lists the sites, by name, optionally of one city.",
  access: "read",
  input: z.object({ city: z.string().optional() }),
  async run({ input, db }) {
    let query = db.selectFrom("sites").select(["id", "name", "city"]).orderBy("name");
    if (input.city) query = query.where("city", "=", input.city);
    return query.execute();
  },
});
