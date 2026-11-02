# Exemple 3 — Un centre de données léger

## La contrainte

Une entreprise de services gère un parc d'**équipements** répartis sur plusieurs **sites**. Aujourd'hui, la liste vit dans un fichier Excel et une liste SharePoint. Elle veut un référentiel unique :

- importer l'existant depuis un **CSV** ;
- se **synchroniser chaque nuit** avec la liste SharePoint, tant que les deux coexistent ;
- joindre des **fichiers** à un équipement (fiche technique PDF, photo) ;
- stocker des **attributs libres** qui varient selon le type d'équipement ;
- interroger le tout depuis Claude (« Quels équipements du site de Nantes ont leur contrôle en retard ? ») et l'exposer en API aux autres tools.

Plus tard, l'équipe voudra **renommer** la colonne `ref` en `sku`, sans interruption de service.

## Ce que la contrainte exige du SDK

| Besoin                     | Réponse du SDK                                                                 |
| -------------------------- | ------------------------------------------------------------------------------ |
| Importer un CSV            | Une action qui reçoit un fichier (`z.file()`), et `ctx.files` pour le lire     |
| Stocker des pièces jointes | `ctx.files` sur R2, avec des URL signées à durée limitée                       |
| Synchroniser chaque nuit   | Une tâche planifiée dans `jobs/` (cron)                                        |
| Lire SharePoint            | Un connecteur Microsoft 365 déclaré dans la config, `ctx.connectors.microsoft` |
| Attributs libres           | Une colonne JSON typée par un schéma Zod (`t.json(schema)`)                    |
| Renommer sans coupure      | Une migration en deux temps (expand / contract) guidée par le générateur       |
| Gros volumes               | Pagination standard des actions de liste (`cursor`)                            |

## L'arborescence

```text
inventaire/
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

## La configuration

```ts
// forgeron.config.ts
import { defineConfig, database, bucket, connector } from "forgeron";

export default defineConfig({
  name: "inventaire",
  title: "Inventaire des équipements",
  interfaces: { mcp: true, api: true, cli: true },
  resources: {
    db: database({ engine: "d1", why: "Sites, équipements et pièces jointes" }),
    files: bucket({
      maxSize: "25MB",
      types: ["application/pdf", "image/*", "text/csv"],
      why: "Fiches techniques, photos, imports",
    }),
    connectors: {
      // Délégation au nom de l'application (tâche de nuit), pas d'une personne
      microsoft: connector("microsoft-365", {
        mode: "application",
        scopes: ["Sites.Read.All"],
        why: "Lire la liste SharePoint des équipements chaque nuit",
      }),
    },
  },

  roles: {
    technicien: { grants: ["read", "write"] },
    lecteur: { grants: ["read"] },
    admin: { grants: ["read", "write", "delete", "import"] }, // "import" : un niveau propre au tool
  },
});
```

`import` est un niveau d'accès **propre au tool**. Il suffit de le citer dans un rôle pour qu'il existe ; la console l'affiche comme les autres.

## Le schéma

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
    external_id: t.text().unique(), // identifiant de la ligne SharePoint
    updated_at: t.timestamp().defaultNow().onUpdateNow(),
  },
  (c) => [index(c.site_id), index(c.next_check)],
);

export const attachments = table("attachments", {
  id: t.id(),
  equipment_id: t.ref(equipments).onDelete("cascade").notNull(),
  file_key: t.text().notNull(), // clé R2 gérée par ctx.files
  name: t.text().notNull(),
  content_type: t.text().notNull(),
});

export default schema({ sites, equipments, attachments });
```

`t.json(attributes)` stocke du JSON en SQLite et valide les écritures avec le schéma Zod. Les types générés pour Kysely reprennent la forme de l'objet.

## Les actions

### Importer un CSV

