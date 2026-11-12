import type { Manifest } from "@forgeron/manifest";
import { teamRole, type Registry } from "@forgeron/registry";
import {
  type ConnectorStep,
  handleSecretsInput,
  type SavedSecrets,
  type SetupCheckResult,
  type UserSecretStore,
  type UserSetupStore,
} from "@forgeron/runtime";
import type { Person } from "../kernel/person";
import { page } from "../pages/shell";
import { libraryAccess, libraryPath } from "../library/library";
import { connectorHeaders, type ConnectorTokensContext } from "./connector-tokens";
import type { Forwarding } from "./dispatch";

// Per-person secrets at the gateway (D-036). The tool's own code never receives the form or the
// stored value of anyone: the gateway keeps them sealed in the platform D1, serves
// `/t/<tool>/secrets`, and hands a call only the caller's own values, in a header the tool's
// runtime reads and a caller cannot set (the dispatcher drops it).

export interface UserSecretsContext {
  registry: Pick<
    Registry,
    | "accessFor"
    | "availabilityOf"
    | "currentManifest"
    | "isInstalled"
    | "bindUserSecret"
    | "findTool"
    | "listConnections"
    | "findMember"
    | "listMembers"
    | "listTeams"
    | "teamsOfMember"
    | "listPersonSecrets"
    | "readPersonSecret"
    | "readUserSecrets"
    | "readUserSetup"
    | "recordAudit"
    | "setUserSecret"
    | "writeUserSetup"
  >;
  workspace: string;
  /** The person and the audience of their token, if any (a session has none). */
  identify(request: Request): Promise<{ person: Person; audience?: string } | undefined>;
  /**
   * Asks the tool's Worker to check the values a person is about to give its setup (D-101). Without it
   * nothing is checked. A tool that cannot be reached answers that the check could not be completed.
   */
  checkSetup?(
    tool: string,
    person: Person,
    candidate: { setup: Record<string, string>; secrets: Record<string, string> },
  ): Promise<SetupCheckResult>;
  /** Delegated connectors (D-046): without it a tool's connectors get no token. */
  connectors?: Pick<ConnectorTokensContext, "consent" | "consentUrl">;
}

/**
 * Where a setup page sends a person on: the OAuth authorization step of this workspace, or the tool's
 * page of their library in the console (D-117).
 */
