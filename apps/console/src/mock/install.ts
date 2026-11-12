// A gateway in memory, for the local harness (`VITE_MOCK=1`, the `console-harness` preview): every
// console route answers from a small state that the writes change. Names, addresses and values are
// made up; there is no secret in it. Pick a scenario with `?mock=`:
//   ready (default) · fresh (nothing done yet) · member (a developer, not an admin) · person (no
//   role given: member only, D-128) · signedout · error · slow

import { mockCatalogRoute, mockLibraryRoute } from "../features/portal/mock";
import { mockDatabase } from "./database";
import { createMarketplacesMock } from "./marketplaces";
import { createToolsMock } from "./tools";

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
    // Who may use each channel (D-129): crm has no rule (open, as before libraries), inventory is
    // published to two roles, the others are drafts.
    availability: {
      inventory: { mode: "roles", roles: ["developer", "viewer"], updatedAt: iso(-DAY) },
    } as Record<string, { mode: string; roles?: string[]; people?: string[]; updatedAt: string }>,
    workspace: "demo",
    github: !fresh,
    endpoint: "https://demo.fabriks.example",
    me: {
      id: "m1",
      email: "ada@acme.example",
      name: "ada",
      roles: scenario === "member" ? ["developer"] : scenario === "person" ? [] : ["admin"],
    },
    members: fresh
      ? [{ id: "m1", email: "ada@acme.example", name: "ada", roles: ["admin"] }]
      : [
          { id: "m1", email: "ada@acme.example", name: "ada", roles: ["admin"] },
          { id: "m2", email: "bob@acme.example", name: "bob", roles: ["developer"] },
          { id: "m3", email: "claire@acme.example", name: "claire", roles: [] },
        ],
    teams: (fresh
      ? []
      : [
          {
            id: "product",
            name: "Product",
            description: "Roadmap and design",
            members: ["m1", "m2"],
          },
          { id: "support", name: "Support", description: "", members: ["m3"] },
        ]) as Array<{ id: string; name: string; description: string; members: string[] }>,
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
            channels: [{ channel: "staging", version: "1.5.0" }],
            previews: [
              { branch: "feat-export", version: "1.5.1" },
              { branch: "feat-contacts-import", version: "1.5.0" },
              { branch: "fix-accents-search", version: "1.3.0" },
              { branch: "main", version: "1.4.0" },
            ],
          },
          {
            name: "inventory",
            production: null,
            previews: [{ branch: "main", version: "0.2.0" }],
          },
          { name: "odoo", production: "2.0.3", previews: [] },
        ],
    sources: (fresh
      ? {}
      : {
          crm: {
            kind: "repo",
            repo: "acme/crm",
            productionBranch: "main",
            autoUpdate: false,
            update: {
              version: "1.5.1",
              branch: "main",
              changelog: ["Export contacts to CSV", "Faster search with accents"],
              approvals: ["resources.network"],
            },
            // A permanent channel an admin added (D-125): it follows `staging`.
            channels: [
              {
                name: "staging",
                follows: "staging",
                autoUpdate: true,
                serves: "1.5.0",
                update: null,
              },
            ],
          },
          odoo: {
            kind: "marketplace",
            marketplace: "official",
            productionBranch: "main",
            autoUpdate: true,
            update: null,
          },
        }) as Record<string, Json>,
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

  const toolsMock = createToolsMock(state.endpoint, iso);
  const marketplacesMock = createMarketplacesMock(() => new Date());
  // D-127: the tool's profiles, what each workspace role is given, and the matrix that follows.
  const matrix = (tool: string): Json => {
    const actions = [`${tool}.contacts.list`, `${tool}.contacts.update`, `${tool}.contacts.delete`];
    const levels = { [actions[0]!]: "read", [actions[1]!]: "write", [actions[2]!]: "delete" };
    const given: Record<string, string[]> = {
      admin: ["delete", "read", "write"],
      member: ["read"],
      developer: ["read", "write"],
    };
    return {
      roles: Object.keys(given),
      actions,
      views: [],
      subjects: actions,
      levels,
      permissions: ["delete", "read", "write"],
      profiles: {
        user: { label: "User", grants: ["read"], default: true },
        manager: { label: "Manager", grants: ["read", "write"], default: false },
      },
      mapping: {
        admin: { kind: "all" },
        member: { kind: "profile", profile: "user" },
        developer: { kind: "profile", profile: "manager" },
      },
      cells: Object.fromEntries(
        Object.entries(given).map(([role, held]) => [
          role,
          Object.fromEntries(
            actions.map((action) => {
              const allowed = held.includes(levels[action]!);
              return [action, { default: allowed, allowed }];
            }),
          ),
        ]),
      ),
    };
  };

  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url = new URL(
      typeof input === "string" ? input : input instanceof URL ? input.href : input.url,
      location.href,
    );
    const platformRoute = ["/rollback", "/deploy"].includes(url.pathname);
    if (!url.pathname.startsWith("/console-api/") && !platformRoute) return realFetch(input, init);
    if (scenario === "slow") await new Promise((r) => setTimeout(r, 3000));
    else await new Promise((r) => setTimeout(r, 120));
    const path = platformRoute ? url.pathname : url.pathname.slice("/console-api".length);
    const method = (init?.method ?? "GET").toUpperCase();
    const body: Json = init?.body ? JSON.parse(String(init.body)) : {};
    const admin = state.me.roles.includes("admin");

    if (platformRoute) {
      if (!admin)
        return reply(403, {
          error: { code: "FORBIDDEN", message: "Only an administrator can do this." },
        });
      const sent: Json = init?.body ? JSON.parse(String(init.body)) : {};
      if (path === "/rollback")
        return reply(200, {
          tool: sent.tool,
          version: sent.channel ? "1.4.0" : toolsMock.rollback(),
          environment: sent.environment ?? "production",
          ...(sent.channel ? { channel: sent.channel } : {}),
        });
      toolsMock.close(sent.branch);
      return reply(200, { tool: sent.tool, branch: sent.branch, removed: true });
    }
    if (scenario === "signedout") return reply(401, { error: "UNAUTHENTICATED" });
    if (scenario === "error") return reply(500, { error: "INTERNAL" });
    if (path === "/api/workspace") {
      return reply(200, {
        workspace: state.workspace,
        endpoint: state.endpoint,
        // The gateway adds `member`, which everyone holds (D-128).
        person: { ...state.me, roles: [...state.me.roles, "member"], admin },
        setup: {
          members: state.members.length,
          invitations: state.invitations.length,
          tools: state.tools.length,
          deployed: state.tools.filter((t) => t.production || t.previews.length).length,
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
              install: { baseDomain: "fabriks.example", version: "0.2.0", commit: "f95958b0c1a2" },
            }
          : {}),
      });
    }
    if (path.startsWith("/api/library")) {
      const answer = mockLibraryRoute(path, method, admin);
      if (answer) return reply(answer.status, answer.body);
    }
    const pilotRule = /^\/api\/tools\/([\w-]+)\/previews\/(~?[\w.-]+)\/availability$/.exec(
      decodeURIComponent(path),
    );
    if (pilotRule) {
      if (!admin) return reply(403, { error: "FORBIDDEN", message: "This is for admins." });
      const key = `${pilotRule[1]}@${pilotRule[2]}`;
      if (method === "PUT") {
        state.availability[key] = {
          mode: String(body.mode),
          roles: body.roles ?? [],
          people: body.people ?? [],
          updatedAt: iso(0),
        };
      }
      const rule = state.availability[key];
      return reply(
        200,
        rule
          ? {
              mode: rule.mode,
              roles: rule.roles ?? [],
              people: rule.people ?? [],
              updatedAt: rule.updatedAt,
            }
          : { mode: "open", roles: [], people: [], updatedAt: null },
      );
    }
    // Where a tool comes from, its permanent channels and their updates (D-121, D-125).
    const sourceOf = /^\/api\/tools\/([\w-]+)\/(source|update|channels)(?:\/([\w-]+))?$/.exec(path);
    if (sourceOf && sourceOf[1] !== "from-repository") {
      if (!admin) return reply(403, { error: "FORBIDDEN", message: "This is for admins." });
      const tool = sourceOf[1]!;
      const found = state.tools.find((t) => t.name === tool);
      const source = (state.sources[tool] ??= {
        kind: "repo",
        repo: `acme/${tool}`,
        productionBranch: "main",
        autoUpdate: false,
        update: null,
      });
      source.channels ??= [];
      const others: Json[] = source.channels;
      const address = (name: string) =>
        `https://${state.workspace}.fabriks.example/t/${tool}${name === "production" ? "" : `~${name}`}/`;
      const production = (): Json => ({
        name: "production",
        ...(source.kind === "repo" ? { follows: source.productionBranch } : {}),
        autoUpdate: source.autoUpdate,
        serves: found?.production ?? null,
        address: address("production"),
        update: source.update,
      });
      const view = (c: Json): Json => ({ ...c, address: address(c.name) });
      const answer = () => ({
        ...source,
        production: found?.production ?? null,
        channels: [production(), ...others.map(view)],
      });
      const [, , what, named] = sourceOf;
      if (what === "update" && method === "POST") {
        const channel = body.channel ?? "production";
        const target = channel === "production" ? source : others.find((c) => c.name === channel);
        if (!target?.update) return reply(404, { error: "NO_UPDATE", message: "No update waits." });
        const version = target.update.version;
        if (channel === "production" && found) found.production = version;
        else target.serves = version;
        target.update = null;
        return reply(200, { tool, channel, version });
      }
      if (what === "channels" && !named && method === "POST") {
        if (others.some((c) => c.name === body.name) || body.name === "production")
          return reply(409, { error: "ALREADY_EXISTS", message: `There is already ${body.name}.` });
        const added = {
          name: String(body.name),
          ...(body.follows ? { follows: String(body.follows) } : {}),
          autoUpdate: body.autoUpdate === true,
          serves: null,
          update: null,
        };
        others.push(added);
        return reply(201, view(added));
      }
      if (what === "channels" && named) {
        if (named === "production") {
          if (method === "PUT") {
            if (body.autoUpdate !== undefined) source.autoUpdate = body.autoUpdate;
            if (body.follows) source.productionBranch = body.follows;
          }
          return reply(200, production());
        }
        const channel = others.find((c) => c.name === named);
        if (!channel) return reply(404, { error: "NOT_FOUND", message: "No such channel." });
        if (method === "DELETE") {
          source.channels = others.filter((c) => c.name !== named);
          return reply(200, { removed: true });
        }
        if (method === "PUT") Object.assign(channel, body);
        return reply(200, view(channel));
      }
      if (method === "PUT") Object.assign(source, body);
      return reply(200, answer());
    }
    if (path === "/api/tools/from-repository" && method === "POST") {
      if (!admin) return reply(403, { error: "FORBIDDEN", message: "This is for admins." });
      if (state.tools.some((t) => t.name === body.name))
        return reply(409, { error: "ALREADY_EXISTS", message: `There is already ${body.name}.` });
      state.tools.push({ name: String(body.name), production: null, previews: [] });
      return reply(201, {
        tool: body.name,
        repo: body.repo,
        productionBranch: body.productionBranch ?? "main",
        token: "harness-token-not-a-real-one",
        expiresAt: iso(365 * DAY),
      });
    }
    if (/^\/api\/tools\/[\w-]+\/branches\/[^/]+\/data$/.test(path) && method === "POST") {
      return reply(200, {
        tables: [
          { name: "companies", rows: 6 },
          { name: "contacts", rows: 137 },
        ],
      });
    }
    const availability = /^\/api\/tools\/([\w-]+)\/availability$/.exec(path);
    if (availability) {
      if (!admin) return reply(403, { error: "FORBIDDEN", message: "This is for admins." });
      const tool = availability[1]!;
      if (method === "PUT") {
        state.availability[tool] = {
          mode: String(body.mode),
          roles: body.roles ?? [],
          people: body.people ?? [],
          updatedAt: iso(0),
        };
      }
      const rule = state.availability[tool];
      return reply(
        200,
        rule
          ? {
              mode: rule.mode,
              roles: rule.roles ?? [],
              people: rule.people ?? [],
              updatedAt: rule.updatedAt,
            }
          : { mode: tool === "crm" ? "open" : "nobody", roles: [], people: [], updatedAt: null },
      );
    }
    if (path.startsWith("/api/catalog")) {
      const answer = scenario === "empty" ? { tools: [] } : mockCatalogRoute(path, admin);
      return answer ? reply(200, answer) : reply(404, { error: "NOT_FOUND" });
    }
    if (path === "/api/tools")
      return reply(200, {
        tools: state.tools.map((t) => ({ ...t, ...toolsMock.summary(t.name) })),
      });
    const page = /^\/api\/tools\/([\w-]+)\/(branches|versions|activity)$/.exec(path);
    if (page) {
      if (!admin && !state.me.roles.includes("developer"))
        return reply(403, { error: "FORBIDDEN", message: "This is for admins and developers." });
      const tool = page[1]!;
      return reply(
        200,
        page[2] === "branches"
          ? toolsMock.branches(tool)
          : page[2] === "versions"
            ? toolsMock.versions(tool)
            : toolsMock.activity(tool),
      );
    }
    const needAdmin = [
      "/api/members",
      "/api/teams",
      "/api/invitations",
      "/api/membership-settings",
      "/api/identity-provider",
      "/api/approvals",
      "/api/audit",
      "/api/marketplaces",
      "/api/github",
    ];
    if (!admin && needAdmin.some((p) => path.startsWith(p)))
      return reply(403, { error: "FORBIDDEN", message: "This is for admins." });

    // The workspace's GitHub App (D-123): connected, installed on one organisation.
    if (path === "/api/github" && method === "GET") {
      return reply(200, {
        available: true,
        app: state.github
          ? {
              slug: "forgeron-demo",
              owner: "acme-sh",
              htmlUrl: "https://github.com/apps/forgeron-demo",
              installUrl: "https://github.com/apps/forgeron-demo/installations/new",
              createdAt: iso(-3 * DAY),
            }
          : null,
        installations: state.github
          ? [{ id: 7, account: "acme-sh", accountType: "Organization" }]
          : [],
      });
    }
    if (path === "/api/github" && method === "DELETE") {
      state.github = false;
      return reply(204);
    }
    if (path === "/api/github/repositories" && method === "GET") {
      return reply(200, {
        repositories: [
          {
            repo: "acme-sh/tickets",
            id: 1,
            private: true,
            defaultBranch: "main",
            forgeron: true,
            workflow: false,
            tool: null,
          },
          {
            repo: "acme-sh/crm",
            id: 2,
            private: true,
            defaultBranch: "main",
            forgeron: true,
            workflow: true,
            tool: "crm",
          },
          {
            repo: "acme-sh/website",
            id: 3,
            private: false,
            defaultBranch: "main",
            forgeron: false,
            workflow: false,
            tool: null,
          },
        ],
      });
    }
    if (path === "/api/github/repositories/link" && method === "POST") {
      const input = body as {
        repo: string;
        name: string;
        productionBranch?: string;
        addWorkflow?: boolean;
      };
      return reply(201, {
        tool: input.name,
        repo: input.repo,
        productionBranch: input.productionBranch ?? "main",
        workflow: input.addWorkflow ? "added" : "missing",
      });
    }
    if (path === "/api/github/tools" && method === "POST") {
      const input = body as { name: string; owner: string };
      return reply(201, {
        tool: input.name,
        repo: `${input.owner}/${input.name}`,
        url: `https://github.com/${input.owner}/${input.name}`,
      });
    }

    if (path.startsWith("/api/marketplaces")) {
      const answer = marketplacesMock.route(path, method, body);
      if (answer) return reply(answer.status, answer.body);
    }

    // Teams (D-132): named groups of members.
    if (path === "/api/teams" && method === "GET")
      return reply(200, { teams: state.teams.map((t) => ({ ...t, role: `team-${t.id}` })) });
    if (path === "/api/teams" && method === "POST") {
      if (state.teams.some((t) => t.id === body.id))
        return reply(409, {
          error: "ALREADY_EXISTS",
          message: `There is already a team ${body.id}.`,
        });
      state.teams.push({
        id: body.id,
        name: body.name,
        description: body.description ?? "",
        members: body.members ?? [],
      });
      return reply(201, { ...state.teams.at(-1)!, role: `team-${body.id}` });
    }
    const team = /^\/api\/teams\/([a-z][a-z0-9-]*)$/.exec(path);
    if (team && method === "PATCH") {
      const t = state.teams.find((x) => x.id === team[1]);
      if (!t) return reply(404, { error: "NOT_FOUND", message: "There is no such team." });
      Object.assign(t, body);
      return reply(200, { ...t, role: `team-${t.id}` });
    }
    if (team && method === "DELETE") {
      state.teams = state.teams.filter((x) => x.id !== team[1]);
      return reply(204);
    }
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
    const db = mockDatabase(path, url.searchParams);
    if (db)
      return db.csv !== undefined
        ? new Response(db.csv, { status: 200, headers: { "content-type": "text/csv" } })
        : reply(db.status, db.body);
    const tool = /^\/api\/tools\/([\w-]+)\/(access-matrix|secrets-status)$/.exec(path);
    if (tool?.[2] === "access-matrix")
      return method === "GET" ? reply(200, matrix(tool[1]!)) : reply(204);
    if (tool?.[2] === "secrets-status")
      return reply(200, {
        secrets: [
          {
            name: "ODOO_KEY",
            environments: { preview: "set", production: "missing" },
          },
          {
            name: "HUBSPOT_TOKEN",
            environments: { preview: "set", production: "missing" },
          },
        ],
      });
    return reply(404, { error: "NOT_FOUND" });
  };
}
