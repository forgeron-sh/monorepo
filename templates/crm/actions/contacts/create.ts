import { action, z } from "@forgeron/sdk";
import { orConflict } from "../../lib/conflict";

export default action({
  description: "Creates a contact, optionally attached to a company.",
  access: "write",
  input: z.object({
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    company_id: z.string().optional(),
  }),
  async run({ input, db }) {
    return orConflict(
      db
        .insertInto("contacts")
        .values({
          first_name: input.first_name,
          last_name: input.last_name,
          email: input.email ?? null,
          phone: input.phone ?? null,
          company_id: input.company_id ?? null,
        })
        .returning(["id", "first_name", "last_name", "email"])
        .executeTakeFirstOrThrow(),
      "A contact already uses this email.",
    );
  },
});
