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
    interfaceNote: "Query it from Claude, a REST API, the terminal and the tool's web interface.",
    cli: 'forgeron crm contacts search "Durand"',
    output: ["2 contacts found", "→ --json for script-friendly output"],
    actions: [
      { name: "contacts.search", access: "Read" },
      { name: "contacts.update", access: "Write" },
      { name: "deals.move", access: "Write" },
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
    label: "Odoo gateway",
    file: "tools/odoo/forgeron.tool.ts",
    version: "odoo · v0.3.1",
    interfaces: ["MCP", "CLI"],
    interfaceNote:
      "Each person signs in with Microsoft and uses their own Odoo API key, from Claude or the terminal.",
    cli: "forgeron odoo tickets list --mine",
    output: ["Signed in via Microsoft SSO", "3 open tickets"],
    actions: [
      { name: "tickets.list", access: "Read" },
      { name: "tickets.reply", access: "Write" },
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
    label: "Contact record",
    file: "tools/contacts/forgeron.tool.ts",
    version: "contacts · v2.0.0",
    interfaces: ["MCP", "API", "CLI"],
    interfaceNote: "A shared directory, available from Claude, the terminal or your other tools.",
    cli: "forgeron contacts people get sophie@acme.fr",
    output: ["1 record · updated 2 days ago"],
    actions: [
      { name: "people.get", access: "Read" },
      { name: "people.upsert", access: "Write" },
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
    label: "Dashboard",
    file: "tools/crm/views/pipeline.tsx",
    version: "crm · v1.4.0",
    interfaces: ["Web"],
    interfaceNote:
      "A lightweight React page; data arrives with the signed-in person's permissions.",
    cli: "forgeron crm deals list --stage won --json",
    output: ["The same action powers the view and the terminal"],
    actions: [{ name: "deals.list", access: "Read" }],
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
