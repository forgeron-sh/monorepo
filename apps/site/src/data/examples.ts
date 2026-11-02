export interface Example {
  id: string;
  label: string;
  file: string;
  version: string;
  interfaces: string[];
  interfaceNote: string;
  cli: string;
  output: string[];
  actions: Array<{ name: string; access: string }>;
  code: string[];
}

export const examples: Example[] = [
  {
    id: "crm",
    label: "CRM",
    file: "tools/crm/forgeron.tool.ts",
    version: "crm · v1.4.0",
    interfaces: ["MCP", "API", "Web", "CLI"],
    interfaceNote:
      "Interrogeable depuis Claude, une API REST, le terminal et l'interface web du tool.",
    cli: 'forgeron crm contacts search "Durand"',
    output: ["2 contacts trouvés", "→ --json pour une sortie exploitable dans vos scripts"],
    actions: [
      { name: "contacts.search", access: "Lecture" },
      { name: "contacts.update", access: "Écriture" },
      { name: "deals.move", access: "Écriture" },
    ],
    code: [
      'import { defineTool, action, z } from "forgeron";',
      "",
      "export default defineTool({",
      '  name: "crm",',
      '  interfaces: ["mcp", "api", "web"],',
      "  actions: {",
      '    "contacts.search": action({',
      "      input: z.object({ query: z.string() }),",
      '      access: "read",',
      "      run: ({ input, db }) => db.contacts.search(input.query),",
      "    }),",
      '    "deals.move": action({',
      "      input: z.object({ id: z.string(), stage: z.string() }),",
      '      access: "write",',
      "      run: ({ input, db }) => db.deals.move(input.id, input.stage),",
      "    }),",
      "  },",
      "});",
    ],
  },
  {
    id: "odoo",
    label: "Passerelle Odoo",
    file: "tools/odoo/forgeron.tool.ts",
    version: "odoo · v0.3.1",
    interfaces: ["MCP", "CLI"],
    interfaceNote:
      "Chaque personne se connecte avec Microsoft et utilise sa propre clé d'API Odoo, depuis Claude ou le terminal.",
    cli: "forgeron odoo tickets list --mine",
    output: ["Connecté via Microsoft SSO", "3 tickets ouverts"],
    actions: [
      { name: "tickets.list", access: "Lecture" },
      { name: "tickets.reply", access: "Écriture" },
    ],
    code: [
      'import { defineTool, action } from "forgeron";',
      'import { odoo } from "./client";',
      "",
      "export default defineTool({",
      '  name: "odoo",',
      '  interfaces: ["mcp"],',
      '  auth: { sso: "microsoft", userSecrets: ["ODOO_API_KEY"] },',
      "  actions: {",
      '    "tickets.list": action({',
      '      access: "read",',
      "      run: ({ secrets }) => odoo(secrets.ODOO_API_KEY).tickets(),",
      "    }),",
      "  },",
      "});",
    ],
  },
  {
    id: "contacts",
    label: "Fiche contact",
    file: "tools/contacts/forgeron.tool.ts",
    version: "contacts · v2.0.0",
    interfaces: ["MCP", "API", "CLI"],
    interfaceNote: "Un annuaire partagé, consulté depuis Claude, le terminal ou vos autres outils.",
    cli: "forgeron contacts people get sophie@acme.fr",
    output: ["1 fiche · mise à jour il y a 2 jours"],
    actions: [
      { name: "people.get", access: "Lecture" },
      { name: "people.upsert", access: "Écriture" },
    ],
    code: [
      'import { defineTool, action, table, z } from "forgeron";',
      "",
      'const people = table("people", {',
      "  name: z.string(),",
      "  email: z.string().email(),",
      "  company: z.string().optional(),",
      "});",
      "",
      "export default defineTool({",
      '  name: "contacts",',
      '  interfaces: ["mcp", "api"],',
      "  data: { people },",
      "});",
    ],
  },
  {
    id: "dash",
    label: "Tableau de bord",
    file: "tools/crm/views/pipeline.tsx",
    version: "crm · v1.4.0",
    interfaces: ["Web"],
    interfaceNote:
      "Une page React légère ; les données arrivent avec les droits de la personne connectée.",
    cli: "forgeron crm deals list --stage won --json",
    output: ["La même action alimente la vue et le terminal"],
    actions: [{ name: "deals.list", access: "Lecture" }],
    code: [
      'import { defineView, useAction } from "forgeron/react";',
      "",
      "export default defineView({",
      '  name: "pipeline",',
      "  render() {",
      '    const deals = useAction("crm.deals.list");',
      "    return <Kanban columns={deals.byStage()} />;",
      "  },",
      "});",
    ],
  },
];
