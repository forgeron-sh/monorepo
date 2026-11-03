import { action, ToolError, z } from "@forgeron/sdk";
import { orConflict } from "../../lib/conflict";

export default action({
  description: "Updates the details of a contact: only what is given changes.",
  access: "write",
  input: z.object({
    id: z.string(),
    first_name: z.string().min(1).optional(),
    last_name: z.string().min(1).optional(),
    email: z.string().email().nullable().optional(),
    phone: z.string().nullable().optional(),
    company_id: z.string().nullable().optional(),
  }),
  cli: { args: ["id"] },
  async run({ input, db }) {
    const { id, ...changes } = input;
    // `undefined` means "leave it", `null` means "clear it".
    const set = Object.fromEntries(
      Object.entries(changes).filter(([, value]) => value !== undefined),
    );
    if (Object.keys(set).length === 0)
      throw new ToolError("INVALID", "Nothing to update: give at least one field.");
    const updated = await orConflict(
      db
        .updateTable("contacts")
        .set(set)
        .where("id", "=", id)
        .returning(["id", "first_name", "last_name", "email", "phone", "company_id"])
        .executeTakeFirst(),
      "A contact already uses this email.",
    );
    if (!updated) throw new ToolError("NOT_FOUND", `No contact ${id}.`);
    return updated;
  },
});