```ts
// actions/equipments/import.ts
import { action, z } from "forgeron";
import { parseCsv } from "forgeron/csv";

export default action({
  description:
    "Importe ou met à jour des équipements depuis un fichier CSV (colonnes : ref, type, site, next_check).",
  access: "import",
  input: z.object({ file: z.file({ types: ["text/csv"] }), dryRun: z.boolean().default(true) }),
  cli: { args: ["file"] }, // forgeron inventaire equipments import ./parc.csv --no-dry-run
  async run({ input, db, files }) {
    const rows = parseCsv(await files.text(input.file));
    const sites = await db.selectFrom("sites").select(["id", "name"]).execute();
    const siteId = new Map(sites.map((s) => [s.name.toLowerCase(), s.id]));

    const errors: string[] = [];
    const values = rows.flatMap((r, i) => {
      const site = siteId.get(String(r.site).toLowerCase());
      if (!site) {
        errors.push(`Ligne ${i + 2} : site inconnu « ${r.site} »`);
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

Le fichier arrive par la même action quelle que soit l'interface : en multipart sur l'API, comme chemin local sur le CLI, comme pièce jointe téléversée sur MCP. `dryRun` vaut `true` par défaut : Claude montre d'abord ce qui serait importé.

### Joindre un fichier

```ts
// actions/equipments/attach.ts
export default action({
  description: "Joint un fichier (PDF, photo) à un équipement.",
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

### Lister avec pagination

```ts
// actions/equipments/search.ts
import { action, z, paginate } from "forgeron";

export default action({
  description: "Cherche des équipements par site, type ou date de contrôle.",
  access: "read",
  input: z
    .object({
      city: z.string().optional(),
      type: z.string().optional(),
      checkBefore: z
        .string()
        .date()
        .optional()
        .describe("Contrôle prévu avant cette date (AAAA-MM-JJ)"),
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

## La tâche de nuit

```ts
// jobs/sync-sharepoint.ts
import { schedule } from "forgeron";

export default schedule(
  "0 2 * * *",
  { timezone: "Europe/Paris" },
  async ({ db, connectors, log }) => {
    const items = await connectors.microsoft.graph
      .api("/sites/acme.sharepoint.com:/sites/parc:/lists/Equipements/items")
      .expand("fields")
      .getAll();

    for (const item of items) {
      await db
        .updateTable("equipments")
        .set({ next_check: item.fields.ProchainControle ?? null })
        .where("external_id", "=", item.id)
        .execute();
    }
    log.info("Synchronisation SharePoint", { items: items.length });
  },
);
```

Une tâche planifiée s'exécute avec l'identité **du tool**, pas d'une personne : elle n'a accès qu'aux connecteurs en mode `application`. Son exécution apparaît dans le journal et dans `forgeron logs --job sync-sharepoint`.

## Renommer une colonne sans coupure

Sur D1 (SQLite), un renommage est simple techniquement, mais la version en production lit encore `ref` pendant le déploiement de la nouvelle. Forgeron impose donc **deux migrations** quand le générateur détecte un renommage ou une suppression :

```bash
forgeron db generate --name sku --rename equipments.ref:equipments.sku
```

```text
Renommage détecté : equipments.ref → equipments.sku
Stratégie en deux temps :
  0002_sku_expand.ts    ajoute sku, recopie ref, garde les deux synchronisés
  0003_sku_contract.ts  supprime ref (destructive, à déployer après)
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
  after: "0002_sku_expand", // jamais dans le même déploiement que 0002
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

1. On déploie la version qui écrit dans `sku` et lit `sku` ; `0002` s'applique. L'ancienne version, encore active quelques instants, lit toujours `ref`, qui existe encore.
2. Une fois la nouvelle version seule en production, on déploie `0003` avec `forgeron deploy --env production --allow-destructive`.

## Ce que l'exemple décide pour le SDK

- `z.file()` : un type d'entrée fichier unique, adapté à chaque interface.
- `ctx.files` : stockage R2 avec préfixes et URL signées ; jamais d'URL publique par défaut.
- `jobs/` + `schedule()` : tâches cron avec fuseau horaire, exécutées sous l'identité du tool.
- Connecteurs en deux modes : `delegated` (au nom de la personne) et `application` (au nom du tool).
- Niveaux d'accès personnalisés (`import`) déclarés simplement dans les rôles.
- `paginate` : la forme standard des listes (`limit`, `cursor` → `items`, `nextCursor`).
- Migrations destructives : marquées, séparées en deux temps, refusées en production sans accord explicite.
