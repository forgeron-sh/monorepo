// A gateway in memory, for the local harness (`VITE_MOCK=1`, the `console-harness` preview): every
// console route answers from a small state that the writes change. Names, addresses and values are
// made up; there is no secret in it. Pick a scenario with `?mock=`:
//   ready (default) · fresh (nothing done yet) · member (not an admin) · signedout · error · slow

type Json = Record<string, any>;
const DAY = 24 * 60 * 60 * 1000;
const iso = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString();
const reply = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

export async function installMock(): Promise<void> {
  const scenario = new URLSearchParams(location.search).get("mock") ?? "ready";
  const fresh = scenario === "fresh";
  const state = {
    workspace: "demo",
    endpoint: "https://demo.fabriks.example",
    me: {
      id: "m1",
      email: "ada@acme.example",
      name: "ada",
      roles: scenario === "member" ? ["developer"] : ["admin"],
    },
    members: fresh
      ? [{ id: "m1", email: "ada@acme.example", name: "ada", roles: ["admin"] }]
      : [
          { id: "m1", email: "ada@acme.example", name: "ada", roles: ["admin"] },
          { id: "m2", email: "bob@acme.example", name: "bob", roles: ["developer"] },
          { id: "m3", email: "claire@acme.example", name: "claire", roles: [] },
        ],
    invitations: fresh
      ? []
      : [
          {
            email: "eve@acme.example",
            roles: ["developer"],
            invitedBy: "m1",
            expiresAt: iso(13 * DAY),
          },
          { email: "old@acme.example", roles: [], invitedBy: "m1", expiresAt: iso(-2 * DAY) },
        ],
    settings: {
      domains: ["acme.example"],
      defaultRole: "viewer",
      source: "install" as "install" | "console",
    },
    tools: fresh
      ? []
      : [
          {
            name: "crm",
            production: "1.4.0",
            pilot: "1.5.0",
            previews: [{ branch: "feat-contacts", version: "1.5.1" }],
          },
          {
            name: "inventory",
            production: null,
            pilot: null,
            previews: [{ branch: "main", version: "0.2.0" }],
          },
          { name: "odoo", production: "2.0.3", pilot: null, previews: [] },
        ],
    approvals: fresh
      ? []
      : [
          {
            tool: "crm",
            id: "v-crm-151",
            version: "1.5.1",
            approvals: [
              { id: "a1", resource: "resources.network", kind: "resource.added" },
              { id: "a2", resource: "resources.connectors.hubspot", kind: "resource.broadened" },
            ],
          },
        ],
    provider:
      scenario === "ready"
        ? ({
            kind: "entra",
            clientId: "00000000-demo-client",
            tenant: "11111111-2222-3333-4444-555555555555",
            groupRoles: {},
          } as Json)
        : null,
    audit: fresh
      ? []
      : [
          ["crm", "ada@acme.example", "deployment", "crm@1.5.1", "cli", "ok", 12 * 60_000],
          ["crm", "bob@acme.example", "action", "crm.contacts.update", "mcp", "ok", 25 * 60_000],
          [
            "crm",
            "bob@acme.example",
            "action",
            "crm.contacts.delete",
            "api",
            "denied",
            41 * 60_000,
          ],
          [
            "odoo",
            "ada@acme.example",
            "promotion",
            "odoo@2.0.3 → production",
            "cli",
            "ok",
            3 * 3_600_000,
          ],
          [
            "odoo",
            "claire@acme.example",
            "action",
            "odoo.tickets.list",
            "web",
            "ok",
            5 * 3_600_000,
          ],
          [
            "crm",
            "ada@acme.example",
            "access",
            "developer: crm.contacts.update",
            "web",
            "ok",
            26 * 3_600_000,
          ],
          [
            "inventory",
            "bob@acme.example",
            "action",
            "inventory.equipments.import",
            "cli",
            "error",
            3 * DAY,
          ],
          ["crm", "ada@acme.example", "approval", "resources.network", "web", "ok", 9 * DAY],
        ].map(([tool, actor, kind, subject, via, result, age], i) => ({
          id: `e${i}`,
          at: iso(-(age as number)),
          tool,
          actor,
          interface: via,
          kind,
          subject,
          result,
        })),
  };

  const matrix = (tool: string): Json => ({
    roles: ["admin", "developer", "viewer"],
    actions: [`${tool}.contacts.list`, `${tool}.contacts.update`, `${tool}.contacts.delete`],
    cells: Object.fromEntries(
      ["admin", "developer", "viewer"].map((role, r) => [
        role,
        Object.fromEntries(
          [`${tool}.contacts.list`, `${tool}.contacts.update`, `${tool}.contacts.delete`].map(
            (action, a) => {
              const allowed = a <= 2 - r;
              return [action, { default: allowed, allowed }];
            },
          ),
        ),
      ]),
    ),
  });

  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url = new URL(
      typeof input === "string" ? input : input instanceof URL ? input.href : input.url,
      location.href,
    );
    if (!url.pathname.startsWith("/console-api/")) return realFetch(input, init);
    if (scenario === "slow") await new Promise((r) => setTimeout(r, 3000));
    else await new Promise((r) => setTimeout(r, 120));
    const path = url.pathname.slice("/console-api".length);
    const method = (init?.method ?? "GET").toUpperCase();
    const body: Json = init?.body ? JSON.parse(String(init.body)) : {};
    const admin = state.me.roles.includes("admin");

    if (scenario === "signedout") return reply(401, { error: "UNAUTHENTICATED" });
    if (scenario === "error") return reply(500, { error: "INTERNAL" });
    if (path === "/api/workspace") {
      return reply(200, {
        workspace: state.workspace,
        endpoint: state.endpoint,
        person: { ...state.me, admin },
        setup: {
          members: state.members.length,
          invitations: state.invitations.length,
          tools: state.tools.length,
          deployed: state.tools.filter((t) => t.production || t.pilot || t.previews.length).length,
          called: !fresh,
        },
        ...(admin
          ? {
              signIn: {
                email: { enabled: true, mail: "console" },
                oidc: {
                  enabled: true,
                  configured: state.provider !== null && state.provider.kind !== "saml",
                },
                saml: { enabled: true, configured: state.provider?.kind === "saml" },
              },
              install: { baseDomain: "fabriks.example" },
            }
          : {}),
      });
    }
    if (path === "/api/tools") return reply(200, { tools: state.tools });
    const needAdmin = [
      "/api/members",
      "/api/invitations",
      "/api/membership-settings",
      "/api/identity-provider",
      "/api/approvals",
      "/api/audit",
    ];
    if (!admin && needAdmin.some((p) => path.startsWith(p)))
      return reply(403, { error: "FORBIDDEN", message: "This is for admins." });

    if (path === "/api/members" && method === "GET")
      return reply(200, {
        members: state.members,
        invitations: state.invitations,
        settings: state.settings,
      });
    const member = /^\/api\/members\/(\w+)$/.exec(path);
    if (member && method === "PATCH") {
      const m = state.members.find((x) => x.id === member[1]);
      if (!m) return reply(404, { error: "NOT_FOUND", message: "No such member." });
      if (m.id === "m1" && !body.roles.includes("admin"))
        return reply(409, {
          error: "LAST_ADMIN",
          message: "The last administrator cannot be demoted. Make someone else an admin first.",
        });
      m.roles = body.roles;
      return reply(200, m);
    }
    if (member && method === "DELETE") {
      if (member[1] === "m1")
        return reply(409, {
          error: "LAST_ADMIN",
          message: "The last administrator cannot be removed. Make someone else an admin first.",
        });
      state.members = state.members.filter((x) => x.id !== member[1]);
      return reply(204);
    }
    if (path === "/api/invitations" && method === "POST") {
      state.invitations.push({
        email: body.email,
        roles: body.roles,
        invitedBy: "m1",
        expiresAt: iso(14 * DAY),
      });
      return reply(201, { invitation: { email: body.email, roles: body.roles }, notified: true });
    }
    const invitation = /^\/api\/invitations\/(.+)$/.exec(path);
    if (invitation && method === "DELETE") {
      state.invitations = state.invitations.filter(
        (i) => i.email !== decodeURIComponent(invitation[1]!),
      );
      return reply(204);
    }
    if (path === "/api/membership-settings" && method === "PUT") {
      state.settings = {
        domains: body.domains,
        defaultRole: body.defaultRole ?? "",
        source: "console",
      };
      return reply(200, state.settings);
    }
    if (path === "/api/identity-provider") {
      if (method === "GET") return reply(200, { provider: state.provider });
      if (method === "DELETE") {
        state.provider = null;
        return reply(204);
      }
      const { clientSecret: _kept, ...rest } = body;
      state.provider = { groupRoles: {}, ...rest };
      return reply(200, { provider: state.provider });
    }
    if (path === "/api/approvals" && method === "GET")
      return reply(200, { versions: state.approvals });
    const decision = /^\/api\/approvals\/(\w+)$/.exec(path);
    if (decision && method === "POST") {
      state.approvals = state.approvals
        .map((v) => ({ ...v, approvals: v.approvals.filter((a) => a.id !== decision[1]) }))
        .filter((v) => v.approvals.length > 0);
      return reply(200, { id: decision[1], status: body.decision });
    }
    if (path === "/api/audit") return reply(200, { entries: state.audit });
    const tool = /^\/api\/tools\/([\w-]+)\/(access-matrix|secrets-status)$/.exec(path);
    if (tool?.[2] === "access-matrix")
      return method === "GET" ? reply(200, matrix(tool[1]!)) : reply(204);
    if (tool?.[2] === "secrets-status")
      return reply(200, {
        secrets: [
          {
            name: "ODOO_KEY",
            environments: { preview: "set", pilot: "set", production: "missing" },
          },
          {
            name: "HUBSPOT_TOKEN",
            environments: { preview: "set", pilot: "missing", production: "missing" },
          },
        ],
      });
    return reply(404, { error: "NOT_FOUND" });
  };
}
