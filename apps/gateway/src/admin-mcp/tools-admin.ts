import {
  addChannelRoute,
  addMarketplaceRoute,
  auditRoute,
  clearUserSetupRoute,
  clearUserSetupValueRoute,
  closePreviewRoute,
  copyBranchDataRoute,
  createGithubToolRoute,
  createTeamRoute,
  dbEnvironmentsRoute,
  dbMigrationsRoute,
  dbQueryRoute,
  dbRowsRoute,
  dbSchemaRoute,
  dbTableRoute,
  dbTablesRoute,
  deleteConnectorClientRoute,
  deleteIdentityProviderRoute,
  deleteTeamRoute,
  deleteToolRoute,
  disconnectGithubRoute,
  getAvailabilityRoute,
  getGithubRoute,
  getIdentityProviderRoute,
  getMembershipSettingsRoute,
  getPilotAvailabilityRoute,
  getPlatformUpdateRoute,
  getPlatformUpdateRunRoute,
  inviteMemberRoute,
  linkGithubRepositoryRoute,
  listConnectionsRoute,
  listConnectorClientsRoute,
  listGithubRepositoriesRoute,
  listPermissionsRoute,
  listUserSecretHoldersRoute,
  listUserSetupRoute,
  marketplaceToolCardRoute,
  putAvailabilityRoute,
  putChannelRoute,
  putMembershipSettingsRoute,
  putPilotAvailabilityRoute,
  putToolSourceRoute,
  removeChannelRoute,
  removeMarketplaceRoute,
  removeMemberRoute,
  resealSecretsRoute,
  revokeConnectionRoute,
  revokePersonTokensRoute,
  revokeUserSecretRoute,
  revokeUserSecretsRoute,
  startPlatformUpdateRoute,
  syncMarketplaceRoute,
  toolActivityRoute,
  toolBranchesRoute,
  toolCiRoute,
  toolManifestRoute,
  withdrawInvitationRoute,
  workspaceRoute,
} from "@forgeron/platform-contract";
import { z } from "zod";
import { ToolRefusal, type PlatformPort, type Requires, type ToolDefinition } from "./kit";

// The rest of the console, as tools (D-139). Each tool here is one route of the platform contract: its
// input is the route's own schema (path, query and body together), so the tool and the console cannot
// drift apart, and the route's own guard, validation and audit line apply when it is called with the
// person's identity. What is not here, on purpose:
//
// - **Anything that takes or gives a secret**: setting a secret, a per-person secret, an OAuth client
//   secret, the sign-in provider (it carries one), a marketplace's read token, a deployment token, a
//   personal or CLI token, a link to fill in a secret. `secret_request` hands a person a link instead.
// - **What is not JSON, or not an administrator's**: a CSV export, an image, the OAuth consent flow of a
//   person, a person's own library and picture, a deployment (CI's), the tool a repository's CI deploys
//   with its token.
// - **What already has a safer way in**: installing from a template or a marketplace (a plan first,
//   `tool_install_plan` then `tool_install`).

interface Spec {
  name: string;
  title: string;
  description: string;
  requires: Requires;
  /** The route this tool calls. */
  route: {
    method: string;
    path: string;
    request?: {
      params?: z.ZodObject;
      query?: z.ZodObject;
      body?: { content: { "application/json": { schema: z.ZodType } } };
    };
  };
  /** A tool that changes something carries the MCP `destructiveHint`: the client asks first. */
  destructive: boolean;
  /** `console` for `/console-api/…` routes (the default), `root` for the gateway's own paths. */
  surface?: "console" | "root";
  /** Keys of the route's query or body that the tool does not offer: never a secret, nor a switch that widens what the console lets a person see. */
  omit?: readonly string[];
}

const bodyOf = (spec: Spec): z.ZodObject | undefined => {
  const schema = spec.route.request?.body?.content["application/json"].schema;
  if (!schema) return undefined;
  if (!("shape" in schema)) {
    throw new Error(`${spec.name}: the body of ${spec.route.path} is not an object.`);
  }
  return schema as z.ZodObject;
};

