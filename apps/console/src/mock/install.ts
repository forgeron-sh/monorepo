// A gateway in memory, for the local harness (`VITE_MOCK=1`, the `console-harness` preview): every
// console route answers from a small state that the writes change. Names, addresses and values are
// made up; there is no secret in it. Pick a scenario with `?mock=`:
//   ready (default) · fresh (nothing done yet) · member (in the developer team, not the admin one) ·
//   person (in no team: what everyone is given, D-137) · signedout · error · slow

import {
  ADMIN_TEAM,
  BUILT_IN_TEAMS,
  DEVELOPER_TEAM,
  expand,
  missingToGrant,
  PLATFORM,
  PLATFORM_GROUPS,
  PLATFORM_PERMISSIONS,
  storedPlatformGrants,
  type PlatformPermission,
} from "@forgeron/permissions";
import { mockCatalogRoute, mockLibraryRoute } from "../features/portal/mock";
import { mockDatabase } from "./database";
import { createMarketplacesMock } from "./marketplaces";
import { createToolsMock } from "./tools";

type Json = Record<string, any>;

/** What a team's stored grants give: the fewest grants, and every permission they come to. */
const effectiveOf = (permissions: readonly string[]): PlatformPermission[] => {
  const held = expand(PLATFORM, permissions);
  return PLATFORM_PERMISSIONS.filter((p) => held.has(p));
};
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
    // published to two teams, the others are drafts.
    availability: {
      inventory: { mode: "teams", teams: ["developer", "support"], updatedAt: iso(-DAY) },
    } as Record<string, { mode: string; teams?: string[]; people?: string[]; updatedAt: string }>,
    workspace: "demo",
    github: !fresh,
    endpoint: "https://demo.fabriks.example",
    avatar: undefined as { url: string; source: "custom" | "provider" } | undefined,
    me: {
      id: "m1",
      email: "ada@acme.example",
      name: "ada",
    },
    members: (fresh
      ? [{ id: "m1", email: "ada@acme.example", name: "ada" }]
      : [
          { id: "m1", email: "ada@acme.example", name: "ada" },
          { id: "m2", email: "bob@acme.example", name: "bob" },
          { id: "m3", email: "claire@acme.example", name: "claire" },
        ]) as Array<{ id: string; email: string; name: string }>,
    // The built-in teams are in every workspace (D-137); the others are the workspace's own. Who is
    // in a team is kept here, and each person's teams are read from it.
    teams: [
      ...BUILT_IN_TEAMS.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        builtIn: true,
        locked: t.locked,
        permissions: storedPlatformGrants(t.permissions) as string[],
        members: (t.id === ADMIN_TEAM
          ? scenario === "member" || scenario === "person"
            ? ["m9"]
            : ["m1"]
          : t.id === DEVELOPER_TEAM
            ? scenario === "member"
              ? ["m1", "m2"]
              : fresh
                ? []
                : ["m2"]
            : []) as string[],
      })),
      ...(fresh || scenario === "person"
        ? []
        : [
            {
              id: "product",
              name: "Product",
              description: "Roadmap and design",
              builtIn: false,
              locked: false,
              permissions: [] as string[],
              members: ["m1", "m2"],
            },
            {
              id: "support",
              name: "Support",
              description: "",
              builtIn: false,
              locked: false,
              permissions: ["audit:read"] as string[],
              members: ["m3"],
            },
          ]),
    ],
    invitations: fresh
      ? []
      : [
          {
            email: "eve@acme.example",
            teams: ["developer"],
            invitedBy: "m1",
            expiresAt: iso(13 * DAY),
          },
          { email: "old@acme.example", teams: [], invitedBy: "m1", expiresAt: iso(-2 * DAY) },
        ],
    settings: {
      domains: ["acme.example"],
      defaultTeams: ["support"] as string[],
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
          // Added from GitHub, nothing deployed yet: the CI is running (tickets) or has failed (payroll).
          { name: "tickets", production: null, previews: [] },
          { name: "payroll", production: null, previews: [] },
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
            // A permanent channel added by someone who builds the tool (D-125): it follows `staging`.
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
            groupTeams: {},
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
            "Developers: crm.contacts.update",
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
  // D-127, D-137: the tool's profiles, what Everyone and each team are given, and the matrix that
  // follows. Everyone first, then the teams by name.
  const teamsOfPerson = (id: string) => state.teams.filter((t) => t.members.includes(id));
  const matrix = (tool: string): Json => {
    const columns = [`${tool}.contacts.list`, `${tool}.contacts.update`, `${tool}.contacts.delete`];
    const levels = { [columns[0]!]: "read", [columns[1]!]: "write", [columns[2]!]: "delete" };
    const profiles: Record<string, string[]> = { user: ["read"], manager: ["read", "write"] };
    const grants: Record<string, Json> = {
      everyone: { kind: "profile", profile: "user" },
      [`team:${ADMIN_TEAM}`]: { kind: "all" },
      [`team:${DEVELOPER_TEAM}`]: { kind: "profile", profile: "manager" },
    };
    const teams = [...state.teams].sort(
      (a, b) =>
        Number(b.id === ADMIN_TEAM) - Number(a.id === ADMIN_TEAM) || a.name.localeCompare(b.name),
    );
    const subjects = ["everyone", ...teams.map((t) => `team:${t.id}`)];
    const heldBy = (subject: string): string[] => {
      const g = grants[subject];
      return g?.kind === "all"
        ? ["delete", "read", "write"]
        : g?.kind === "profile"
          ? (profiles[g.profile] ?? [])
          : [];
    };
    return {
      subjects,
      subjectLabels: {
        everyone: "Everyone",
        ...Object.fromEntries(teams.map((t) => [`team:${t.id}`, t.name])),
      },
      actions: columns,
      views: [],
      columns,
      levels,
      permissions: ["delete", "read", "write"],
      profiles: {
        user: { label: "User", grants: ["read"], default: true },
        manager: { label: "Manager", grants: ["read", "write"], default: false },
      },
      grants: Object.fromEntries(subjects.map((x) => [x, grants[x] ?? { kind: "none" }])),
      cells: Object.fromEntries(
        subjects.map((subject) => [
          subject,
          Object.fromEntries(
            columns.map((action) => {
              const allowed = heldBy(subject).includes(levels[action]!);
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
    // What the person may do (D-137): the permissions of their teams.
    const myTeams = teamsOfPerson(state.me.id);
    const mine = expand(
      PLATFORM,
      myTeams.flatMap((t) => t.permissions),
    );
    const has = (permission: PlatformPermission) => mine.has(permission);
    const lacking = (permission: PlatformPermission) =>
      reply(403, {
        error: "FORBIDDEN",
        message: `This needs the permission ${PLATFORM.permissions[permission].label}.`,
      });

    if (platformRoute) {
      const needed = path === "/rollback" ? "tools:publish" : "tools:write";
      if (!has(needed))
        return reply(403, {
          error: { code: "FORBIDDEN", message: `This needs the permission ${needed}.` },
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
        person: {
          ...state.me,
          teams: myTeams.map((t) => t.id),
          permissions: PLATFORM_PERMISSIONS.filter((p) => mine.has(p)),
          ...(state.avatar ? { avatar: state.avatar } : {}),
        },
        setup: {
          members: state.members.length,
          invitations: state.invitations.length,
          tools: state.tools.length,
          deployed: state.tools.filter((t) => t.production || t.previews.length).length,
          called: !fresh,
        },
        ...(has("settings:read")
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
      const answer = mockLibraryRoute(path, method, has("access:write"));
      if (answer) return reply(answer.status, answer.body);
    }
    const pilotRule = /^\/api\/tools\/([\w-]+)\/previews\/(~?[\w.-]+)\/availability$/.exec(
      decodeURIComponent(path),
    );
    if (pilotRule) {
      if (!has("tools:publish")) return lacking("tools:publish");
      const key = `${pilotRule[1]}@${pilotRule[2]}`;
      if (method === "PUT") {
        state.availability[key] = {
          mode: String(body.mode),
          teams: body.teams ?? [],
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
              teams: rule.teams ?? [],
              people: rule.people ?? [],
              updatedAt: rule.updatedAt,
            }
          : { mode: "open", teams: [], people: [], updatedAt: null },
      );
    }
    // Where a tool comes from, its permanent channels and their updates (D-121, D-125).
    const sourceOf = /^\/api\/tools\/([\w-]+)\/(source|update|channels)(?:\/([\w-]+))?$/.exec(path);
    if (sourceOf && sourceOf[1] !== "from-repository") {
      if (!has("tools:write")) return lacking("tools:write");
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
    // A tool's CI: the recent GitHub Actions runs of its repository (docs/console-ux.md, "CI").
    const ci = /^\/api\/tools\/([\w-]+)\/ci$/.exec(path);
    if (ci) {
      if (!has("tools:read")) return lacking("tools:read");
      const tool = ci[1]!;
      const repo = `acme-sh/${tool}`;
      if (tool === "odoo") return reply(200, { state: "no-repository" });
      if (tool === "inventory") {
        return reply(200, {
          state: "no-permission",
          repo,
          settingsUrl: "https://github.com/organizations/acme-sh/settings/installations/7",
        });
      }
      const run = (
        id: number,
        status: string,
        branch: string,
        message: string,
        actor: string,
        started: number,
        seconds: number | null,
      ) => ({
        id,
        workflow: "forgeron",
        branch,
        message,
        sha: id.toString(16).padStart(40, "0"),
        actor,
        status,
        startedAt: iso(-started),
        durationSeconds: seconds,
        url: `https://github.com/${repo}/actions/runs/${id}`,
      });
      const runs =
        tool === "tickets"
          ? [run(3, "in_progress", "main", "feat: first version", "ada", 40_000, null)]
          : tool === "payroll"
            ? [
                run(5, "failure", "main", "feat: first version", "ada", 3_600_000, 74),
                run(4, "cancelled", "feat/fix", "ci: try again", "bob", 7_200_000, 12),
              ]
            : [
                run(9, "success", "main", "feat: export contacts as CSV", "claire", 3 * DAY, 131),
                run(8, "queued", "feat-export", "fix: keep the column order", "bob", 60_000, null),
                run(7, "failure", "fix-accents-search", "fix: ignore accents", "bob", 2 * DAY, 58),
                run(6, "success", "main", "feat: deals.move", "ada", 21 * DAY, 120),
              ];
      return reply(200, {
        state: "ok",
        repo,
        productionBranch: "main",
        actionsUrl: `https://github.com/${repo}/actions`,
        runs,
      });
    }
    const deleted = /^\/api\/tools\/([\w-]+)$/.exec(path);
    if (deleted && method === "DELETE") {
      if (!has("tools:delete")) return lacking("tools:delete");
      if (body.confirm !== deleted[1])
        return reply(400, { error: "NOT_CONFIRMED", message: `Type ${deleted[1]} to confirm.` });
      state.tools = state.tools.filter((t) => t.name !== deleted[1]);
      return reply(200, { deleted: true });
    }
    if (path === "/api/tools/from-repository" && method === "POST") {
      if (!has("tools:write")) return lacking("tools:write");
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
      if (!has("tools:publish")) return lacking("tools:publish");
      const tool = availability[1]!;
      if (
        method === "PUT" &&
        body.mode !== "nobody" &&
        !state.tools.find((t) => t.name === tool)?.production
      ) {
        return reply(409, {
          error: "NO_VERSION",
          message: "Nothing to publish yet: no version is deployed on this channel.",
        });
      }
      if (method === "PUT") {
        state.availability[tool] = {
          mode: String(body.mode),
          teams: body.teams ?? [],
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
              teams: rule.teams ?? [],
              people: rule.people ?? [],
              updatedAt: rule.updatedAt,
            }
          : { mode: tool === "crm" ? "open" : "nobody", teams: [], people: [], updatedAt: null },
      );
    }
    if (path.startsWith("/api/catalog")) {
      const answer =
        scenario === "empty" ? { tools: [] } : mockCatalogRoute(path, has("access:write"));
      return answer ? reply(200, answer) : reply(404, { error: "NOT_FOUND" });
    }
    if (path === "/api/tools")
      return reply(200, {
        tools: state.tools.map((t) => ({ ...t, ...toolsMock.summary(t.name) })),
      });
    const page = /^\/api\/tools\/([\w-]+)\/(branches|versions|activity)$/.exec(path);
    if (page) {
      if (!has("tools:read")) return lacking("tools:read");
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
    // The permission each area needs to be read; teams and the catalog of permissions are read by
    // anyone signed in.
    const needs: Array<[string, PlatformPermission]> = [
      ["/api/members", "members:read"],
      ["/api/invitations", "members:read"],
      ["/api/membership-settings", "members:read"],
      ["/api/identity-provider", "settings:read"],
      ["/api/approvals", "tools:approve"],
      ["/api/audit", "audit:read"],
      ["/api/marketplaces", "marketplace:read"],
      ["/api/github", "settings:read"],
    ];
    const need = needs.find(([p]) => path.startsWith(p));
    if (need && !has(need[1])) return lacking(need[1]);

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

    // Your picture (D-133): kept as sent, served from the data URL.
    if (path === "/api/me/avatar" && method === "PUT") {
      state.avatar = body.image
        ? { url: body.image as string, source: "custom" as const }
        : undefined;
      return reply(200, { avatar: state.avatar ?? null });
    }
    // Teams (D-132, D-137): named groups of members, and what each may do on Forgeron.
    const teamView = (t: (typeof state.teams)[number]) => ({
      ...t,
      effective: effectiveOf(t.permissions),
    });
    if (path === "/api/teams" && method === "GET")
      return reply(200, { teams: state.teams.map(teamView) });
    if (path === "/api/permissions" && method === "GET")
      return reply(200, {
        groups: PLATFORM_GROUPS.map((g) => ({
          label: g.label,
          permissions: g.permissions.map((name) => ({
            name,
            label: PLATFORM.permissions[name].label,
            description: PLATFORM.permissions[name].description,
            implies: [
              ...((PLATFORM.permissions[name] as { implies?: readonly string[] }).implies ?? []),
            ],
          })),
        })),
      });
    // Giving what you do not hold is refused (D-137).
    const mayGive = (permissions: readonly string[]) => {
      const missing = missingToGrant(PLATFORM, mine, permissions);
      return missing.length === 0
        ? undefined
        : reply(403, {
            error: "FORBIDDEN",
            message: `You do not hold ${missing.join(", ")}: you can only give what you hold.`,
          });
    };
    if (path === "/api/teams" && method === "POST") {
      if (!has("teams:write")) return lacking("teams:write");
      if (state.teams.some((t) => t.id === body.id))
        return reply(409, {
          error: "ALREADY_EXISTS",
          message: `There is already a team ${body.id}.`,
        });
      const refused = mayGive(body.permissions ?? []);
      if (refused) return refused;
      state.teams.push({
        id: body.id,
        name: body.name,
        description: body.description ?? "",
        builtIn: false,
        locked: false,
        permissions: storedPlatformGrants(body.permissions ?? []),
        members: body.members ?? [],
      });
      return reply(201, teamView(state.teams.at(-1)!));
    }
    const team = /^\/api\/teams\/([a-z][a-z0-9-]*)$/.exec(path);
    if (team && method === "PATCH") {
      if (!has("teams:write")) return lacking("teams:write");
      const t = state.teams.find((x) => x.id === team[1]);
      if (!t) return reply(404, { error: "NOT_FOUND", message: "There is no such team." });
      if (body.permissions && t.locked)
        return reply(409, {
          error: "PROTECTED",
          message: "The permissions of this team cannot be changed.",
        });
      const refused = mayGive([...t.permissions, ...(body.permissions ?? [])]);
      if (refused) return refused;
      if (t.id === ADMIN_TEAM && body.members && body.members.length === 0)
        return reply(409, { error: "LAST_ADMIN", message: "The admin team keeps one member." });
      if (body.name !== undefined) t.name = body.name;
      if (body.description !== undefined) t.description = body.description;
      if (body.members) t.members = body.members;
      if (body.permissions) t.permissions = storedPlatformGrants(body.permissions);
      return reply(200, teamView(t));
    }
    if (team && method === "DELETE") {
      if (!has("teams:write")) return lacking("teams:write");
      if (state.teams.find((x) => x.id === team[1])?.builtIn)
        return reply(409, { error: "PROTECTED", message: "A built-in team cannot be deleted." });
      state.teams = state.teams.filter((x) => x.id !== team[1]);
      return reply(204);
    }
    const memberView = (m: (typeof state.members)[number]) => ({
      ...m,
      teams: teamsOfPerson(m.id).map((t) => t.id),
    });
    if (path === "/api/members" && method === "GET")
      return reply(200, {
        members: state.members.map(memberView),
        invitations: state.invitations,
        settings: state.settings,
      });
    const member = /^\/api\/members\/(\w+)$/.exec(path);
    if (member && method === "PATCH") {
      if (!has("members:write")) return lacking("members:write");
      const m = state.members.find((x) => x.id === member[1]);
      if (!m) return reply(404, { error: "NOT_FOUND", message: "No such member." });
      const wanted: string[] = body.teams ?? [];
      const changed = state.teams.filter((t) => t.members.includes(m.id) !== wanted.includes(t.id));
      const refused = mayGive(changed.flatMap((t) => t.permissions));
      if (refused) return refused;
      if (m.id === "m1" && scenario !== "member" && !wanted.includes(ADMIN_TEAM))
        return reply(409, {
          error: "LAST_ADMIN",
          message: "The last admin cannot leave the Admins team. Add someone else to it first.",
        });
      for (const t of state.teams) {
        t.members = t.members.filter((id) => id !== m.id);
        if (wanted.includes(t.id)) t.members.push(m.id);
      }
      return reply(200, memberView(m));
    }
    if (member && method === "DELETE") {
      if (!has("members:write")) return lacking("members:write");
      if (member[1] === "m1")
        return reply(409, {
          error: "LAST_ADMIN",
          message: "The last admin cannot be removed. Add someone else to the Admins team first.",
        });
      state.members = state.members.filter((x) => x.id !== member[1]);
      for (const t of state.teams) t.members = t.members.filter((id) => id !== member[1]);
      return reply(204);
    }
    if (path === "/api/invitations" && method === "POST") {
      if (!has("members:write")) return lacking("members:write");
      const refused = mayGive(
        state.teams.filter((t) => (body.teams ?? []).includes(t.id)).flatMap((t) => t.permissions),
      );
      if (refused) return refused;
      state.invitations.push({
        email: body.email,
        teams: body.teams ?? [],
        invitedBy: "m1",
        expiresAt: iso(14 * DAY),
      });
      return reply(201, {
        invitation: { email: body.email, teams: body.teams ?? [] },
        notified: true,
      });
    }
    const invitation = /^\/api\/invitations\/(.+)$/.exec(path);
    if (invitation && method === "DELETE") {
      if (!has("members:write")) return lacking("members:write");
      state.invitations = state.invitations.filter(
        (i) => i.email !== decodeURIComponent(invitation[1]!),
      );
      return reply(204);
    }
    if (path === "/api/membership-settings" && method === "PUT") {
      if (!has("members:write")) return lacking("members:write");
      state.settings = {
        domains: body.domains,
        defaultTeams: body.defaultTeams ?? [],
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
      state.provider = { groupTeams: {}, ...rest };
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
