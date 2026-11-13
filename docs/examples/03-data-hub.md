# Example 3 — A lightweight data hub

## The constraint

A services company manages a fleet of **equipment** spread across several **sites**. Today, the list lives in an Excel file and a SharePoint list. It wants a single reference:

- import the existing data from a **CSV**;
- **sync every night** with the SharePoint list, as long as both coexist;
- attach **files** to a piece of equipment (PDF datasheet, photo);
- store **free-form attributes** that vary by equipment type;
- query everything from Claude ("Which equipment at the Nantes site has an overdue check?") and expose it through the API to other tools.

Later, the team will want to **rename** the `ref` column to `sku`, without downtime.

## What the constraint requires of the SDK

| Need                    | SDK answer                                                                   |
| ----------------------- | ---------------------------------------------------------------------------- |
| Import a CSV            | An action that receives a file (`z.file()`), and `ctx.files` to read it      |
| Store attachments       | `ctx.files` on R2, with time-limited signed URLs                             |
| Sync every night        | A scheduled job in `jobs/` (cron)                                            |
| Read SharePoint         | A Microsoft 365 connector declared in the config, `ctx.connectors.microsoft` |
| Free-form attributes    | A JSON column typed by a Zod schema (`t.json(schema)`)                       |
| Rename without downtime | A two-step migration (expand / contract) guided by the generator             |
| Large volumes           | Standard pagination of list actions (`cursor`)                               |

## The file tree

```text
inventory/
├── forgeron.config.ts
├── db/
│   ├── schema.ts
│   └── migrations/
│       ├── 0001_init.ts
│       ├── 0002_sku_expand.ts
│       └── 0003_sku_contract.ts
├── actions/
│   ├── equipments/
│   │   ├── search.ts
│   │   ├── get.ts
│   │   ├── import.ts
│   │   └── attach.ts
│   └── sites/list.ts
├── jobs/
│   └── sync-sharepoint.ts
└── tests/
```

## The configuration

```ts
// forgeron.config.ts
import { defineConfig, database, bucket, connector } from "forgeron";

export default defineConfig({
  name: "inventory",
  title: "Equipment inventory",
  interfaces: { mcp: true, api: true, cli: true },
  resources: {
    db: database({ engine: "d1", why: "Sites, equipment and attachments" }),
    files: bucket({
      maxSize: "25MB",
      types: ["application/pdf", "image/*", "text/csv"],
      why: "Datasheets, photos, imports",
    }),
    connectors: {
      // Delegation on behalf of the application (nightly job), not of a person
      microsoft: connector("microsoft-365", {
        mode: "application",
        scopes: ["Sites.Read.All"],
        why: "Read the SharePoint equipment list every night",
      }),
    },
  },

  profiles: {
    technician: { grants: ["read", "write"] },
    reader: { grants: ["read"] },
    manager: { grants: ["read", "write", "delete", "import"] }, // "import": a tool-specific level
  },
});
```

`import` is an access level **specific to the tool**. Citing it in a profile is enough for it to exist; the console displays it like the others.

## The schema

```ts
// db/schema.ts
import { schema, table, t, index } from "forgeron/db";
import { z } from "forgeron";

export const sites = table("sites", {
  id: t.id(),
  name: t.text().notNull(),
  city: t.text().notNull(),
});

const attributes = z
  .object({
    power_kw: z.number().optional(),
    refrigerant: z.string().optional(),
    serial: z.string().optional(),
  })
  .passthrough();

export const equipments = table(
  "equipments",
  {
    id: t.id(),
    site_id: t.ref(sites).notNull(),
    ref: t.text().notNull().unique(),
    type: t.text().notNull(),
    next_check: t.date(),
    attributes: t.json(attributes).default({}),
    external_id: t.text().unique(), // identifier of the SharePoint row
    updated_at: t.timestamp().defaultNow().onUpdateNow(),
  },
  (c) => [index(c.site_id), index(c.next_check)],
);

export const attachments = table("attachments", {
  id: t.id(),
  equipment_id: t.ref(equipments).onDelete("cascade").notNull(),
  file_key: t.text().notNull(), // R2 key managed by ctx.files
  name: t.text().notNull(),
  content_type: t.text().notNull(),
});

export default schema({ sites, equipments, attachments });
```

`t.json(attributes)` stores JSON in SQLite and validates writes with the Zod schema. The types generated for Kysely follow the shape of the object.

## Actions

### Importing a CSV

```ts
// actions/equipments/import.ts
import { action, z } from "forgeron";
import { parseCsv } from "forgeron/csv";

export default action({
  description:
    "Imports or updates equipment from a CSV file (columns: ref, type, site, next_check).",
  access: "import",
  input: z.object({ file: z.file({ types: ["text/csv"] }), dryRun: z.boolean().default(true) }),
  cli: { args: ["file"] }, // forgeron inventory equipments import ./fleet.csv --no-dry-run
  async run({ input, db, files }) {
    const rows = parseCsv(await files.text(input.file));
    const sites = await db.selectFrom("sites").select(["id", "name"]).execute();
    const siteId = new Map(sites.map((s) => [s.name.toLowerCase(), s.id]));

    const errors: string[] = [];
    const values = rows.flatMap((r, i) => {
      const site = siteId.get(String(r.site).toLowerCase());
      if (!site) {
        errors.push(`Row ${i + 2}: unknown site "${r.site}"`);
        return [];
      }
      return [{ ref: r.ref, type: r.type, site_id: site, next_check: r.next_check || null }];
    });

    if (!input.dryRun && errors.length === 0) {
      await db
        .insertInto("equipments")
        .values(values)
        .onConflict((oc) =>
          oc.column("ref").doUpdateSet((eb) => ({
            type: eb.ref("excluded.type"),
            site_id: eb.ref("excluded.site_id"),
            next_check: eb.ref("excluded.next_check"),
          })),
        )
        .execute();
    }
    return {
      rows: rows.length,
      valid: values.length,
      errors,
      applied: !input.dryRun && errors.length === 0,
    };
  },
});
```

