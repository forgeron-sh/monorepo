import { schema, t, table } from "@forgeron/sdk/db";

export default schema({ things: table("things", { id: t.id(), name: t.text().notNull() }) });
