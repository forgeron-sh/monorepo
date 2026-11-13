import {
  createInstallPlanRoute,
  createSecretRequestRoute,
  decideApprovalRoute,
  getAccessMatrixRoute,
  installFromPlanRoute,
  getToolSourceRoute,
  updateToolRoute,
  listApprovalsRoute,
  listCatalogRoute,
  listMarketplacesRoute,
  listMarketplaceToolsRoute,
  listMembersRoute,
  listTeamsRoute,
  listTemplatesRoute,
  listToolsRoute,
  planMarketplaceToolRoute,
  putAccessMatrixRoute,
  rollbackRoute,
  secretsStatusRoute,
  setMemberTeamsRoute,
  toolCardRoute,
  toolVersionsRoute,
  updateTeamRoute,
  usageRoute,
} from "@forgeron/platform-contract";
import type { PlatformPermission } from "@forgeron/permissions";
import { z } from "zod";

// The tools of the admin MCP (sdk.md §17). A tool is a name, the permission it requires, whether it changes
// anything, an input and a function of the platform port. The port is the whole of what a tool can
// reach: the platform's own routes, called with the caller's identity (so the console's guard, its
// validation and its audit lines apply), never the registry. A rule of `.dependency-cruiser.cjs`
// keeps this folder from importing it.

/** What a tool asks of the caller (D-137): any signed-in person, or one platform permission. */
type Requires = PlatformPermission | "signed-in";

/** What a tool may ask of the platform: one of its routes, answered as it would to the console. */
interface PlatformCall {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  body?: unknown;
  /** `console` for `/console-api/…` routes (the default), `root` for `/rollback`. */
  surface?: "console" | "root";
}
export type PlatformPort = (call: PlatformCall) => Promise<{ status: number; body: unknown }>;

/** A refusal the person should read: the platform said no, or the request names nothing real. */
export class ToolRefusal extends Error {}

export interface ToolDefinition {
  name: string;
  title: string;
  description: string;
  /** Who may call it, and is offered it: the platform checks the same again when the tool calls a route. */
  requires: Requires;
  /** A tool that changes something carries the MCP `destructiveHint`: the client asks first. */
  destructive: boolean;
  input: z.ZodObject;
  run(args: never, port: PlatformPort): Promise<unknown>;
}

const NAME = /^[a-z0-9][a-z0-9-]*$/;
const SUBJECT = /^(?:everyone|team:[a-z][a-z0-9-]{1,33})$/;
const TEAM = /^[a-z][a-z0-9-]{1,33}$/;
const tool = z.string().regex(NAME).max(60).describe("The tool's name");
const SECRET_NAME = /^[A-Z][A-Z0-9_]*$/;
/** Production, another permanent channel (`channel`), or a branch's preview (D-125). */
const environment = z.enum(["production", "channel", "preview"]);
const channel = z
  .string()
  .regex(/^[a-z][a-z0-9-]{0,29}$/)
  .optional()
  .describe("A permanent channel other than production (`staging`)");
const branch = z.string().min(1).max(100).optional();
const reason = z.string().max(500).optional().describe("Why, in the audit line");

const at = (path: string, params: Record<string, string> = {}) =>
  path.replace(/\{(\w+)\}/g, (_, key: string) => encodeURIComponent(params[key] ?? ""));

/** The body of an answer, or a refusal carrying the platform's own words. */
async function ask(port: PlatformPort, call: PlatformCall): Promise<unknown> {
  const { status, body } = await port(call);
  if (status < 400) return body;
  const error = (body ?? {}) as {
    error?: string | { code?: string; message?: string };
    message?: string;
  };
  const code = typeof error.error === "string" ? error.error : error.error?.code;
  const message =
    error.message ?? (typeof error.error === "object" ? error.error?.message : undefined);
  throw new ToolRefusal(`${status} ${code ?? "ERROR"}${message ? `: ${message}` : ""}`);
}

function define<S extends z.ZodObject>(
  definition: Omit<ToolDefinition, "input" | "run"> & {
    input: S;
    run(args: z.infer<S>, port: PlatformPort): Promise<unknown>;
  },
): ToolDefinition {
  return definition as unknown as ToolDefinition;
}

const none = z.strictObject({});

interface Member {
  id: string;
  email: string;
  teams: string[];
}

async function membersOf(port: PlatformPort): Promise<Member[]> {
  const { members } = (await ask(port, { method: "GET", path: listMembersRoute.path })) as {
    members: Member[];
  };
  return members;
}

