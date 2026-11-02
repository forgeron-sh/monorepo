# Exemple 1 — Un CRM léger

## La contrainte

Une équipe commerciale de quinze personnes abandonne les modules CRM de son ERP. Elle veut :

- des **sociétés**, des **contacts** rattachés à une société, des **pistes** (deals) avec une étape et un montant ;
- chercher et mettre à jour tout cela **depuis Claude** (« Quelles pistes Durand a-t-il en négociation ? », « Passe la piste Acme en gagnée ») ;
- un **historique** des changements d'étape, pour savoir qui a fait quoi ;
- un **pipeline** visuel pour la réunion du lundi ;
- trois rôles : les commerciaux lisent et modifient, le support lit seulement, la direction peut aussi supprimer.

Six mois plus tard, la direction demandera d'ajouter une **devise** au montant des pistes, alors que la base contient déjà des données.

## Ce que la contrainte exige du SDK

| Besoin                                                | Réponse du SDK                                                                                           |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Stocker des données relationnelles                    | Un schéma en TypeScript (`db/schema.ts`), une base D1 par environnement, des requêtes typées avec Kysely |
| Faire évoluer la base sans perdre de données          | Des migrations générées depuis le schéma, éditables, versionnées et appliquées au déploiement            |
| Exposer des opérations à Claude, à l'API, au terminal | Des actions dans `actions/`, une par fichier ; le chemin donne le nom                                    |
| Distinguer lecture, écriture, suppression             | Un `access` obligatoire sur chaque action, et des rôles déclarés dans la config                          |
| Garder un historique                                  | Des événements émis par les actions (`ctx.emit`) et un gestionnaire qui les écrit en base                |
| Afficher un pipeline                                  | Une vue React dans `views/`, alimentée par les mêmes actions                                             |
| Vérifier que tout marche                              | Vitest et un contexte de test fourni par `forgeron/testing`                                              |

## L'arborescence

```text
crm/
├── forgeron.config.ts
├── db/
│   ├── schema.ts
│   ├── seed.ts
│   └── migrations/
│       ├── 0001_init.ts
│       ├── 0002_deals_currency.ts
│       └── meta/snapshot.json        # généré, commité
├── actions/
│   ├── companies/
│   │   ├── list.ts                   # → companies.list
│   │   └── upsert.ts                 # → companies.upsert
│   ├── contacts/
│   │   ├── search.ts                 # → contacts.search
│   │   └── update.ts                 # → contacts.update
│   └── deals/
│       ├── list.ts                   # → deals.list
│       ├── move.ts                   # → deals.move
│       └── delete.ts                 # → deals.delete
├── events/
│   └── deal-history.ts
├── views/
│   └── pipeline.tsx
├── tests/
│   └── deals.test.ts
├── changes/                          # changements en attente de release
├── CHANGELOG.md                      # généré par forgeron release
├── .forgeron/
│   ├── project.json                  # commité : espace, tool, URL
│   ├── .gitignore                    # ignore local/ et generated/
│   ├── local/                        # ignoré : base et secrets de dev
│   └── generated/                    # ignoré : types générés
└── package.json
```

## La configuration

```ts
// forgeron.config.ts
import { defineConfig, database } from "forgeron";

export default defineConfig({
  name: "crm",
  title: "CRM",
  description: "Sociétés, contacts et pistes commerciales de l'équipe.",

  interfaces: { mcp: true, api: true, cli: true, web: true },

  // Niveaux d'accès utilisés par les actions. read, write, delete et admin existent toujours.
  roles: {
    commercial: { label: "Commerciaux", grants: ["read", "write"] },
    support: { label: "Support", grants: ["read"] },
    direction: { label: "Direction", grants: ["read", "write", "delete"] },
  },

  resources: {
    db: database({ engine: "d1", why: "Sociétés, contacts, pistes et historique" }),
  },
});
```

Les `grants` des rôles sont des **valeurs par défaut**. L'admin de l'espace peut les ajuster action par action dans la console, sans redéployer.

## Le schéma

```ts
// db/schema.ts
import { schema, table, t, index } from "forgeron/db";

export const companies = table("companies", {
  id: t.id(), // texte, généré (ULID)
  name: t.text().notNull(),
  domain: t.text().unique(),
  created_at: t.timestamp().defaultNow(),
});

export const contacts = table(
  "contacts",
  {
    id: t.id(),
    company_id: t.ref(companies).onDelete("set null"),
    first_name: t.text().notNull(),
    last_name: t.text().notNull(),
    email: t.text().unique(),
    phone: t.text(),
    created_at: t.timestamp().defaultNow(),
  },
  (c) => [index(c.last_name)],
);

export const deals = table(
  "deals",
  {
    id: t.id(),
    company_id: t.ref(companies).notNull(),
    owner_email: t.text().notNull(),
    title: t.text().notNull(),
    stage: t.enum(["lead", "qualified", "proposal", "negotiation", "won", "lost"]).default("lead"),
    amount: t.integer(), // en centimes
    updated_at: t.timestamp().defaultNow().onUpdateNow(),
  },
  (c) => [index(c.stage), index(c.owner_email)],
);

export const deal_events = table("deal_events", {
  id: t.id(),
  deal_id: t.ref(deals).onDelete("cascade").notNull(),
  from_stage: t.text(),
  to_stage: t.text().notNull(),
  by_email: t.text().notNull(),
  at: t.timestamp().defaultNow(),
});

export default schema({ companies, contacts, deals, deal_events });
```

