# Exemple 2 — Une passerelle Odoo

## La contrainte

L'entreprise garde Odoo pour sa comptabilité et son support, mais les équipes veulent interroger leurs tickets **depuis Claude**. Les règles :

- chaque personne se connecte avec son compte **Microsoft** (SSO de l'entreprise) ;
- chaque personne utilise **sa propre clé d'API Odoo**, saisie une fois, jamais visible du développeur ni des collègues ;
- Claude ne doit voir que ce que la personne verrait dans Odoo ;
- pas d'interface web : Claude et le terminal suffisent ;
- Odoo est lent : les listes de référence (équipes, étapes) doivent être mises en cache.

C'est exactement la passerelle MCP Odoo déjà construite à la main en interne. Avec Forgeron, elle devient un tool de quelques fichiers.

## Ce que la contrainte exige du SDK

| Besoin                                 | Réponse du SDK                                                                                           |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Un tool sans base de données           | `resources.db` absent : aucune base n'est créée                                                          |
| Une clé par personne                   | `resources.userSecrets` déclarés dans la config, collectés par la plateforme, lus avec `ctx.userSecrets` |
| SSO Microsoft                          | Réglé au niveau de l'espace ; le tool n'a rien à coder                                                   |
| N'appeler qu'Odoo                      | Une liste d'hôtes sortants autorisés (`resources.network`) ; tout autre appel est bloqué                 |
| Exposer seulement MCP et CLI           | `interfaces: { mcp: true, cli: true }`                                                                   |
| Mettre en cache                        | `resources.cache` et `ctx.cache` (KV), avec une durée de vie                                             |
| Remonter les erreurs d'Odoo proprement | `ToolError` avec un code, traduit pour chaque interface                                                  |

## L'arborescence

```text
odoo/
├── forgeron.config.ts
├── lib/
│   └── odoo.ts                   # client JSON-RPC minimal
├── actions/
│   ├── tickets/
│   │   ├── list.ts               # → tickets.list
│   │   ├── get.ts                # → tickets.get
│   │   └── reply.ts              # → tickets.reply
│   └── teams/
│       └── list.ts               # → teams.list
├── tests/
│   └── tickets.test.ts
└── .forgeron/project.json
```

## La configuration

```ts
// forgeron.config.ts
import { defineConfig, kv } from "forgeron";

export default defineConfig({
  name: "odoo",
  title: "Passerelle Odoo",
  description: "Tickets du support Odoo, avec les droits de chaque personne.",

  interfaces: { mcp: true, cli: true },

  resources: {
    // Secrets du tool : posés par l'admin (forgeron secrets set ODOO_URL)
    secrets: {
      ODOO_URL: { why: "Adresse de l'instance Odoo" },
      ODOO_DB: { why: "Nom de la base Odoo" },
    },
    // Secrets par personne : demandés à chacun à sa première utilisation
    userSecrets: {
      ODOO_API_KEY: {
        label: "Clé d'API Odoo",
        help: "Odoo › Préférences › Sécurité du compte › Nouvelle clé d'API",
        why: "Lire et répondre à vos tickets avec vos propres droits Odoo",
      },
      ODOO_LOGIN: { label: "Identifiant Odoo (e-mail)", why: "Vous identifier auprès d'Odoo" },
    },
    network: { allow: ["*.odoo.com", "odoo.acme.fr"], why: "Appels à l'API Odoo" },
    cache: kv(),
  },

  roles: {
    support: { label: "Support", grants: ["read", "write"] },
    lecteur: { label: "Lecture seule", grants: ["read"] },
  },
});
```

### Comment la clé de chaque personne est collectée

1. La personne ajoute le serveur MCP du tool dans Claude et se connecte avec Microsoft.
2. À son premier appel, la plateforme constate qu'il lui manque `ODOO_API_KEY`.
   - Sur MCP, l'appel renvoie une demande de saisie (élicitation MCP) ou, si le client ne la gère pas, un lien vers une page de la plateforme.
   - Sur le CLI, `forgeron odoo tickets list` demande la clé dans le terminal, ou on la pose avec `forgeron secrets set --user ODOO_API_KEY`.
3. La clé est chiffrée et rattachée à la personne et au tool. Le développeur ne peut pas la lire ; l'admin peut la révoquer.

## Le client Odoo

```ts
// lib/odoo.ts
import { ToolError, type Context } from "forgeron";

export function odoo(ctx: Context) {
  const url = ctx.secrets.ODOO_URL;
  const db = ctx.secrets.ODOO_DB;
  const login = ctx.userSecrets.ODOO_LOGIN;
  const key = ctx.userSecrets.ODOO_API_KEY;

  async function call<T>(model: string, method: string, args: unknown[], kwargs = {}): Promise<T> {
    const res = await ctx.fetch(`${url}/jsonrpc`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "call",
        params: {
          service: "object",
          method: "execute_kw",
          args: [db, login, key, model, method, args, kwargs],
        },
      }),
    });
    const body = await res.json();
    if (body.error) {
      const denied = /AccessDenied|AccessError/.test(body.error.data?.name ?? "");
      throw new ToolError(
        denied ? "FORBIDDEN" : "UPSTREAM",
        body.error.data?.message ?? "Erreur Odoo",
      );
    }
    return body.result as T;
  }

  return { call };
}
```

`ctx.fetch` est un `fetch` standard, filtré par `resources.network`. Comme la requête utilise la clé de la personne, **Odoo applique lui-même ses droits** : Claude ne voit que ce que la personne verrait.

## Les actions

```ts
// actions/tickets/list.ts
import { action, z } from "forgeron";
import { odoo } from "../../lib/odoo";

export default action({
  description: "Liste les tickets du support Odoo, par défaut ceux qui me sont assignés.",
  access: "read",
  input: z.object({
    mine: z.boolean().default(true).describe("Seulement mes tickets"),
    stage: z.string().optional().describe("Nom de l'étape, ex. « En cours »"),
    limit: z.number().int().max(100).default(20),
  }),
  // forgeron odoo tickets list --mine --stage "En cours"
  async run(ctx) {
    const { input } = ctx;
    const domain: unknown[] = [];
    if (input.mine) domain.push(["user_id.login", "=", ctx.userSecrets.ODOO_LOGIN]);
    if (input.stage) domain.push(["stage_id.name", "=", input.stage]);
    return odoo(ctx).call("helpdesk.ticket", "search_read", [domain], {
      fields: ["id", "name", "stage_id", "partner_id", "priority", "create_date"],
      limit: input.limit,
      order: "create_date desc",
    });
  },
});
```

```ts
// actions/teams/list.ts — mis en cache une heure, partagé par tous
export default action({
  description: "Liste les équipes du support Odoo.",
  access: "read",
  input: z.object({}),
  async run(ctx) {
    return ctx.cache.getOrSet("teams", { ttl: "1h", scope: "tool" }, () =>
      odoo(ctx).call("helpdesk.team", "search_read", [[]], { fields: ["id", "name"] }),
    );
  },
});
```

`scope: "tool"` partage le cache entre utilisateurs (une donnée de référence) ; `scope: "user"` (par défaut) le garde propre à chaque personne, pour ne jamais exposer à quelqu'un une donnée lue avec la clé d'un autre.

```ts
// actions/tickets/reply.ts
export default action({
  description: "Ajoute une réponse visible du client sur un ticket.",
  access: "write",
  confirm: true,
  input: z.object({ id: z.number().int(), message: z.string().min(1) }),
  cli: { args: ["id", "message"] },
  async run(ctx) {
    await odoo(ctx).call("helpdesk.ticket", "message_post", [[ctx.input.id]], {
      body: ctx.input.message,
      message_type: "comment",
      subtype_xmlid: "mail.mt_comment",
    });
    return { ok: true };
  },
});
```

## Les tests

```ts
// tests/tickets.test.ts
import { it, expect } from "vitest";
import { createTestTool, mockFetch } from "forgeron/testing";

it("traduit un refus d'Odoo en FORBIDDEN", async () => {
  const tool = await createTestTool({
    secrets: { ODOO_URL: "https://acme.odoo.com", ODOO_DB: "acme" },
    as: { roles: ["support"], userSecrets: { ODOO_LOGIN: "ely@acme.fr", ODOO_API_KEY: "test" } },
    fetch: mockFetch({
      "POST https://acme.odoo.com/jsonrpc": {
        error: { data: { name: "odoo.exceptions.AccessError", message: "Accès refusé" } },
      },
    }),
  });
  await expect(tool.call("tickets.list", {})).rejects.toMatchObject({ code: "FORBIDDEN" });
});
```

## Ce que voient les utilisateurs

| Interface    | Exemple                                                            |
| ------------ | ------------------------------------------------------------------ |
| Claude (MCP) | « Quels tickets urgents me sont assignés ? » → `odoo_tickets_list` |
| CLI          | `forgeron odoo tickets list --stage "En cours" --json`             |
| API, Web     | non exposées (`interfaces`)                                        |

## Ce que l'exemple décide pour le SDK

- Un tool peut n'avoir **ni base ni vue** : la config déclare ce qui existe.
- Deux niveaux de secrets : du tool (`secrets`) et de la personne (`userSecrets`), avec un parcours de collecte géré par la plateforme sur chaque interface.
- Les appels sortants sont **interdits par défaut** ; `resources.network.allow` liste les hôtes autorisés, avec un `why` affiché à l'admin.
- `ctx.cache` a une portée par personne par défaut, pour éviter les fuites entre utilisateurs.
- Les erreurs passent par `ToolError` et des codes communs : `NOT_FOUND`, `FORBIDDEN`, `INVALID`, `CONFLICT`, `UPSTREAM`, `RATE_LIMITED`.
- Le code partagé vit dans `lib/`, hors de `actions/`, et n'est pas exposé.