/** A member by id or by email. */
const findMember = (members: Member[], who: string): Member | undefined =>
  members.find((m) => m.id === who || m.email.toLowerCase() === who.toLowerCase());

/** The member a person names, by id or by email. */
async function memberOf(port: PlatformPort, who: string): Promise<Member> {
  const found = findMember(await membersOf(port), who);
  if (!found) throw new ToolRefusal(`404 NOT_FOUND: there is no member ${who}.`);
  return found;
}

const target = z.strictObject({
  subject: z.string().regex(SUBJECT).describe("Who is given access: `everyone`, or `team:<id>`"),
  tool,
  action: z.string().min(1).max(100).optional().describe("An action of the tool, or `view:<name>`"),
  profile: z
    .string()
    .min(1)
    .max(100)
    .optional()
    .describe("With no `action`: the profile of the tool the subject is given (grant only)"),
  permissions: z
    .array(z.string().min(1).max(100))
    .max(100)
    .optional()
    .describe("With no `action`: a custom set of the tool's permissions (grant only)"),
  all: z
    .boolean()
    .optional()
    .describe("With no `action`: every permission of the tool (grant only)"),
});

type Target = z.infer<typeof target>;

/** What a grant gives: exactly one of `profile`, `permissions`, `all`. */
function grantOf(args: Target):
  | { kind: "all" }
  | { kind: "profile"; profile: string }
  | {
      kind: "custom";
      permissions: string[];
    } {
  const given = [args.profile !== undefined, args.permissions !== undefined, args.all === true];
  if (given.filter(Boolean).length !== 1) {
    throw new ToolRefusal("Give the subject one of: a `profile`, `permissions`, or `all: true`.");
  }
  if (args.profile !== undefined) return { kind: "profile", profile: args.profile };
  if (args.permissions !== undefined) return { kind: "custom", permissions: args.permissions };
  return { kind: "all" };
}

/**
 * With an `action`, one cell of the matrix; without, what the subject is given in the tool as a whole
 * (D-127, D-137).
 */
async function setAccess(args: Target, port: PlatformPort, grant: boolean) {
  const mapping = args.profile !== undefined || args.permissions !== undefined || args.all;
  if (args.action !== undefined) {
    if (mapping) {
      throw new ToolRefusal("Name an `action`, or a `profile`, `permissions` or `all`, not both.");
    }
    return ask(port, {
      method: "PUT",
      path: at(putAccessMatrixRoute.path, { tool: args.tool }),
      // A revocation is an explicit refusal for the action, not a return to the default.
      body: { changes: [{ subject: args.subject, action: args.action, allowed: grant }] },
    });
  }
  if (!grant && mapping) {
    throw new ToolRefusal("A revocation takes the subject's access away: give no `profile`.");
  }
  return ask(port, {
    method: "PUT",
    path: at(putAccessMatrixRoute.path, { tool: args.tool }),
    // A revocation gives the subject nothing in the tool; it stays in its teams.
    body: { grants: [{ subject: args.subject, grant: grant ? grantOf(args) : { kind: "none" } }] },
  });
}