`forgeron dev` et `forgeron build` génèrent les types Kysely dans `.forgeron/generated/db.d.ts`. Dans une action, `ctx.db` est un `Kysely<DB>` entièrement typé : aucun ORM maison à apprendre.

## Les migrations

### La première

```bash
forgeron db generate --name init
```

Forgeron compare le schéma au dernier instantané (`meta/snapshot.json`, vide au départ) et écrit :

```ts
// db/migrations/0001_init.ts — généré, puis relu et commité
import { migration } from "forgeron/db";

export default migration({
  async up(db) {
    await db.schema
      .createTable("companies")
      .addColumn("id", "text", (c) => c.primaryKey())
      .addColumn("name", "text", (c) => c.notNull())
      .addColumn("domain", "text", (c) => c.unique())
      .addColumn("created_at", "text", (c) => c.notNull().defaultTo(db.fn.now()))
      .execute();
    // … contacts, deals, deal_events, index
  },
  async down(db) {
    await db.schema.dropTable("deal_events").execute();
    await db.schema.dropTable("deals").execute();
    await db.schema.dropTable("contacts").execute();
    await db.schema.dropTable("companies").execute();
  },
});
```

Le fichier généré est du **Kysely ordinaire** : on peut le lire, le corriger, y ajouter du SQL. Forgeron s'occupe de l'ordre, du suivi (table `_forgeron_migrations`) et de l'application.

### Six mois plus tard : ajouter une devise

On modifie le schéma :

```ts
amount: t.integer(),
currency: t.enum(["EUR", "USD", "GBP"]).notNull().default("EUR"),
```

Puis :

```bash
forgeron db generate --name deals_currency
```

```ts
// db/migrations/0002_deals_currency.ts
import { migration, sql } from "forgeron/db";

export default migration({
  async up(db) {
    await db.schema
      .alterTable("deals")
      .addColumn("currency", "text", (c) => c.notNull().defaultTo("EUR"))
      .execute();

    // Ajout manuel : migration de données. Les pistes de la filiale UK passent en GBP.
    await db
      .updateTable("deals")
      .set({ currency: "GBP" })
      .where(
        "company_id",
        "in",
        db.selectFrom("companies").select("id").where("domain", "like", "%.co.uk"),
      )
      .execute();
  },
  async down(db) {
    await db.schema.alterTable("deals").dropColumn("currency").execute();
  },
});
```

Avant de déployer, on déclare le changement (`forgeron change`, impact `minor`) puis on publie la version (`forgeron release` → `1.5.0`). Ce qui se passe au déploiement :

1. `forgeron deploy --env preview` crée une base de preview **avec le schéma de production et les données de `db/seed.ts`**, jamais les données de production, puis applique `0002`.
2. En production, la plateforme applique les migrations en attente **avant** de basculer le trafic sur la nouvelle version. Si une migration échoue, la version précédente continue de servir.
3. `forgeron db status --env production` montre les migrations appliquées ; `forgeron db rollback --env production` exécute le `down` de la dernière.

