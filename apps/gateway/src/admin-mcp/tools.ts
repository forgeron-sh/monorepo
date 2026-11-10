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
  listTemplatesRoute,
  listToolsRoute,
  planMarketplaceToolRoute,
  promoteRoute,
  promotionPlanRoute,
  putAccessMatrixRoute,
  rollbackRoute,
  secretsStatusRoute,
  setMemberRolesRoute,
  toolCardRoute,
  toolVersionsRoute,
  usageRoute,
} from "@forgeron/platform-contract";
import { z } from "zod";

// The tools of the admin MCP (sdk.md §17). A tool is a name, a minimum role, whether it changes
// anything, an input and a function of the platform port. The port is the whole of what a tool can
// reach: the platform's own routes, called with the caller's identity (so the console's guard, its
// validation and its audit lines apply), never the registry. A rule of `.dependency-cruiser.cjs`
// keeps this folder from importing it.

export type Role = "member" | "developer" | "admin";

/** What a tool may ask of the platform: one of its routes, answered as it would to the console. */
interface PlatformCall {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  body?: unknown;
  /** `console` for `/console-api/…` routes (the default), `root` for `/promote` and `/rollback`. */
  surface?: "console" | "root";
}
export type PlatformPort = (call: PlatformCall) => Promise<{ status: number; body: unknown }>;

/** A refusal the person should read: the platform said no, or the request names nothing real. */
export class ToolRefusal extends Error {}

export interface ToolDefinition {
  name: string;
  title: string;
  description: string;
  minRole: Role;
  /** A tool that changes something carries the MCP `destructiveHint`: the client asks first. */
  destructive: boolean;
  input: z.ZodObject;
  run(args: never, port: PlatformPort): Promise<unknown>;
}

const NAME = /^[a-z0-9][a-z0-9-]*$/;
const ROLE = /^[A-Za-z][A-Za-z0-9_-]{0,39}$/;
const tool = z.string().regex(NAME).max(60).describe("The tool's name");
const SECRET_NAME = /^[A-Z][A-Z0-9_]*$/;
const environment = z.enum(["production", "preview"]);
const branch = z.string().min(1).max(100).optional();
const reason = z.string().max(500).optional().describe("Why, in the audit line");

/** A version, or the branch whose preview serves it; the target and its branch (D-113). */
const planInput = z.strictObject({
  tool,
  version: z.string().min(1).max(64).optional().describe("A version number, or `fromBranch`"),
  fromBranch: branch.describe("The branch whose preview serves the version to promote"),
  to: environment,
  branch: branch.describe("The target's branch, for a preview"),
});
const promotionBody = (args: z.infer<typeof planInput>) => ({
  tool: args.tool,
  to: args.to,
  ...(args.version ? { version: args.version } : {}),
  ...(args.fromBranch ? { fromBranch: args.fromBranch } : {}),
  ...(args.branch ? { branch: args.branch } : {}),
});

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
  roles: string[];
}

/** The member a person names, by id or by email. */
async function memberOf(port: PlatformPort, who: string): Promise<Member> {
  const { members } = (await ask(port, { method: "GET", path: listMembersRoute.path })) as {
    members: Member[];
  };
  const found = members.find((m) => m.id === who || m.email.toLowerCase() === who.toLowerCase());
  if (!found) throw new ToolRefusal(`404 NOT_FOUND: there is no member ${who}.`);
  return found;
}

const target = z.strictObject({
  person: z.string().min(1).max(200).optional().describe("A member's id or email"),
  role: z
    .string()
    .regex(ROLE)
    .describe("A workspace role (with `person`), or a role of the tool (with `tool` and `action`)"),
  tool: tool.optional(),
  action: z.string().min(1).max(100).optional().describe("An action of the tool, or `view:<name>`"),
});

/** `person` names a member, `tool` and `action` name a cell of the matrix: one or the other. */
function aim(args: z.infer<typeof target>): { person: string } | { tool: string; action: string } {
  const { person, tool: name, action } = args;
  if (person !== undefined && name === undefined && action === undefined) return { person };
  if (person === undefined && name !== undefined && action !== undefined) {
    return { tool: name, action };
  }
  throw new ToolRefusal("Name a `person`, or a `tool` and an `action`, not both.");
}