export const TOOLS: readonly ToolDefinition[] = [
  define({
    name: "catalog_search",
    title: "Search the catalog",
    description: "Searches the workspace's catalog of tools by name, title or summary.",
    requires: "signed-in",
    destructive: false,
    input: z.strictObject({ query: z.string().max(100).optional() }),
    async run({ query }, port) {
      const { tools } = (await ask(port, { method: "GET", path: listCatalogRoute.path })) as {
        tools: Array<{ name: string; title: string; summary: string }>;
      };
      const needle = query?.trim().toLowerCase();
      return {
        tools: needle
          ? tools.filter((t) =>
              [t.name, t.title, t.summary].some((text) => text.toLowerCase().includes(needle)),
            )
          : tools,
      };
    },
  }),
  define({
    name: "catalog_get",
    title: "Get a catalog entry",
    description: "A tool's card: what it does, how to connect, what the caller may call.",
    requires: "signed-in",
    destructive: false,
    input: z.strictObject({ tool }),
    run: ({ tool: name }, port) =>
      ask(port, { method: "GET", path: at(toolCardRoute.path, { tool: name }) }),
  }),
  define({
    name: "tools_list",
    title: "List the tools",
    description: "The workspace's tools and the version each environment serves.",
    requires: "signed-in",
    destructive: false,
    input: none,
    run: (_, port) => ask(port, { method: "GET", path: listToolsRoute.path }),
  }),
  define({
    name: "tool_get",
    title: "Get a tool",
    description: "A tool's detail: its versions per environment and its card.",
    requires: "signed-in",
    destructive: false,
    input: z.strictObject({ tool }),
    async run({ tool: name }, port) {
      const { tools } = (await ask(port, { method: "GET", path: listToolsRoute.path })) as {
        tools: Array<{ name: string }>;
      };
      const listing = tools.find((t) => t.name === name);
      if (!listing) throw new ToolRefusal(`404 NOT_FOUND: there is no tool ${name}.`);
      const card = await ask(port, { method: "GET", path: at(toolCardRoute.path, { tool: name }) });
      return { listing, card };
    },
  }),
  define({
    name: "tool_versions",
    title: "List a tool's versions",
    description: "A tool's versions, newest first, with where each is served and what changed.",
    requires: "tools:read",
    destructive: false,
    input: z.strictObject({ tool }),
    run: ({ tool: name }, port) =>
      ask(port, { method: "GET", path: at(toolVersionsRoute.path, { tool: name }) }),
  }),
  define({
    name: "tool_changelog",
    title: "A tool's changelog",
    description:
      "The changelog of a tool's versions, newest first; with `since`, only the versions after it.",
    // The route that carries the changelog needs `tools:read` (sdk.md §17).
    requires: "tools:read",
    destructive: false,
    input: z.strictObject({ tool, since: z.string().min(1).max(64).optional() }),
    async run({ tool: name, since }, port) {
      const answer = (await ask(port, {
        method: "GET",
        path: at(toolVersionsRoute.path, { tool: name }),
      })) as { versions: Array<{ version: string; publishedAt: string; changelog: unknown }> };
      let versions = answer.versions;
      if (since !== undefined) {
        const index = versions.findIndex((v) => v.version === since);
        if (index < 0) throw new ToolRefusal(`404 NOT_FOUND: ${name} has no version ${since}.`);
        versions = versions.slice(0, index);
      }
      return {
        tool: name,
        versions: versions.map(({ version, publishedAt, changelog }) => ({
          version,
          publishedAt,
          changelog,
        })),
      };
    },
  }),
  define({
    name: "secrets_status",
    title: "Secrets status",
    description: "Which of a tool's secrets are set or missing. Never their values.",
    requires: "tools:read",
    destructive: false,
    input: z.strictObject({ tool }),
    run: ({ tool: name }, port) =>
      ask(port, { method: "GET", path: at(secretsStatusRoute.path, { tool: name }) }),
  }),
  define({
    name: "secret_request",
    title: "Ask for a link to enter a secret",
    description:
      "Gives a link to a console page where YOU type a tool's secret yourself; open it signed in as the same person. The link works once for 15 minutes. Never put the value in the conversation: this tool takes no value and returns only the link.",
    requires: "tools:write",
    destructive: false,
    input: z.strictObject({
      tool,
      environment,
      name: z.string().regex(SECRET_NAME).max(100).describe("The secret's name, as `API_KEY`"),
    }),
    async run({ tool: toolName, environment: env, name }, port) {
      const { url, expiresAt } = (await ask(port, {
        method: "POST",
        path: at(createSecretRequestRoute.path, { tool: toolName, environment: env, name }),
      })) as { url: string; expiresAt: string };
      return {
        url,
        expiresAt,
        note: "Open this link while signed in to the console as yourself and type the value there. It is single use.",
      };
    },
  }),
  define({
    name: "resources_pending",
    title: "Resources awaiting approval",
    description:
      "The versions that wait for someone who holds `tools:approve` to approve their new resources.",
    requires: "tools:approve",
    destructive: false,
    input: none,
    run: (_, port) => ask(port, { method: "GET", path: listApprovalsRoute.path }),
  }),
  define({
    name: "resources_approve",
    title: "Approve a resource",
    description: "Approves one pending request for a resource, by its identifier.",
    requires: "tools:approve",
    destructive: true,
    input: z.strictObject({ id: z.string().min(1).max(100).describe("From resources_pending") }),
    run: ({ id }, port) =>
      ask(port, {
        method: "POST",
        path: at(decideApprovalRoute.path, { id }),
        body: { decision: "approved" },
      }),
  }),
  define({
    name: "access_list",
    title: "Who may use what",
    description:
      "With `tool`: the tool's profiles, what each subject (`everyone`, a team) is given in it, and the subjects × actions matrix. Without: the workspace's members and their teams.",
    requires: "access:read",
    destructive: false,
    input: z.strictObject({ tool: tool.optional() }),
    async run({ tool: name }, port) {
      if (name) {
        return ask(port, { method: "GET", path: at(getAccessMatrixRoute.path, { tool: name }) });
      }
      return { members: await membersOf(port) };
    },
  }),
  define({
    name: "access_grant",
    title: "Give access to a tool",
    description:
      "Gives a subject (`everyone`, or `team:<id>`) a profile of a tool, custom permissions or all of them (`tool`, `subject`, and `profile`, `permissions` or `all`); or allows it one action (`tool`, `subject`, `action`).",
    requires: "access:write",
    destructive: true,
    input: target,
    run: (args, port) => setAccess(args, port, true),
  }),
  define({
    name: "access_revoke",
    title: "Take access to a tool away",
    description:
      "Gives a subject nothing in a tool (`tool`, `subject`); or refuses it one action (`tool`, `subject`, `action`).",
    requires: "access:write",
    destructive: true,
    input: target,
    run: (args, port) => setAccess(args, port, false),
  }),
  define({
    name: "team_list",
    title: "List the teams",
    description:
      "The workspace's teams: their members, and what each may do on Forgeron (`permissions` as stored, `effective` with what they imply).",
    requires: "signed-in",
    destructive: false,
    input: none,
    run: (_, port) => ask(port, { method: "GET", path: listTeamsRoute.path }),
  }),
  define({
    name: "member_set_teams",
    title: "Change the teams of a member",
    description:
      "Replaces the teams a member is in (`person`, `teams`). A person gets the permissions of their teams, so you may only add or remove a team whose permissions you hold.",
    requires: "members:write",
    destructive: true,
    input: z.strictObject({
      person: z.string().min(1).max(200).describe("A member's id or email"),
      teams: z.array(z.string().regex(TEAM)).max(20).describe("Every team the member is in"),
    }),
    async run({ person, teams }, port) {
      const member = await memberOf(port, person);
      return ask(port, {
        method: "PATCH",
        path: at(setMemberTeamsRoute.path, { id: member.id }),
        body: { teams },
      });
    },
  }),
  define({
    name: "team_set_members",
    title: "Set the members of a team",
    description:
      "Replaces the members of a team (`team`, `members`: ids or emails). You may only change a team whose permissions you hold; the admin team keeps at least one member.",
    requires: "teams:write",
    destructive: true,
    input: z.strictObject({
      team: z.string().regex(TEAM),
      members: z.array(z.string().min(1).max(200)).max(500).describe("Member ids or emails"),
    }),
    async run({ team, members }, port) {
      const known = await membersOf(port);
      const ids = members.map((who) => {
        const found = findMember(known, who);
        if (!found) throw new ToolRefusal(`404 NOT_FOUND: there is no member ${who}.`);
        return found.id;
      });
      return ask(port, {
        method: "PATCH",
        path: at(updateTeamRoute.path, { id: team }),
        body: { members: ids },
      });
    },
  }),
  define({
    name: "team_set_permissions",
    title: "Set what a team may do",
    description:
      "Replaces the permissions of a team on Forgeron (`team`, `permissions`, like `tools:write`; `*` is every one). You may only give permissions you hold; the admin team's cannot be changed.",
    requires: "teams:write",
    destructive: true,
    input: z.strictObject({
      team: z.string().regex(TEAM),
      permissions: z.array(z.string().min(1).max(64)).max(64),
    }),
    run: ({ team, permissions }, port) =>
      ask(port, {
        method: "PATCH",
        path: at(updateTeamRoute.path, { id: team }),
        body: { permissions },
      }),
  }),
  define({
    name: "usage_report",
    title: "Usage of the workspace",
    description:
      "Authenticated calls per tool and per person over a period of UTC days (`from`, `to`, `YYYY-MM-DD`; the last 30 days by default). Counts only: no payload, no path.",
    requires: "usage:read",
    destructive: false,
    input: z.strictObject({
      from: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
      to: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
    }),
    run: ({ from, to }, port) => {
      const query = new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) });
      return ask(port, {
        method: "GET",
        path: `${usageRoute.path}${query.size ? `?${query}` : ""}`,
      });
    },
  }),
  define({
    name: "template_list",
    title: "List the templates",
    description: "The templates of the catalog, with the resources each one asks for.",
    requires: "tools:write",
    destructive: false,
    input: z.strictObject({}),
    run: (_args, port) => ask(port, { method: "GET", path: listTemplatesRoute.path }),
  }),
  define({
    name: "marketplace_list",
    title: "List the marketplaces",
    description:
      "The official catalogue (`official`) and the marketplaces the workspace added, with when each was last synced. Adding, syncing or removing a marketplace is done in the console.",
    requires: "marketplace:read",
    destructive: false,
    input: z.strictObject({}),
    run: (_args, port) => ask(port, { method: "GET", path: listMarketplacesRoute.path }),
  }),
  define({
    name: "marketplace_tools",
    title: "List what a marketplace offers",
    description:
      "The tools of a marketplace at their latest version, with the resources each would ask for and whether the workspace already has it.",
    requires: "marketplace:read",
    destructive: false,
    input: z.strictObject({
      marketplace: z
        .string()
        .min(1)
        .max(64)
        .describe("`official`, or an id from `marketplace_list`"),
    }),
    run: ({ marketplace }, port) =>
      ask(port, { method: "GET", path: at(listMarketplaceToolsRoute.path, { id: marketplace }) }),
  }),
  define({
    name: "tool_install_plan",
    title: "Plan the install of a template",
    description:
      "Shows what installing a template, or a tool of a marketplace, would create and which resources would need approval. Creates no tool: it returns a plan identifier, valid for 15 minutes, that only `tool_install` accepts. Show the plan to the person and ask before calling `tool_install`.",
    requires: "tools:write",
    destructive: false,
    input: z.strictObject({
      template: tool.describe("The template's or the tool's name"),
      marketplace: z
        .string()
        .min(1)
        .max(64)
        .optional()
        .describe(
          "The marketplace's id from `marketplace_list`; the official catalogue when absent",
        ),
    }),
    run: ({ template, marketplace }, port) =>
      ask(port, {
        method: "POST",
        path: marketplace
          ? at(planMarketplaceToolRoute.path, { id: marketplace, tool: template })
          : at(createInstallPlanRoute.path, { name: template }),
      }),
  }),
  define({
    name: "tool_install",
    title: "Install a template",
    description:
      "Creates the tool of a plan made by `tool_install_plan`, once. Takes only the plan's identifier. What the plan showed is approved by this call, and the tool goes to production where the platform can deploy.",
    requires: "tools:write",
    destructive: true,
    input: z.strictObject({ plan: z.string().min(1).max(64).describe("The plan's identifier") }),
    run: ({ plan }, port) =>
      ask(port, { method: "POST", path: at(installFromPlanRoute.path, { plan }) }),
  }),
  define({
    name: "tool_source",
    title: "Read a tool's update",
    description:
      "Where a tool comes from (a marketplace or a GitHub repository) and its permanent channels (production first, then the others added): for each, the branch it follows, the version it serves, and the release waiting for it, with its changelog, what it asks to approve and the plan of what would stop it. Only releases reach a permanent channel. It changes nothing.",
    requires: "tools:read",
    destructive: false,
    input: z.strictObject({ tool: z.string().min(1).max(64) }),
    run: ({ tool }, port) =>
      ask(port, { method: "GET", path: at(getToolSourceRoute.path, { tool }) }),
  }),
  define({
    name: "tool_update",
    title: "Update a permanent channel",
    description:
      "Puts the release `tool_source` showed on a permanent channel: production, or `channel`. `version` is the one it showed: a newer update is refused, read it again. `approve` approves what it asks for: show the person before setting it. Forgeron never moves code between branches: a build that is not a release cannot be put on a permanent channel.",
    requires: "tools:write",
    destructive: true,
    input: z.strictObject({
      tool: z.string().min(1).max(64),
      version: z.string().min(1).max(200),
      channel,
      approve: z.boolean().optional(),
    }),
    run: ({ tool, ...body }, port) =>
      ask(port, { method: "POST", path: at(updateToolRoute.path, { tool }), body }),
  }),
  define({
    name: "tool_rollback",
    title: "Roll back a channel",
    description:
      "Serves again the version a channel served before the current one: production, a permanent channel (`environment: channel` and its `channel`), or a branch's preview. No new code, no migration.",
    requires: "tools:publish",
    destructive: true,
    input: z.strictObject({ tool, environment, branch, channel, reason }),
    run: ({ tool: name, environment: env, branch: on, channel: named, reason: why }, port) =>
      ask(port, {
        method: "POST",
        path: rollbackRoute.path,
        surface: "root",
        body: {
          tool: name,
          environment: env,
          ...(on ? { branch: on } : {}),
          ...(named ? { channel: named } : {}),
          ...(why ? { reason: why } : {}),
        },
      }),
  }),
];
