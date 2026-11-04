import {
  decideApprovalRoute,
  getAccessMatrixRoute,
  listApprovalsRoute,
  listCatalogRoute,
  listMembersRoute,
  listToolsRoute,
  promoteRoute,
  putAccessMatrixRoute,
  rollbackRoute,
  secretsStatusRoute,
  setMemberRolesRoute,
  toolCardRoute,
  toolVersionsRoute,
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
const environment = z.enum(["production", "preview"]);
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
    name: "tool_promote",
    title: "Promote a version",
    description: "Puts a version the tool already has on an environment. Production takes traffic.",
    minRole: "admin",
    destructive: true,
    input: z.strictObject({
      tool,
      version: z.string().min(1).max(64),
      to: environment,
      branch,
      reason,
    }),
    // `allowDestructive` (a migration that drops data) is not offered here: it stays in the CLI.
    run: ({ tool: name, version, to, branch: on, reason: why }, port) =>
      ask(port, {
        method: "POST",
        path: promoteRoute.path,
        surface: "root",
        body: {
          tool: name,
          version,
          to,
          ...(on ? { branch: on } : {}),
          ...(why ? { reason: why } : {}),
        },
      }),
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