const SETUP_NEXT =
  /^(?:\/oauth\/authorize\?[A-Za-z0-9%._~!$&'()*+,;=:@/?-]*|\/library\/[a-z0-9-]+(?:\/pilots\/[a-z0-9._-]+)?)$/;

const refuse = (status: number, code: string, message: string) =>
  Response.json({ error: { code, message } }, { status });

/** The audience check of every route a tool gets: a token for another tool is refused (D-015). */
const wrongAudience = (workspace: string, tool: string, audience: string | undefined) =>
  audience !== undefined && audience !== `${workspace}/${tool}`
    ? refuse(403, "FORBIDDEN", `This token was not issued for "${workspace}/${tool}".`)
    : undefined;

/** `/t/<tool>/secrets`: the page and the form where a person types their own secrets. */
export async function handleUserSecrets(
  request: Request,
  tool: string,
  context: UserSecretsContext,
): Promise<Response> {
  const who = await context.identify(request);
  if (!who) return refuse(401, "UNAUTHENTICATED", "Sign in to enter your secrets.");
  // The token of `forgeron login` (audience `<workspace>/platform`, D-031) may type the person's
  // secrets: this route is the platform's own. Any other token must be this tool's.
  const refused =
    who.audience === `${context.workspace}/platform`
      ? undefined
      : wrongAudience(context.workspace, tool, who.audience);
  if (refused) return refused;
  const record = await context.registry.findTool(context.workspace, tool);
  if (!record) return refuse(404, "NOT_FOUND", "Not found.");
  let manifest: Manifest;
  try {
    manifest = await context.registry.currentManifest(record.id);
  } catch {
    return refuse(404, "NOT_FOUND", "Not found.");
  }
  const store: UserSecretStore = {
    // Which names are set, never what they are: the page shows "set", the value stays sealed.
    read: async (user) =>
      Object.fromEntries(
        Object.keys(await context.registry.readUserSecrets(record.id, user.id)).map((n) => [
          n,
          "set",
        ]),
      ),
    // A secret made here is named as the tool names it and has the kind the tool declares (D-105).
    write: (user, name, value) => {
      const declared = manifest.resources.userSecrets?.[name];
      return context.registry.setUserSecret({
        toolId: record.id,
        person: user.id,
        name,
        value,
        ...(declared ? { label: declared.label } : {}),
        ...(declared?.kind ? { kind: declared.kind } : {}),
      });
    },
  };
  // The person's registry of secrets, for the page to offer and to bind (D-105).
  const saved: SavedSecrets = {
    list: async () =>
      (await context.registry.listPersonSecrets(context.workspace, who.person.id)).map((s) => ({
        id: s.id,
        label: s.label,
        ...(s.kind ? { kind: s.kind } : {}),
        usedBy: s.usedBy.map(({ tool: used, field }) => ({ tool: used, field })),
      })),
    value: (id) => context.registry.readPersonSecret(context.workspace, who.person.id, id),
    bind: (field, id) =>
      context.registry.bindUserSecret({
        toolId: record.id,
        person: who.person.id,
        field,
        secretId: id,
      }),
  };
  const setupStore: UserSetupStore = {
    read: (user) => context.registry.readUserSetup(record.id, user.id),
    write: (user, values) =>
      context.registry.writeUserSetup({ toolId: record.id, person: user.id, values }),
  };
  const url = new URL(request.url);
  // The tool's delegated connectors as steps of this page (D-111): connected, or where to connect.
  const steps: ConnectorStep[] = [];
  if (context.connectors) {
    const delegated = Object.entries(manifest.resources.connectors ?? {}).filter(
      ([, c]) => c.mode === "delegated",
    );
    const consents =
      delegated.length > 0
        ? await context.registry.listConnections(record.id, "production", {
            userId: who.person.id,
          })
        : [];
    for (const [name, c] of delegated) {
      steps.push({
        label: c.type,
        why: c.why,
        connected: consents.some((k) => k.connector === c.type),
        url: context.connectors.consentUrl(tool, "production", name),
      });
    }
  }
  // Where the OAuth step that sent the person here wants them back: only that step's own path (D-098).
  const asked = url.searchParams.get("next");
  const next = asked && SETUP_NEXT.test(asked) && asked.length <= 2000 ? asked : undefined;
  return handleSecretsInput(
    request,
    manifest,
    { id: who.person.id, email: who.person.email, name: who.person.name, roles: who.person.roles },
    store,
    `${url.origin}/t/${tool}`,
    ({ title, eyebrow, body, status }) =>
      page({ title, eyebrow, workspace: context.workspace, status }, body),
    {
      setupStore,
      saved,
      mySecrets: "/my/secrets",
      ...(steps.length > 0 ? { connectors: steps } : {}),
      ...(next ? { next } : {}),
      // Only a tool that declares a check is asked, and only where the gateway can ask.
      ...(manifest.setup?.check && context.checkSetup
        ? { check: (candidate) => context.checkSetup!(tool, who.person, candidate) }
        : {}),
    },
  );
}

type Asked = NonNullable<Manifest["resources"]["directory"]>;

/** The people and teams a tool declared it wants (D-131, D-132): nothing beyond the fields it named. */
export function directoryFor(
  asked: Asked,
  members: ReadonlyArray<{
    id: string;
    email: string;
    name: string;
    roles: string[];
    avatar?: { version: string };
  }>,
  teams: ReadonlyArray<{ id: string; name: string; description: string; members: string[] }> = [],
  /** Where the gateway serves pictures: the workspace's origin (D-133). */
  origin = "",
): { members: Array<Record<string, unknown>>; teams?: Array<Record<string, unknown>> } {
  const teamsOf = (id: string) => teams.filter((t) => t.members.includes(id)).map((t) => t.id);
  return {
    members: asked.members
      ? members.map((m) => ({
          id: m.id,
          email: m.email,
          name: m.name,
          ...(asked.avatars && m.avatar
            ? { avatar: `${origin}/avatars/${m.id}?v=${encodeURIComponent(m.avatar.version)}` }
            : {}),
          ...(asked.roles ? { roles: m.roles } : {}),
          ...(asked.teams ? { teams: teamsOf(m.id) } : {}),
        }))
      : [],
    ...(asked.teams
      ? {
          teams: teams.map((t) => ({
            id: t.id,
            name: t.name,
            ...(t.description ? { description: t.description } : {}),
            members: asked.members ? t.members : [],
          })),
        }
      : {}),
  };
}

/**
 * What the tool's runtime is given for a call: who the person is, where they enter secrets, and
 * their own per-person secrets (nobody else's). A token for another tool is refused here, before
 * the request reaches the Worker.
 */
export async function forwardIdentity(
  tool: string,
  request: Request,
  context: UserSecretsContext,
  environment: "preview" | "production" = "production",
  branch?: string,
): Promise<Forwarding | undefined> {
  const who = await context.identify(request);
  if (!who) return undefined;
  const refused = wrongAudience(context.workspace, tool, who.audience);
  if (refused) return { refuse: refused };
  const record = await context.registry.findTool(context.workspace, tool);
  // A tool with a rule is reached only by the people who added it to their library and may still use
  // it (D-117). A preview is for admins and developers already (`canPreview`).
  if (record && environment === "production") {
    const reach = await libraryAccess(context.registry, record.id, who.person);
    if (reach !== "ok") {
      return {
        refuse: refuse(
          403,
          reach === "unavailable" ? "NOT_AVAILABLE" : "NOT_IN_LIBRARY",
          reach === "unavailable"
            ? `"${tool}" is not available to you: ask an admin.`
            : `Add "${tool}" to your library first: ${libraryPath(tool)}`,
        ),
      };
    }
  }
  // What the person's workspace roles are mapped to in this tool, and the matrix resolved for each
  // action, read at each call so an edit applies at once on every interface (D-039, D-127). A runtime
  // built before D-127 reads only `access`, which says everything.
  // A team is a subject of that matrix, named `team-<id>` (D-132): the person holds the roles of the
  // workspace and those of their teams, so a team's profile and exceptions apply with no second path.
  const teams = record
    ? await context.registry.teamsOfMember(context.workspace, who.person.id)
    : [];
  const roles = [...who.person.roles, ...teams.map(teamRole)];
  const { access, permissions } = record
    ? await context.registry.accessFor(record.id, roles)
    : { access: {}, permissions: {} };
  const payload = {
    id: who.person.id,
    email: who.person.email,
    name: who.person.name,
    roles,
    access,
    permissions,
  };
  const headers: Record<string, string> = {
    "x-forgeron-user": JSON.stringify(payload),
    "x-forgeron-base-url": `${new URL(request.url).origin}/t/${tool}`,
  };
  if (record) {
    let own: Record<string, string> = {};
    try {
      // The secret of the most specific scope that fits where this call is served (D-109).
      own = await context.registry.readUserSecrets(record.id, who.person.id, {
        environment,
        ...(branch !== undefined ? { branch } : {}),
      });
    } catch {
      // No platform key bound: the tool then sees none, and asks for them (428).
    }
    if (Object.keys(own).length > 0) headers["x-forgeron-user-secrets"] = JSON.stringify(own);
    // The person's plain values, always sent when the gateway knows the tool: an empty object tells the
    // tool that the gateway is the one keeping them, so a required field left out is asked for (D-097).
    headers["x-forgeron-user-setup"] = JSON.stringify(
      await context.registry.readUserSetup(record.id, who.person.id),
    );
    let manifest: Manifest | undefined;
    try {
      manifest = await context.registry.currentManifest(record.id);
    } catch {
      // No published version: no connector, no directory.
    }
    // What the tool asked to know of the workspace's people (D-131), filtered here to that and no more:
    // the runtime filters again. Only the members of this workspace, never a person's secrets.
    const asked = manifest?.resources?.directory;
    // The person's own teams only reach a tool that asked for teams.
    // And their own picture, only to a tool that asked for pictures (D-131, D-133).
    const mine = asked?.avatars
      ? await context.registry.findMember(context.workspace, who.person.id)
      : undefined;
    const picture = mine?.avatar
      ? `${new URL(request.url).origin}/avatars/${who.person.id}?v=${encodeURIComponent(mine.avatar.version)}`
      : undefined;
    if (asked?.teams || picture) {
      headers["x-forgeron-user"] = JSON.stringify({
        ...payload,
        ...(asked?.teams ? { teams } : {}),
        ...(picture ? { avatar: picture } : {}),
      });
    }
    if (asked) {
      const everyone = await context.registry.listMembers(context.workspace);
      const all = asked.teams ? await context.registry.listTeams(context.workspace) : [];
      headers["x-forgeron-directory"] = JSON.stringify(
        directoryFor(asked, everyone, all, new URL(request.url).origin),
      );
    }
    if (context.connectors && manifest) {
      const connectors = await connectorHeaders(record, manifest, who.person, environment, {
        registry: context.registry,
        workspace: context.workspace,
        ...context.connectors,
      });
      if ("refuse" in connectors) return connectors;
      Object.assign(headers, connectors.headers);
    }
  }
  return { headers };
}
