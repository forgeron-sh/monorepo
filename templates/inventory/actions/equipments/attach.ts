import { action, ToolError, z } from "@forgeron/sdk";

const ALLOWED = [/^application\/pdf$/, /^image\/.+$/];
const MAX_BYTES = 25 * 1024 * 1024;

export default action({
  description:
    "Attaches a file (PDF or image, up to 25 MB) to a piece of equipment. The content is given base64-encoded.",
  access: "write",
  input: z.object({
    id: z.string(),
    name: z.string().min(1).describe("File name, such as datasheet.pdf"),
    content_type: z.string().describe("application/pdf or image/*"),
    content_base64: z.string().min(1),
  }),
  async run({ input, db, files }) {
    if (!ALLOWED.some((type) => type.test(input.content_type)))
      throw new ToolError("INVALID", `"${input.content_type}" is not a PDF or an image.`);
    const equipment = await db
      .selectFrom("equipments")
      .select("id")
      .where("id", "=", input.id)
      .executeTakeFirst();
    if (!equipment) throw new ToolError("NOT_FOUND", `No equipment ${input.id}.`);

    let bytes: Uint8Array;
    try {
      bytes = Uint8Array.from(atob(input.content_base64), (c) => c.charCodeAt(0));
    } catch {
      throw new ToolError("INVALID", "content_base64 is not valid base64.");
    }
    if (bytes.length > MAX_BYTES) throw new ToolError("INVALID", "The file is over 25 MB.");

    const key = await files.put(bytes, {
      prefix: `equipments/${equipment.id}/`,
      contentType: input.content_type,
    });
    const attachment = await db
      .insertInto("attachments")
      .values({
        equipment_id: equipment.id,
        file_key: key,
        name: input.name,
        content_type: input.content_type,
      })
      .returning(["id", "name", "content_type"])
      .executeTakeFirstOrThrow();
    return { ...attachment, url: await files.signedUrl(key, { expiresIn: "15m" }) };
  },
});
