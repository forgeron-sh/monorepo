// The marketplaces of the preview harness (D-116): the official catalogue and Edicia's repository,
// with what a sync and an install answer. Nothing here reaches GitHub.

interface MockTool {
  name: string;
  title: string;
  summary: string;
  version: string;
  resources: string[];
  installed: boolean;
}

const ODOO_README = `# Odoo gateway

Odoo support tickets from Claude, with each person's own permissions.

| Action          | Access  | What it does                                           |
| --------------- | ------- | ------------------------------------------------------ |
| \`tickets.list\`  | \`read\`  | Lists tickets, by default those assigned to the caller |
| \`tickets.reply\` | \`write\` | Adds a customer-visible reply (asks for confirmation)  |
`;

const ODOO_GUIDE = `# Odoo depuis Claude

Retrouvez vos tickets du support Odoo et répondez aux collectivités sans quitter Claude.

- « Quels sont mes tickets ouverts ? »
- « Réponds au ticket 12345 que le matériel part lundi. »
`;

export function createMarketplacesMock(now: () => Date) {
  const marketplaces = [
    {
      id: "official",
      repo: "forgeron-sh/templates",
      title: null as string | null,
      official: true,
      hasToken: false,
      syncedAt: null as string | null,
      syncError: null as string | null,
    },
    {
      id: "mp-edicia",
      repo: "edicia-sh/tools",
      title: "Outils Edicia" as string | null,
      official: false,
      hasToken: true,
      syncedAt: new Date(now().getTime() - 3 * 3600_000).toISOString() as string | null,
      syncError: null as string | null,
    },
  ];
  const offers: Record<string, MockTool[]> = {
    official: [
      {
        name: "crm",
        title: "CRM",
        summary: "Companies, contacts and leads, usable from Claude.",
        version: "1.4.1",
        resources: ["resources.db", "resources.files"],
        installed: true,
      },
      {
        name: "inventory",
        title: "Data hub",
        summary: "A business data repository, fed by imports and syncs.",
        version: "0.3.0",
        resources: ["resources.db", "resources.connectors.microsoft"],
        installed: false,
      },
    ],
    "mp-edicia": [
      {
        name: "odoo",
        title: "Odoo gateway",
        summary: "Retrouvez vos tickets du support et répondez aux collectivités depuis Claude.",
        version: "1.0.0",
        resources: ["resources.network"],
        installed: false,
      },
    ],
  };

  const card = (id: string, tool: MockTool) => ({
    ...tool,
    description: tool.summary,
    publishedAt: new Date(now().getTime() - 2 * 86_400_000).toISOString(),
    readme: tool.name === "odoo" ? ODOO_README : `# ${tool.title}\n\n${tool.summary}\n`,
    guide: tool.name === "odoo" ? ODOO_GUIDE : null,
    interfaces: { mcp: true, api: tool.name !== "odoo", cli: true, web: false },
    profiles:
      tool.name === "odoo"
        ? [
            { name: "support", label: "Support" },
            { name: "reader", label: "Read-only" },
          ]
        : [{ name: "commercial", label: "Sales" }],
    actions:
      tool.name === "odoo"
        ? [
            { name: "tickets.list", access: "read", description: "Lists tickets." },
            { name: "tickets.reply", access: "write", description: "Replies to a customer." },
          ]
        : [{ name: "deals.list", access: "read", description: "Lists deals." }],
    network: tool.name === "odoo" ? ["*.odoo.com"] : [],
    secrets:
      tool.name === "odoo" ? [{ name: "ODOO_URL", why: "Address of the Odoo instance" }] : [],
    userSecrets: tool.name === "odoo" ? [{ name: "ODOO_API_KEY", label: "Odoo API key" }] : [],
    connectors: [],
    database: tool.resources.includes("resources.db"),
    changelog: [{ type: "added", summary: `First version in ${id}` }],
  });

  return {
    /** The answer to a marketplace route, or `undefined` for a path that is not one. */
    route(path: string, method: string, body: { repo?: string; token?: string } | undefined) {
      if (path === "/api/marketplaces" && method === "GET")
        return { status: 200, body: { marketplaces } };
      if (path === "/api/marketplaces" && method === "POST") {
        const repo = String(body?.repo ?? "");
        if (!/^[\w-]+\/[\w.-]+$/.test(repo)) {
          return {
            status: 400,
            body: { error: "INVALID", message: `"${repo}" is not owner/name.` },
          };
        }
        const added = {
          id: `mp-${marketplaces.length}`,
          repo,
          title: null,
          official: false,
          hasToken: !!body?.token,
          syncedAt: null,
          syncError: null,
        };
        marketplaces.push(added);
        offers[added.id] = [];
        return { status: 201, body: added };
      }
      const one =
        /^\/api\/marketplaces\/([\w-]+)(?:\/(sync|tools)(?:\/([\w-]+)(?:\/(install))?)?)?$/.exec(
          path,
        );
      if (!one) return undefined;
      const m = marketplaces.find((x) => x.id === one[1]);
      if (!m)
        return {
          status: 404,
          body: { error: "NOT_FOUND", message: "There is no such marketplace." },
        };
      if (!one[2] && method === "DELETE") {
        marketplaces.splice(marketplaces.indexOf(m), 1);
        return { status: 204, body: undefined };
      }
      if (one[2] === "sync") {
        m.syncedAt = now().toISOString();
        return {
          status: 200,
          body: {
            title: m.title,
            tools: (offers[m.id] ?? []).map((t) => ({
              name: t.name,
              version: t.version,
              status: "current",
            })),
          },
        };
      }
      const tools = offers[m.id] ?? [];
      if (!one[3]) return { status: 200, body: { tools } };
      const tool = tools.find((t) => t.name === one[3]);
      if (!tool)
        return { status: 404, body: { error: "NOT_FOUND", message: "There is no such tool." } };
      if (one[4] === "install") {
        tool.installed = true;
        return {
          status: 201,
          body: {
            tool: tool.name,
            version: tool.version,
            approvals: tool.resources.map((resource) => ({ resource, kind: "resource.added" })),
          },
        };
      }
      return { status: 200, body: card(m.id, tool) };
    },
  };
}