The file reaches the same action whatever the interface: as multipart on the API, as a local path on the CLI, as an uploaded attachment on MCP. `dryRun` defaults to `true`: Claude first shows what would be imported.

### Attaching a file

```ts
// actions/equipments/attach.ts
export default action({
  description: "Attaches a file (PDF, photo) to a piece of equipment.",
  access: "write",
  input: z.object({ id: z.string(), file: z.file({ types: ["application/pdf", "image/*"] }) }),
  async run({ input, db, files }) {
    const stored = await files.put(input.file, { prefix: `equipments/${input.id}/` });
    await db
      .insertInto("attachments")
      .values({
        equipment_id: input.id,
        file_key: stored.key,
        name: stored.name,
        content_type: stored.type,
      })
      .execute();
    return { name: stored.name, url: await files.signedUrl(stored.key, { expiresIn: "15m" }) };
  },
});
```

### Listing with pagination

```ts
// actions/equipments/search.ts
import { action, z, paginate } from "forgeron";

export default action({
  description: "Searches equipment by site, type or check date.",
  access: "read",
  input: z
    .object({
      city: z.string().optional(),
      type: z.string().optional(),
      checkBefore: z.string().date().optional().describe("Check due before this date (YYYY-MM-DD)"),
    })
    .merge(paginate.input),
  async run({ input, db }) {
    let q = db
      .selectFrom("equipments")
      .innerJoin("sites", "sites.id", "equipments.site_id")
      .select([
        "equipments.id",
        "equipments.ref",
        "equipments.type",
        "equipments.next_check",
        "sites.city",
      ]);
    if (input.city) q = q.where("sites.city", "=", input.city);
    if (input.type) q = q.where("equipments.type", "=", input.type);
    if (input.checkBefore) q = q.where("equipments.next_check", "<", input.checkBefore);
    return paginate(q, input, { orderBy: "equipments.id" }); // { items, nextCursor }
  },
});
```

## The nightly job

```ts
// jobs/sync-sharepoint.ts
import { schedule } from "forgeron";

export default schedule(
  "0 2 * * *",
  { timezone: "Europe/Paris" },
  async ({ db, connectors, log }) => {
    const items = await connectors.microsoft.graph
      .api("/sites/acme.sharepoint.com:/sites/fleet:/lists/Equipments/items")
      .expand("fields")
      .getAll();

    for (const item of items) {
      await db
        .updateTable("equipments")
        .set({ next_check: item.fields.NextCheck ?? null })
        .where("external_id", "=", item.id)
        .execute();
    }
    log.info("SharePoint sync", { items: items.length });
  },
);
```

A scheduled job runs with the identity **of the tool**, not of a person: it only has access to connectors in `application` mode. Its execution appears in the log and in `forgeron logs --job sync-sharepoint`.

## Renaming a column without downtime

On D1 (SQLite), a rename is technically simple, but the production version still reads `ref` while the new one is being deployed. Forgeron therefore requires **two migrations** when the generator detects a rename or a drop:

```bash
forgeron db generate --name sku --rename equipments.ref:equipments.sku
```

```text
Rename detected: equipments.ref → equipments.sku
Two-step strategy:
  0002_sku_expand.ts    adds sku, copies ref, keeps both in sync
  0003_sku_contract.ts  drops ref (destructive, to deploy afterwards)
```

```ts
// db/migrations/0002_sku_expand.ts
export default migration({
  async up(db) {
    await db.schema.alterTable("equipments").addColumn("sku", "text").execute();
    await db
      .updateTable("equipments")
      .set((eb) => ({ sku: eb.ref("ref") }))
      .execute();
    await db.schema
      .createIndex("equipments_sku_unique")
      .on("equipments")
      .column("sku")
      .unique()
      .execute();
  },
  async down(db) {
    await db.schema.dropIndex("equipments_sku_unique").execute();
    await db.schema.alterTable("equipments").dropColumn("sku").execute();
  },
});
```

```ts
// db/migrations/0003_sku_contract.ts
export default migration({
  destructive: true,
  after: "0002_sku_expand", // never in the same deployment as 0002
  async up(db) {
    await db.schema.alterTable("equipments").dropColumn("ref").execute();
  },
  async down(db) {
    await db.schema.alterTable("equipments").addColumn("ref", "text").execute();
    await db
      .updateTable("equipments")
      .set((eb) => ({ ref: eb.ref("sku") }))
      .execute();
  },
});
```

1. Deploy the version that writes to `sku` and reads `sku`; `0002` applies. The old version, still active for a few moments, keeps reading `ref`, which still exists.
2. Once the new version is alone in production, deploy `0003` with `forgeron deploy --env production --allow-destructive`.

## What the example decides for the SDK

- `z.file()`: a single file input type, adapted to each interface.
- `ctx.files`: R2 storage with prefixes and signed URLs; never a public URL by default.
- `jobs/` + `schedule()`: cron jobs with a time zone, run under the tool's identity.
- Connectors in two modes: `delegated` (on behalf of the person) and `application` (on behalf of the tool).
- Custom access levels (`import`) declared simply in profiles.
- `paginate`: the standard shape of lists (`limit`, `cursor` → `items`, `nextCursor`).
- Destructive migrations: flagged, split into two steps, refused in production without explicit consent.