/** One tool from one route: the input is its path, query and body, told apart again when it runs. */
function viaRoute(spec: Spec): ToolDefinition {
  const omitted = new Set(spec.omit ?? []);
  const keep = (shape: z.ZodRawShape | undefined) =>
    Object.fromEntries(Object.entries(shape ?? {}).filter(([key]) => !omitted.has(key)));
  const params = spec.route.request?.params?.shape ?? {};
  // A query is text on the wire, but a person asks for "5 lines", not "5": these are numbers here.
  const query = Object.fromEntries(
    Object.entries(keep(spec.route.request?.query?.shape)).map(([key, schema]) => [
      key,
      COUNTS.has(key)
        ? z.number().int().min(1).max(1000).optional().describe(`How many (${key})`)
        : schema,
    ]),
  );
  const body = keep(bodyOf(spec)?.shape);
  const input: Record<string, z.ZodType> = {};
  for (const part of [params, query, body]) {
    for (const [key, schema] of Object.entries(part)) {
      if (key in input) throw new Error(`${spec.name}: "${key}" is in two parts of the route.`);
      input[key] = schema as z.ZodType;
    }
  }
  const method = spec.route.method.toUpperCase() as "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  const hasBody = Object.keys(body).length > 0 || bodyOf(spec) !== undefined;

  return {
    name: spec.name,
    title: spec.title,
    description: spec.description,
    requires: spec.requires,
    destructive: spec.destructive,
    input: z.strictObject(input),
    async run(args: Record<string, unknown>, port: PlatformPort) {
      const path = spec.route.path.replace(/\{(\w+)\}/g, (_, key: string) =>
        encodeURIComponent(String(args[key] ?? "")),
      );
      const search = new URLSearchParams();
      for (const key of Object.keys(query)) {
        if (args[key] !== undefined) search.set(key, String(args[key]));
      }
      const payload: Record<string, unknown> = {};
      for (const key of Object.keys(body)) {
        if (args[key] !== undefined) payload[key] = args[key];
      }
      const { status, body: answer } = await port({
        method,
        path: search.size > 0 ? `${path}?${search}` : path,
        ...(hasBody ? { body: payload } : {}),
        ...(spec.surface ? { surface: spec.surface } : {}),
      });
      // A `204` has no body: say that it was done, since a client reads JSON.
      if (status < 400) return answer ?? { ok: true };
      const error = (answer ?? {}) as {
        error?: string | { code?: string; message?: string };
        message?: string;
      };
      const code = typeof error.error === "string" ? error.error : error.error?.code;
      const message =
        error.message ?? (typeof error.error === "object" ? error.error?.message : undefined);
      throw new ToolRefusal(`${status} ${code ?? "ERROR"}${message ? `: ${message}` : ""}`);
    },
  } as unknown as ToolDefinition;
}

/** Query keys that count something, offered as whole numbers. */
const COUNTS = new Set(["limit", "page"]);

/** What the explorer's switches do beyond the console's defaults: not offered here. */
const EXPLORER_SWITCHES = ["platform", "reveal"] as const;

const READ = false;
const WRITE = true;

