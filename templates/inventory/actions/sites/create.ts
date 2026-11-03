import { action, ToolError, z } from "@forgeron/sdk";

export default action({
  description: "Creates a site, or updates the city of the one that has the same name.",
  access: "write",
  input: z.object({ name: z.string().min(1), city: z.string().min(1) }),
  async run({ input, db }) {
    const existing = await db
      .selectFrom("sites")
      .select("id")
      .where("name", "=", input.name)
      .executeTakeFirst();
    if (existing) {
      await db
        .updateTable("sites")
        .set({ city: input.city })
        .where("id", "=", existing.id)
        .execute();
      return { id: existing.id, name: input.name, city: input.city };
    }
    const created = await db
      .insertInto("sites")
      .values({ name: input.name, city: input.city })
      .returning(["id", "name", "city"])
      .executeTakeFirst();
    if (!created) throw new ToolError("CONFLICT", `Could not create the site "${input.name}".`);
    return created;
  },
});
