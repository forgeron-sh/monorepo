import { action, ToolError, z } from "@forgeron/sdk";
import { attributes, readAttributes } from "../../lib/attributes";

export default action({
  description:
    "Sets free-form attributes of a piece of equipment (power_kw, refrigerant, serial or any other key). Keys given are merged into the existing ones; `null` removes a key.",
  access: "write",
  input: z.object({
    id: z.string(),
    attributes: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
  }),
  async run({ input, db }) {
    const row = await db
      .selectFrom("equipments")
      .select("attributes")
      .where("id", "=", input.id)
      .executeTakeFirst();
    if (!row) throw new ToolError("NOT_FOUND", `No equipment ${input.id}.`);

    const merged: Record<string, unknown> = { ...readAttributes(row.attributes) };
    for (const [key, value] of Object.entries(input.attributes)) {
      if (value === null) delete merged[key];
      else merged[key] = value;
    }
    const checked = attributes.safeParse(merged);
    if (!checked.success)
      throw new ToolError("INVALID", checked.error.issues.map((i) => i.message).join("; "));

    await db
      .updateTable("equipments")
      .set({ attributes: JSON.stringify(checked.data) })
      .where("id", "=", input.id)
      .execute();
    return { id: input.id, attributes: checked.data };
  },
});
