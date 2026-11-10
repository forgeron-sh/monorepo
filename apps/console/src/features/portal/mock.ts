import type { CatalogTool, ToolCardData } from "./catalog";

// A catalog in memory for the local harness and the tests. Names, addresses and values are made up;
// there is no secret in it. The shapes are those of docs/console-ux.md.

const all = (extra: Partial<CatalogTool["interfaces"]> = {}) => ({
  mcp: true,
  api: true,
  cli: true,
  web: true,
  ...extra,
});

const role = (name: string) => ({ name, label: name[0]!.toUpperCase() + name.slice(1) });

export const MOCK_TOOLS: CatalogTool[] = [
  {
    name: "crm",
    title: "CRM",
    summary: "Contacts, companies and deals, with a call log you can search in plain words.",
    icon: null,
    productionVersion: "1.4.0",
    interfaces: all(),
    access: "granted",
    roles: [role("developer"), role("sales")],
  },
  {
    name: "odoo",
    title: "Odoo gateway",
    summary: "Read tickets and quotes from Odoo without leaving Claude.",
    icon: null,
    productionVersion: "2.0.3",
    interfaces: all({ web: false }),
    access: "granted",
    roles: [role("developer")],
  },
  {
    name: "inventory",
    title: "Inventory",
    summary: "Equipment, loans and returns for the whole company.",
    icon: null,
    productionVersion: "0.2.0",
    interfaces: all({ cli: false }),
    access: "requestable",
    roles: [role("logistics"), role("admin")],
  },
  {
    name: "leave",
    title: "Leave requests",
    summary: "Ask for time off and see who is away.",
    icon: null,
    productionVersion: null,
    interfaces: { mcp: true, api: false, cli: false, web: true },
    access: "requestable",
    roles: [role("hr")],
  },
];

/** A README with everything the renderer supports, and a hostile paragraph that must stay inert. */
export const MOCK_README = [
  "# CRM",
  "",
  'Contacts, companies and deals. Ask Claude *"who did we last speak to at Acme?"* and get an answer',
  "with the call it comes from.",
  "",
  "![The contact list](./img/contacts.svg)",
  "",
  "## What you can do",
  "",
  "- Find a contact by name, company or what was said in a call",
  "- Log a call, with the follow-up date",
  "- Merge two records that are the same person",
  "",
  "![Merging two contacts](img/merge.svg)",
  "",
  "## Before you start",
  "",
  "- [x] Your admin gave you the `sales` or `developer` role",
  "- [x] You are signed in to the console",
  "- [ ] You connected your HubSpot account (asked on first use)",
  "",
  "## Actions",
  "",
  "| Action | What it does | Who |",
  "| --- | --- | --- |",
  "| `crm.contacts.list` | Lists contacts, newest first | everyone |",
  "| `crm.contacts.update` | Changes a contact | sales, developer |",
  "| `crm.contacts.delete` | Deletes a contact for good | admin |",
  "",
  "## Use it from the terminal",
  "",
  "```bash",
  "forgeron crm contacts list --company acme",
  "forgeron crm contacts update ada --phone '+33 1 23 45 67 89'",
  "```",
  "",
  "Or from a script, with a personal token:",
  "",
  "```ts",
  "const response = await fetch(`${base}/crm/contacts?company=acme`, {",
  "  headers: { authorization: `Bearer ${token}` },",
  "});",
  "```",
  "",
  "> A deleted contact cannot be restored. Ask an admin before you merge a large batch.",
  "",
  "More in the [CRM guide](https://example.com/crm-guide) or [below](#actions).",
  "",
  "## Not trusted",
  "",
  "This part is hostile on purpose. Nothing of it may run or load.",
  "",
  "<script>document.body.dataset.pwned = '1'</script>",
  "",
  '<img src="x" onerror="document.body.dataset.pwned = \'1\'">',
  "",
  "[Click for a prize](javascript:alert(1)) and [this one](data:text/html;base64,PHNjcmlwdD48L3NjcmlwdD4=)",
  "",
  "![Tracking pixel](https://evil.example/pixel.gif)",
  "",
  "![](img/no-alt.svg)",
].join("\n");

const CHANGELOG = [
  "Merge two contacts from the contact page",
  "Fix: the call log kept the time zone of the server",
];

const asset = (tool: string, path: string, size: number) => ({
  path,
  type: "image/svg+xml",
  size,
  url: `/console-api/api/catalog/${tool}/assets/${path}?v=mock`,
});

export function mockToolCard(name: string, admin = false): ToolCardData | undefined {
  const tool = MOCK_TOOLS.find((t) => t.name === name);
  if (!tool) return undefined;
  const allowed = admin || tool.access === "granted";
  return {
    ...tool,
    access: admin ? "granted" : tool.access,
    readme: name === "crm" ? MOCK_README : `# ${tool.title}\n\n${tool.summary}\n`,
    guide: name === "crm" ? `# ${tool.title}\n\n${tool.summary}\n` : null,
    assets: [asset(name, "img/contacts.svg", 1400), asset(name, "img/merge.svg", 900)],
    connect: {
      mcp: tool.interfaces.mcp ? { url: `https://demo.fabriks.example/t/${name}/mcp` } : null,
      api: tool.interfaces.api ? { baseUrl: `https://demo.fabriks.example/t/${name}/api` } : null,
      cli: tool.interfaces.cli ? { command: `forgeron ${name} --help` } : null,
    },
    requiredSecrets:
      name === "crm" ? [{ name: "HUBSPOT_TOKEN", why: "Reads and writes deals" }] : [],
    requiredUserSecrets:
      name === "crm"
        ? [{ name: "HUBSPOT_PERSONAL_KEY", label: "Your HubSpot key", why: "To log calls as you" }]
        : [],
    connectors: name === "crm" ? [{ name: "hubspot", type: "oauth", mode: "delegated" }] : [],
    yourAccess: [
      { action: `${name}.contacts.list`, allowed },
      { action: `${name}.contacts.update`, allowed },
      { action: `${name}.contacts.delete`, allowed: admin },
    ],
    lastRelease: tool.productionVersion
      ? { version: tool.productionVersion, date: "2026-11-02T09:30:00.000Z", changelog: CHANGELOG }
      : null,
  };
}

/** What the platform answers for the catalog routes, for the harness; `undefined` for any other path. */
export function mockCatalogRoute(path: string, admin: boolean): unknown {
  if (path === "/api/catalog") {
    // An admin may use every tool; a member only the granted ones.
    return { tools: MOCK_TOOLS.map((t) => (admin ? { ...t, access: "granted" } : t)) };
  }
  const card = /^\/api\/catalog\/([\w-]+)$/.exec(path);
  return card ? mockToolCard(card[1]!, admin) : undefined;
}