Une suppression de colonne ou de table est marquée **destructive** par le générateur. Le déploiement en production la refuse sans `--allow-destructive` (voir l'exemple 3 pour la stratégie en deux temps).

## Les actions

### Chercher des contacts

```ts
// actions/contacts/search.ts
import { action, z } from "forgeron";

export default action({
  description: "Cherche des contacts par nom, prénom, e-mail ou société.",
  access: "read",
  input: z.object({
    query: z.string().min(2).describe("Texte à chercher"),
    limit: z.number().int().max(50).default(10),
  }),
  cli: { args: ["query"] }, // forgeron crm contacts search "Durand"
  async run({ input, db }) {
    const q = `%${input.query}%`;
    return db
      .selectFrom("contacts")
      .leftJoin("companies", "companies.id", "contacts.company_id")
      .select([
        "contacts.id",
        "contacts.first_name",
        "contacts.last_name",
        "contacts.email",
        "companies.name as company",
      ])
      .where((eb) =>
        eb.or([
          eb("contacts.last_name", "like", q),
          eb("contacts.first_name", "like", q),
          eb("contacts.email", "like", q),
          eb("companies.name", "like", q),
        ]),
      )
      .limit(input.limit)
      .execute();
  },
});
```

### Changer l'étape d'une piste

```ts
// actions/deals/move.ts
import { action, z, ToolError } from "forgeron";

export default action({
  description: "Passe une piste à une nouvelle étape du pipeline.",
  access: "write",
  input: z.object({
    id: z.string(),
    stage: z.enum(["lead", "qualified", "proposal", "negotiation", "won", "lost"]),
  }),
  cli: { args: ["id", "stage"] }, // forgeron crm deals move 01J8… won
  async run({ input, db, user, emit }) {
    const deal = await db
      .selectFrom("deals")
      .selectAll()
      .where("id", "=", input.id)
      .executeTakeFirst();
    if (!deal) throw new ToolError("NOT_FOUND", `Aucune piste ${input.id}.`);

    await db.updateTable("deals").set({ stage: input.stage }).where("id", "=", input.id).execute();

    await emit("deal.moved", {
      dealId: deal.id,
      from: deal.stage,
      to: input.stage,
      by: user.email,
    });
    return { id: deal.id, stage: input.stage };
  },
});
```

### Supprimer une piste

```ts
// actions/deals/delete.ts
export default action({
  description: "Supprime définitivement une piste et son historique.",
  access: "delete",
  confirm: true, // MCP : marquée destructive ; CLI : demande confirmation
  input: z.object({ id: z.string() }),
  cli: { args: ["id"] },
  async run({ input, db }) {
    await db.deleteFrom("deals").where("id", "=", input.id).execute();
    return { deleted: input.id };
  },
});
```

## L'historique par événement

```ts
// events/deal-history.ts
import { on } from "forgeron";

export default on("deal.moved", async ({ payload, db }) => {
  await db
    .insertInto("deal_events")
    .values({
      deal_id: payload.dealId,
      from_stage: payload.from,
      to_stage: payload.to,
      by_email: payload.by,
    })
    .execute();
});
```

Les événements sont exécutés **dans la même transaction** que l'action par défaut (`on(…, { mode: "sync" })`), ou en file d'attente avec `mode: "queue"` pour les traitements lents (e-mail, synchronisation).

## La vue

```tsx
// views/pipeline.tsx
import { defineView, useAction, useMutation } from "forgeron/react";
import { Board, Column, Card } from "@forgeron/ui";

const STAGES = ["lead", "qualified", "proposal", "negotiation", "won"] as const;

export default defineView({
  title: "Pipeline",
  path: "/pipeline",
  access: "read",
  component() {
    const deals = useAction("deals.list", {});
    const move = useMutation("deals.move");
    return (
      <Board onDrop={(id, stage) => move.run({ id, stage })}>
        {STAGES.map((s) => (
          <Column key={s} id={s} title={s}>
            {deals.data
              ?.filter((d) => d.stage === s)
              .map((d) => (
                <Card key={d.id} id={d.id} title={d.title} meta={d.company} />
              ))}
          </Column>
        ))}
      </Board>
    );
  },
});
```

La vue appelle les actions avec **les droits de la personne connectée** : un membre du support voit le pipeline mais ne peut rien déplacer (le bouton reste inactif, et le serveur refuse de toute façon).

## Les tests

```ts
// tests/deals.test.ts
import { describe, it, expect } from "vitest";
import { createTestTool } from "forgeron/testing";

describe("deals.move", () => {
  it("enregistre l'historique", async () => {
    const tool = await createTestTool({
      seed: true,
      as: { email: "ely@acme.fr", roles: ["commercial"] },
    });
    const [deal] = await tool.call("deals.list", {});
    await tool.call("deals.move", { id: deal.id, stage: "won" });

    const events = await tool.db.selectFrom("deal_events").selectAll().execute();
    expect(events.at(-1)).toMatchObject({ to_stage: "won", by_email: "ely@acme.fr" });
  });

  it("refuse le support", async () => {
    const tool = await createTestTool({ seed: true, as: { roles: ["support"] } });
    await expect(tool.call("deals.move", { id: "x", stage: "won" })).rejects.toThrow("FORBIDDEN");
  });
});
```

`createTestTool` démarre le tool sur le runtime local de Cloudflare, avec une base en mémoire, les migrations appliquées et, si demandé, le seed.

## Ce que voient les utilisateurs

| Interface    | Exemple                                                                              |
| ------------ | ------------------------------------------------------------------------------------ |
| Claude (MCP) | outil `crm_deals_move` — « Passe une piste à une nouvelle étape du pipeline. »       |
| API          | `POST https://acme.forgeron.app/t/crm/api/deals.move` `{"id":"01J8…","stage":"won"}` |
| CLI          | `forgeron crm deals move 01J8… won`                                                  |
| Web          | `https://acme.forgeron.app/t/crm/pipeline`                                           |

## Ce que l'exemple décide pour le SDK

- Le schéma est la **source de vérité** ; les migrations en sont dérivées, puis deviennent du code ordinaire.
- Kysely est exposé tel quel (`ctx.db`) : Forgeron n'ajoute pas d'ORM.
- Les noms sont identiques dans le schéma, en base et dans les requêtes (`snake_case` recommandé) : aucune conversion cachée entre le code et le SQL.
- Le nom d'une action = son chemin dans `actions/`.
- `access` est obligatoire ; `confirm: true` marque une action destructive dans les quatre interfaces.
- Les événements découplent les effets de bord ; même transaction par défaut.
- Les previews n'utilisent jamais les données de production par défaut.