export const ADMIN_TOOLS: readonly ToolDefinition[] = [
  // ── The workspace ───────────────────────────────────────────────────────────────────────────────
  viaRoute({
    name: "workspace_get",
    title: "Read the workspace",
    description:
      "The workspace, the signed-in person and the first-run counts: who you are here and what the workspace holds.",
    requires: "signed-in",
    route: workspaceRoute,
    destructive: READ,
  }),
  viaRoute({
    name: "permissions_list",
    title: "List the platform permissions",
    description:
      "The platform permissions a team may be given, with their labels: what `team_set_permissions` and the other administration tools name.",
    requires: "signed-in",
    route: listPermissionsRoute,
    destructive: READ,
  }),
  viaRoute({
    name: "audit_list",
    title: "Read the audit log",
    description:
      "The latest audit lines of the workspace's tools, newest first, without their payloads. `limit` caps the lines.",
    requires: "audit:read",
    route: auditRoute,
    destructive: READ,
  }),

  // ── A tool, its channels and what is behind them ───────────────────────────────────────────────
  viaRoute({
    name: "tool_manifest",
    title: "Read a tool's manifest",
    description:
      "The manifest of the version production serves, else of the latest one published; with `branch`, that branch's preview: its actions, views, resources and what it declares.",
    requires: "tools:read",
    route: toolManifestRoute,
    destructive: READ,
  }),
  viaRoute({
    name: "tool_branches",
    title: "List a tool's channels",
    description:
      "The channels of a tool: production, the other permanent ones, and one per pushed branch, with the last deployment of each (version, commit, who, when, address, state).",
    requires: "tools:read",
    route: toolBranchesRoute,
    destructive: READ,
  }),
  viaRoute({
    name: "tool_activity",
    title: "Read a tool's activity",
    description: "A tool's audit lines, newest first. `limit` caps the lines.",
    requires: "tools:read",
    route: toolActivityRoute,
    destructive: READ,
  }),
  viaRoute({
    name: "tool_ci",
    title: "Read a tool's CI runs",
    description:
      "The recent GitHub Actions runs of the tool's repository, newest first, with their state: why a deployment did not arrive. `branch` narrows them.",
    requires: "tools:read",
    route: toolCiRoute,
    destructive: READ,
  }),
  viaRoute({
    name: "preview_close",
    title: "Close a branch's preview",
    description:
      "Removes the preview of a branch: its Worker, its database and everything it owns. The next push of the branch makes a new one, seeded again. Removing a preview that is already gone succeeds. Production is never touched.",
    requires: "tools:write",
    route: closePreviewRoute,
    surface: "root",
    destructive: WRITE,
  }),
  viaRoute({
    name: "tool_delete",
    title: "Delete a tool for good",
    description:
      "Deletes a tool: every environment, production included, with its Workers, its databases and what it stored. It cannot be undone. `confirm` is the tool's name.",
    requires: "tools:delete",
    route: deleteToolRoute,
    destructive: WRITE,
  }),
  viaRoute({
    name: "tool_source_set",
    title: "Set how a tool updates",
    description:
      "Whether a release goes to production by itself (`autoUpdate`) and which branch production follows (`productionBranch`).",
    requires: "tools:write",
    route: putToolSourceRoute,
    destructive: WRITE,
  }),
  viaRoute({
    name: "channel_add",
    title: "Add a permanent channel",
    description:
      "Adds a permanent channel (`staging`) that follows a branch's releases, with its own Worker and database, empty. `autoUpdate` makes it take them by itself.",
    requires: "tools:write",
    route: addChannelRoute,
    destructive: WRITE,
  }),
  viaRoute({
    name: "channel_update",
    title: "Change a permanent channel",
    description:
      "Changes the branch a permanent channel follows (`follows`) or whether it updates by itself (`autoUpdate`).",
    requires: "tools:write",
    route: putChannelRoute,
    destructive: WRITE,
  }),
  viaRoute({
    name: "channel_remove",
    title: "Remove a permanent channel",
    description:
      "Removes a permanent channel with its Worker and its database. Never production. `confirm` is the channel's name.",
    requires: "tools:write",
    route: removeChannelRoute,
    destructive: WRITE,
  }),
  viaRoute({
    name: "branch_data_copy",
    title: "Copy a branch's data onto another",
    description:
      "Replaces the data of a branch's preview by another branch's. Never production's: it is neither copied nor replaced. `confirm` is the branch that is replaced.",
    requires: "tools:data",
    route: copyBranchDataRoute,
    destructive: WRITE,
  }),

  // ── Who may add a tool ──────────────────────────────────────────────────────────────────────────
  viaRoute({
    name: "availability_get",
    title: "Read who may add a tool",
    description:
      "Who may add a tool to their library: nobody (a draft), everyone, some teams, some people.",
    requires: "access:read",
    route: getAvailabilityRoute,
    destructive: READ,
  }),
  viaRoute({
    name: "availability_set",
    title: "Set who may add a tool",
    description:
      "Publishes a tool or takes it back to a draft: `mode` is `nobody`, `everyone`, `teams` or `people`, with the `teams` or `people` named. Refused while production has no version.",
    requires: "access:write",
    route: putAvailabilityRoute,
    destructive: WRITE,
  }),
  viaRoute({
    name: "preview_availability_get",
    title: "Read who may use a preview",
    description:
      "Who may use a channel of a tool other than production, such as a branch's preview.",
    requires: "access:read",
    route: getPilotAvailabilityRoute,
    destructive: READ,
  }),
  viaRoute({
    name: "preview_availability_set",
    title: "Set who may use a preview",
    description:
      "Opens a branch's preview to people, or closes it again: same `mode` as `availability_set`. Refused while the channel has no version.",
    requires: "access:write",
    route: putPilotAvailabilityRoute,
    destructive: WRITE,
  }),

  // ── The database of a tool (read, and a guarded statement) ─────────────────────────────────────
  viaRoute({
    name: "db_environments",
    title: "List a tool's databases",
    description: "The environments of a tool that have a version, so a database to look at.",
    requires: "tools:data",
    route: dbEnvironmentsRoute,
    destructive: READ,
  }),
  viaRoute({
    name: "db_tables",
    title: "List a database's tables",
    description:
      "The tables of an environment's database with their row and column counts. `env` is `production` (default) or `preview`, with `branch`.",
    requires: "tools:data",
    route: dbTablesRoute,
    omit: EXPLORER_SWITCHES,
    destructive: READ,
  }),
  viaRoute({
    name: "db_schema",
    title: "Read a database's schema",
    description: "Every table's definition with its row count: the tables and their relations.",
    requires: "tools:data",
    route: dbSchemaRoute,
    omit: EXPLORER_SWITCHES,
    destructive: READ,
  }),
  viaRoute({
    name: "db_table",
    title: "Read a table's definition",
    description: "One table's columns, keys and indexes.",
    requires: "tools:data",
    route: dbTableRoute,
    omit: EXPLORER_SWITCHES,
    destructive: READ,
  }),
  viaRoute({
    name: "db_rows",
    title: "Read a table's rows",
    description:
      "A page of rows, sorted (`sort`, `dir`) and filtered (`filter`). Read only; columns the tool marks sensitive are masked.",
    requires: "tools:data",
    route: dbRowsRoute,
    omit: EXPLORER_SWITCHES,
    destructive: READ,
  }),
  viaRoute({
    name: "db_migrations",
    title: "Read a database's migrations",
    description:
      "The migrations of an environment's database against the version it serves: applied, pending, edited. What to look at when a seed or an update fails.",
    requires: "tools:data",
    route: dbMigrationsRoute,
    destructive: READ,
  }),
  viaRoute({
    name: "db_query",
    title: "Run one SQL statement",
    description:
      "Runs one statement on an environment's database. A statement that reads runs as it is. One that writes needs `write: true`, and on production `confirm` set to the tool's name. It is audited before it runs.",
    requires: "tools:data",
    route: dbQueryRoute,
    destructive: WRITE,
  }),

  // ── Members, invitations, teams ────────────────────────────────────────────────────────────────
  viaRoute({
    name: "invitation_send",
    title: "Invite an address",
    description:
      "Invites an email address, into `teams`, and tells it by mail when the install can send one. The invitation lasts 14 days.",
    requires: "members:write",
    route: inviteMemberRoute,
    destructive: WRITE,
  }),
  viaRoute({
    name: "invitation_withdraw",
    title: "Withdraw an invitation",
    description: "Withdraws the invitation of an email address.",
    requires: "members:write",
    route: withdrawInvitationRoute,
    destructive: WRITE,
  }),
  viaRoute({
    name: "member_remove",
    title: "Remove a member",
    description:
      "Removes a member by id (`workspace_get` or `member_set_teams` show it): their sessions stop at once. The last administrator cannot be removed.",
    requires: "members:write",
    route: removeMemberRoute,
    destructive: WRITE,
  }),
  viaRoute({
    name: "membership_settings_get",
    title: "Read who joins by domain",
    description: "Who joins by email domain, and in which teams.",
    requires: "members:read",
    route: getMembershipSettingsRoute,
    destructive: READ,
  }),
  viaRoute({
    name: "membership_settings_set",
    title: "Set who joins by domain",
    description:
      "Sets the email domains whose people join at sign-in (`domains`) and the teams they join in (`defaultTeams`, never `admin`).",
    requires: "members:write",
    route: putMembershipSettingsRoute,
    destructive: WRITE,
  }),
  viaRoute({
    name: "team_create",
    title: "Create a team",
    description:
      "Creates a team (`id`, `name`), with its `members` and the platform `permissions` it holds (`permissions_list`).",
    requires: "teams:write",
    route: createTeamRoute,
    destructive: WRITE,
  }),
  viaRoute({
    name: "team_delete",
    title: "Delete a team",
    description:
      "Deletes a team and what it was given in tools. A built-in team cannot be deleted, nor the last that holds administration.",
    requires: "teams:write",
    route: deleteTeamRoute,
    destructive: WRITE,
  }),
  viaRoute({
    name: "person_tokens_revoke",
    title: "Revoke a person's tokens",
    description:
      "Revokes every token of a person at once: their CLI tokens, their API tokens and what they gave their agents.",
    requires: "tools:approve",
    route: revokePersonTokensRoute,
    destructive: WRITE,
  }),

  // ── What people gave a tool ────────────────────────────────────────────────────────────────────
  viaRoute({
    name: "connections_list",
    title: "List who connected a connector",
    description:
      "Who consented to a connector of the tool in an environment (`production` or `preview`): people, never their tokens.",
    requires: "members:read",
    route: listConnectionsRoute,
    destructive: READ,
  }),
  viaRoute({
    name: "connection_revoke",
    title: "Revoke a person's consent",
    description: "Revokes one person's consent to a connector of the tool, in one environment.",
    requires: "members:write",
    route: revokeConnectionRoute,
    destructive: WRITE,
  }),
  viaRoute({
    name: "user_secret_holders",
    title: "List who holds per-person secrets",
    description: "Who holds which per-person secrets of a tool: names only, never a value.",
    requires: "tools:approve",
    route: listUserSecretHoldersRoute,
    destructive: READ,
  }),
  viaRoute({
    name: "user_secrets_revoke",
    title: "Revoke all of a person's secrets",
    description: "Revokes every per-person secret one person gave a tool: they are asked again.",
    requires: "tools:approve",
    route: revokeUserSecretsRoute,
    destructive: WRITE,
  }),
  viaRoute({
    name: "user_secret_revoke",
    title: "Revoke one of a person's secrets",
    description: "Revokes one per-person secret (`name`) of one person.",
    requires: "tools:approve",
    route: revokeUserSecretRoute,
    destructive: WRITE,
  }),
  viaRoute({
    name: "user_setup_list",
    title: "List what people gave a tool's setup",
    description: "What each person gave a tool's setup: their plain values (not secrets).",
    requires: "tools:approve",
    route: listUserSetupRoute,
    destructive: READ,
  }),
  viaRoute({
    name: "user_setup_clear",
    title: "Clear a person's setup",
    description: "Clears all the plain values of one person for a tool: they are asked again.",
    requires: "tools:approve",
    route: clearUserSetupRoute,
    destructive: WRITE,
  }),
  viaRoute({
    name: "user_setup_value_clear",
    title: "Clear one value of a person's setup",
    description: "Clears one plain value (`name`) of one person for a tool.",
    requires: "tools:approve",
    route: clearUserSetupValueRoute,
    destructive: WRITE,
  }),
  viaRoute({
    name: "secrets_reseal",
    title: "Seal the stored secrets again",
    description:
      "Seals this workspace's stored secrets again under the current key (after a key rotation). Reads and shows no value.",
    requires: "tools:secrets",
    route: resealSecretsRoute,
    destructive: WRITE,
  }),

  // ── Marketplaces, GitHub, sign-in, connectors ──────────────────────────────────────────────────
  viaRoute({
    name: "marketplace_tool_get",
    title: "Read a marketplace tool's card",
    description:
      "The technical card of a tool of a marketplace (`marketplace_tools` lists them): what it declares and asks for.",
    requires: "marketplace:read",
    route: marketplaceToolCardRoute,
    destructive: READ,
  }),
  viaRoute({
    name: "marketplace_add",
    title: "Add a public marketplace",
    description:
      "Adds a public GitHub repository as a marketplace (`repo`, as `owner/name`). A private one needs a read token, which does not go through the MCP: add it from the console.",
    requires: "marketplace:write",
    route: addMarketplaceRoute,
    omit: ["token"],
    destructive: WRITE,
  }),
  viaRoute({
    name: "marketplace_remove",
    title: "Remove a marketplace",
    description: "Removes a marketplace and its token; the tools installed from it stay.",
    requires: "marketplace:write",
    route: removeMarketplaceRoute,
    destructive: WRITE,
  }),
  viaRoute({
    name: "marketplace_sync",
    title: "Sync a marketplace",
    description: "Reads the marketplace's index and records the versions it publishes.",
    requires: "marketplace:write",
    route: syncMarketplaceRoute,
    destructive: WRITE,
  }),
  viaRoute({
    name: "github_get",
    title: "Read the workspace's GitHub App",
    description: "The workspace's GitHub App and where it is installed.",
    requires: "settings:read",
    route: getGithubRoute,
    destructive: READ,
  }),
  viaRoute({
    name: "github_repositories",
    title: "List the repositories the GitHub App sees",
    description:
      "The repositories the app's installations may see, with whether each holds a Forgeron tool and its workflow, and the tool it is linked to.",
    requires: "tools:write",
    route: listGithubRepositoriesRoute,
    destructive: READ,
  }),
  viaRoute({
    name: "github_link_repository",
    title: "Add a tool from a repository",
    description:
      "Adds a tool from a repository the app may see (`repo`, `name`, `productionBranch`); its CI deploys with no token. `addWorkflow` commits the workflow when the repository has none.",
    requires: "tools:write",
    route: linkGithubRepositoryRoute,
    destructive: WRITE,
  }),
  viaRoute({
    name: "github_create_tool",
    title: "Make a new tool in a new repository",
    description:
      "Makes a new tool: a repository in an organisation (`owner`), made as `forgeron init` would, linked to the workspace.",
    requires: "tools:write",
    route: createGithubToolRoute,
    destructive: WRITE,
  }),
  viaRoute({
    name: "github_disconnect",
    title: "Forget the GitHub App",
    description:
      "Forgets the workspace's GitHub App (it stays on GitHub, where its owner deletes it). The tools added from GitHub keep their link but their CI can no longer deploy.",
    requires: "settings:write",
    route: disconnectGithubRoute,
    destructive: WRITE,
  }),
  viaRoute({
    name: "identity_provider_get",
    title: "Read the sign-in provider",
    description: "The workspace's sign-in provider (OIDC or SAML), or null; no secret.",
    requires: "settings:read",
    route: getIdentityProviderRoute,
    destructive: READ,
  }),
  viaRoute({
    name: "identity_provider_remove",
    title: "Remove the sign-in provider",
    description:
      "Removes the sign-in provider. Setting one carries a client secret, which does not go through the MCP: set it from the console.",
    requires: "settings:write",
    route: deleteIdentityProviderRoute,
    destructive: WRITE,
  }),
  viaRoute({
    name: "connector_clients_list",
    title: "List the connectors' OAuth clients",
    description: "The OAuth clients of the delegated connectors, without their secrets.",
    requires: "settings:read",
    route: listConnectorClientsRoute,
    destructive: READ,
  }),
  viaRoute({
    name: "connector_client_remove",
    title: "Remove a connector's OAuth client",
    description: "Removes the OAuth client of a connector (`type`).",
    requires: "settings:write",
    route: deleteConnectorClientRoute,
    destructive: WRITE,
  }),

  // ── The platform itself ────────────────────────────────────────────────────────────────────────
  viaRoute({
    name: "platform_update_get",
    title: "Read the platform's version",
    description:
      "The version this platform runs, the latest release, and what updating would do (migrations, whether the release can be installed from here).",
    requires: "settings:read",
    route: getPlatformUpdateRoute,
    destructive: READ,
  }),
  viaRoute({
    name: "platform_update_run",
    title: "Follow a platform update",
    description: "An update run (`id`) and its steps, as `platform_update_start` started it.",
    requires: "settings:read",
    route: getPlatformUpdateRunRoute,
    destructive: READ,
  }),
  viaRoute({
    name: "platform_update_start",
    title: "Update the platform",
    description:
      "Updates this platform to a release (`version`, as `platform_update_get` showed it), with a restore point of its database. It restarts the gateway on the new code.",
    requires: "platform:update",
    route: startPlatformUpdateRoute,
    destructive: WRITE,
  }),
];
