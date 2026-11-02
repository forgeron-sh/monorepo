# Exemple 4 — Un tableau de bord commercial

## La contrainte

La direction commerciale ne veut pas d'un outil de BI. Elle veut **une page** pour la réunion du lundi :

- le montant des pistes par étape, et ce qui a été gagné ce mois-ci ;
- un filtre par commercial, partageable par lien ;
- les pistes sans activité depuis 30 jours ;
- les mêmes chiffres **demandables à Claude** (« Combien avons-nous gagné ce mois-ci ? »).

Les données sont déjà dans le CRM (exemple 1). Le tableau de bord ne doit **pas copier** ces données ni contourner ses droits.

## Ce que la contrainte exige du SDK

| Besoin                                 | Réponse du SDK                                                                                  |
| -------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Réutiliser les données d'un autre tool | `uses` dans la config et `ctx.tools.<nom>.call(...)` : un tool appelle les actions d'un autre   |
| Respecter les droits                   | L'appel entre tools se fait **avec l'identité de la personne** : pas de super-utilisateur caché |
| Calculer des indicateurs               | Des actions d'agrégation dans le tool de pilotage, exposées aussi à Claude                      |
| Une page légère                        | Une vue React, avec des hooks et des composants de graphique                                    |
| Un filtre partageable                  | Des paramètres de vue liés à l'URL (`params`)                                                   |
| Réserver la page à la direction        | `access` sur la vue, comme sur une action                                                       |

## L'arborescence

```text
pilotage/
├── forgeron.config.ts
├── actions/
│   └── sales/
│       ├── summary.ts         # → sales.summary
│       └── stale.ts           # → sales.stale
├── views/
│   └── lundi.tsx              # → /lundi
└── tests/
```

## La configuration

```ts
// forgeron.config.ts
import { defineConfig } from "forgeron";

export default defineConfig({
  name: "pilotage",
  title: "Pilotage commercial",
  interfaces: { mcp: true, web: true, cli: true },

  // Dépendances : le tool appelle les actions de ces tools, avec une version minimale
  uses: { crm: "^1.4.0" },

  roles: {
    direction: { label: "Direction", grants: ["read"] },
  },
});
```

`uses` sert à trois choses : générer les types des actions du CRM, refuser un déploiement si la version du CRM en production est incompatible, et afficher la dépendance dans la console.

## Les actions

```ts
// actions/sales/summary.ts
import { action, z } from "forgeron";

export default action({
  description: "Montant des pistes par étape et montant gagné sur une période.",
  access: "read",
  input: z.object({
    owner: z.string().email().optional().describe("Limiter à un commercial"),
    since: z.string().date().optional().describe("Début de période, par défaut le 1er du mois"),
  }),
  async run({ input, tools, now }) {
    const since = input.since ?? now().startOf("month").toISODate();
    const deals = await tools.crm.call("deals.list", { owner: input.owner });

    const byStage = Object.groupBy(deals, (d) => d.stage);
    const totals = Object.entries(byStage).map(([stage, ds]) => ({
      stage,
      count: ds!.length,
      amount: ds!.reduce((s, d) => s + (d.amount ?? 0), 0),
    }));
    const won = deals
      .filter((d) => d.stage === "won" && d.updated_at >= since)
      .reduce((s, d) => s + (d.amount ?? 0), 0);

    return { since, totals, won };
  },
});
```

`tools.crm.call("deals.list", …)` est typé à partir du manifeste du CRM. L'appel passe par la plateforme avec **l'identité de la personne** : si elle n'a pas accès à `deals.list` dans le CRM, le tableau de bord échoue avec `FORBIDDEN`, sans rien montrer.

`now()` est l'horloge fournie par le contexte : elle respecte le fuseau de l'espace et se fige dans les tests.

## La vue

```tsx
// views/lundi.tsx
import { defineView, useAction, useParams } from "forgeron/react";
import { Page, Stat, BarChart, Table, Select } from "@forgeron/ui";
import { z } from "forgeron";

export default defineView({
  title: "Réunion du lundi",
  path: "/lundi",
  access: "read",
  params: z.object({ owner: z.string().email().optional() }), // ?owner=… dans l'URL

  component() {
    const [params, setParams] = useParams();
    const summary = useAction("sales.summary", { owner: params.owner });
    const stale = useAction("sales.stale", { owner: params.owner, days: 30 });
    const owners = useAction("crm.users.list", {}); // action d'un tool déclaré dans uses

    return (
      <Page
        title="Réunion du lundi"
        actions={
          <Select
            label="Commercial"
            value={params.owner}
            options={owners.data}
            onChange={(owner) => setParams({ owner })}
          />
        }
      >
        <Stat label="Gagné ce mois-ci" value={summary.data?.won} format="currency" />
        <BarChart data={summary.data?.totals} x="stage" y="amount" />
        <Table
          title="Sans activité depuis 30 jours"
          rows={stale.data?.items}
          columns={["title", "company", "owner_email", "updated_at"]}
        />
      </Page>
    );
  },
});
```

- `useAction` gère le chargement, les erreurs et le rafraîchissement ; `useMutation` sert aux écritures (exemple 1).
- `@forgeron/ui` reprend le design system Forgeron (noir et blanc, angles vifs). Son usage est conseillé, pas obligatoire : n'importe quel composant React fonctionne.
- La page est servie sous `https://acme.forgeron.app/t/pilotage/lundi?owner=ely@acme.fr`, derrière le SSO.

## Ce que voient les utilisateurs

| Interface    | Exemple                                                              |
| ------------ | -------------------------------------------------------------------- |
| Web          | la page `/lundi`, filtrée par lien                                   |
| Claude (MCP) | « Combien avons-nous gagné ce mois-ci ? » → `pilotage_sales_summary` |
| CLI          | `forgeron pilotage sales summary --owner ely@acme.fr --json`         |

## Ce que l'exemple décide pour le SDK

- Les tools se **composent** : `uses` déclare une dépendance versionnée, `ctx.tools` appelle les actions d'un autre tool, avec les droits de la personne.
- Une vue est déclarée comme une action : `path`, `access`, `params` validés par Zod.
- Les indicateurs sont des **actions**, donc disponibles aussi pour Claude et le CLI : la vue n'a pas de logique cachée.
- `ctx.now()` fournit une horloge contrôlable.
- `@forgeron/ui` est une bibliothèque de composants optionnelle, alignée sur le design system.