async function setAccess(args: z.infer<typeof target>, port: PlatformPort, grant: boolean) {
  const aimed = aim(args);
  if ("person" in aimed) {
    const member = await memberOf(port, aimed.person);
    const roles = grant
      ? [...new Set([...member.roles, args.role])]
      : member.roles.filter((r) => r !== args.role);
    return ask(port, {
      method: "PATCH",
      path: at(setMemberRolesRoute.path, { id: member.id }),
      body: { roles },
    });
  }
  return ask(port, {
    method: "PUT",
    path: at(putAccessMatrixRoute.path, { tool: aimed.tool }),
    // A revocation is an explicit refusal of the role for the action, not a return to the default.
    body: { changes: [{ role: args.role, action: aimed.action, allowed: grant }] },
  });
}

export const TOOLS: readonly ToolDefinition[] = [
  define({
    name: "catalog_search",
    title: "Search the catalog",
    description: "Searches the workspace's catalog of tools by name, title or summary.",
    minRole: "member",
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
    minRole: "member",
    destructive: false,
    input: z.strictObject({ tool }),
    run: ({ tool: name }, port) =>
      ask(port, { method: "GET", path: at(toolCardRoute.path, { tool: name }) }),
  }),
  define({
    name: "tools_list",
    title: "List the tools",
    description: "The workspace's tools and the version each environment serves.",
    minRole: "member",
    destructive: false,
    input: none,
    run: (_, port) => ask(port, { method: "GET", path: listToolsRoute.path }),
  }),
  define({
    name: "tool_get",
    title: "Get a tool",
    description: "A tool's detail: its versions per environment and its card.",
    minRole: "member",
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
    minRole: "developer",
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
    // The route that carries the changelog is for developers (sdk.md §17).
    minRole: "developer",
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
    minRole: "developer",
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
    minRole: "developer",
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
    description: "The versions that wait for an admin to approve their new resources.",
    minRole: "admin",
    destructive: false,
    input: none,
    run: (_, port) => ask(port, { method: "GET", path: listApprovalsRoute.path }),
  }),
  define({
    name: "resources_approve",
    title: "Approve a resource",
    description: "Approves one pending request for a resource, by its identifier.",
    minRole: "admin",
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
    title: "Who has which role",
    description:
      "With `tool`: the tool's roles × actions matrix. Without: the workspace's members and their roles.",
    minRole: "admin",
    destructive: false,
    input: z.strictObject({ tool: tool.optional() }),
    async run({ tool: name }, port) {
      if (name) {
        return ask(port, { method: "GET", path: at(getAccessMatrixRoute.path, { tool: name }) });
      }
      const { members } = (await ask(port, { method: "GET", path: listMembersRoute.path })) as {
        members: unknown[];
      };
      return { members };
    },
  }),
  define({
    name: "access_grant",
    title: "Grant a role",
    description:
      "Gives a member a workspace role (`person`, `role`), or allows a role an action of a tool (`tool`, `role`, `action`).",
    minRole: "admin",
    destructive: true,
    input: target,
    run: (args, port) => setAccess(args, port, true),
  }),
  define({
    name: "access_revoke",
    title: "Revoke a role",
    description:
      "Takes a workspace role from a member (`person`, `role`), or refuses a role an action of a tool (`tool`, `role`, `action`).",
    minRole: "admin",
    destructive: true,
    input: target,
    run: (args, port) => setAccess(args, port, false),
  }),
  define({
    name: "usage_report",
    title: "Usage of the workspace",
    description:
      "Authenticated calls per tool and per person over a period of UTC days (`from`, `to`, `YYYY-MM-DD`; the last 30 days by default). Counts only: no payload, no path.",
    minRole: "admin",
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
    minRole: "admin",
    destructive: false,
    input: z.strictObject({}),
    run: (_args, port) => ask(port, { method: "GET", path: listTemplatesRoute.path }),
  }),
  define({
    name: "marketplace_list",
    title: "List the marketplaces",
    description:
      "The official catalogue (`official`) and the marketplaces the workspace added, with when each was last synced. Adding, syncing or removing a marketplace is done in the console.",
    minRole: "admin",
    destructive: false,
    input: z.strictObject({}),
    run: (_args, port) => ask(port, { method: "GET", path: listMarketplacesRoute.path }),
  }),
  define({
    name: "marketplace_tools",
    title: "List what a marketplace offers",
    description:
      "The tools of a marketplace at their latest version, with the resources each would ask for and whether the workspace already has it.",
    minRole: "admin",
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
    minRole: "admin",
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
    minRole: "admin",
    destructive: true,
    input: z.strictObject({ plan: z.string().min(1).max(64).describe("The plan's identifier") }),
    run: ({ plan }, port) =>
      ask(port, { method: "POST", path: at(installFromPlanRoute.path, { plan }) }),
  }),
  define({
    name: "tool_source",
    title: "Read a tool's update",
    description:
      "Where a tool comes from (a marketplace or a GitHub repository), the version production serves, and the update waiting for it: its version, whether it is a release, its changelog, and what it asks to approve. It changes nothing.",
    minRole: "admin",
    destructive: false,
    input: z.strictObject({ tool: z.string().min(1).max(64) }),
    run: ({ tool }, port) =>
      ask(port, { method: "GET", path: at(getToolSourceRoute.path, { tool }) }),
  }),
  define({
    name: "tool_update",
    title: "Put a tool's update in production",
    description:
      "Puts the update `tool_source` showed in production. `version` is the one it showed: a newer update is refused, read it again. `approve` approves what it asks for; `withoutRelease` takes a build with no release, knowingly. Show the person both before setting them.",
    minRole: "admin",
    destructive: true,
    input: z.strictObject({
      tool: z.string().min(1).max(64),
      version: z.string().min(1).max(200),
      approve: z.boolean().optional(),
      withoutRelease: z.boolean().optional(),
    }),
    run: ({ tool, ...body }, port) =>
      ask(port, { method: "POST", path: at(updateToolRoute.path, { tool }), body }),
  }),
  define({
    name: "tool_promote_plan",
    title: "Check a promotion",
    description:
      "Says whether a version, or the version a branch serves, can go to an environment, and what stops it: a migration the target's database has applied and this version lacks, an edited or out-of-order one, the changelog, an approval. It changes nothing. When something stops it, the answer carries a `prompt` to follow to fix it.",
    minRole: "admin",
    destructive: false,
    input: planInput,
    run: (args, port) =>
      ask(port, {
        method: "POST",
        path: promotionPlanRoute.path,
        surface: "root",
        body: promotionBody(args),
      }),
  }),
  define({
    name: "tool_promote",
    title: "Promote a version",
    description:
      "Puts a version the tool already has on an environment, or the version a branch serves (`fromBranch`). Production takes traffic. It checks the plan first: when something stops it, nothing moves and the answer is the plan, with the conflicts and a `prompt` to follow.",
    minRole: "admin",
    destructive: true,
    input: planInput.extend({ reason }),
    // `allowDestructive` (a migration that drops data) is not offered here: it stays in the CLI.
    run: async (args, port) => {
      const body = promotionBody(args);
      const plan = (await ask(port, {
        method: "POST",
        path: promotionPlanRoute.path,
        surface: "root",
        body,
      })) as { ok?: boolean };
      if (plan.ok === false) return { promoted: false, plan };
      return ask(port, {
        method: "POST",
        path: promoteRoute.path,
        surface: "root",
        body: { ...body, ...(args.reason ? { reason: args.reason } : {}) },
      });
    },
  }),
  define({
    name: "tool_rollback",
    title: "Roll back an environment",
    description: "Serves again the version an environment served before the current one.",
    minRole: "admin",
    destructive: true,
    input: z.strictObject({ tool, environment, branch, reason }),
    run: ({ tool: name, environment: env, branch: on, reason: why }, port) =>
      ask(port, {
        method: "POST",
        path: rollbackRoute.path,
        surface: "root",
        body: {
          tool: name,
          environment: env,
          ...(on ? { branch: on } : {}),
          ...(why ? { reason: why } : {}),
        },
      }),
  }),
];
