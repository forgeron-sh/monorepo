import { action, ToolError, z } from "@forgeron/sdk";
import { readAttributes } from "../../lib/attributes";

export default action({
  description: "Gets a piece of equipment by id or by ref, with its attributes and attachments.",
  access: "read",
  input: z
    .object({ id: z.string().optional(), ref: z.string().optional() })
    .refine(
      (input) => (input.id === undefined) !== (input.ref === undefined),
      "Give either id or ref.",
    ),
  async run({ input, db }) {
    let query = db
      .selectFrom("equipments")
      .innerJoin("sites", "sites.id", "equipments.site_id")
      .select([
        "equipments.id",
        "equipments.ref",
        "equipments.type",
        "equipments.next_check",
        "equipments.attributes",
        "equipments.external_id",
        "sites.name as site",
        "sites.city",
      ]);
    query = input.id
      ? query.where("equipments.id", "=", input.id)
      : query.where("equipments.ref", "=", input.ref ?? "");
    const row = await query.executeTakeFirst();
    if (!row) throw new ToolError("NOT_FOUND", `No equipment ${input.id ?? input.ref}.`);

    const attachments = await db
      .selectFrom("attachments")
      .select(["id", "name", "content_type"])
      .where("equipment_id", "=", row.id)
      .orderBy("id")
      .execute();
    return { ...row, attributes: readAttributes(row.attributes), attachments };
  },
});
