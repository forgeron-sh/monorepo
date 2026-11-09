import type { Manifest } from "@forgeron/manifest";
import type { Registry } from "@forgeron/registry";
import {
  handleSecretsInput,
  type SavedSecrets,
  type SetupCheckResult,
  type UserSecretStore,
  type UserSetupStore,
} from "@forgeron/runtime";
import type { Person } from "../kernel/person";
import { page } from "../pages/shell";
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
    | "currentManifest"
    | "bindUserSecret"
    | "findTool"
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

/** The only place a setup page sends a person on: the OAuth authorization step of this workspace. */
const SETUP_NEXT = /^\/oauth\/authorize\?[A-Za-z0-9%._~!$&'()*+,;=:@/?-]*$/;

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
      ...(next ? { next } : {}),
      // Only a tool that declares a check is asked, and only where the gateway can ask.
      ...(manifest.setup?.check && context.checkSetup
        ? { check: (candidate) => context.checkSetup!(tool, who.person, candidate) }
        : {}),
    },
  );
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
): Promise<Forwarding | undefined> {
  const who = await context.identify(request);
  if (!who) return undefined;
  const refused = wrongAudience(context.workspace, tool, who.audience);
  if (refused) return { refuse: refused };
  const record = await context.registry.findTool(context.workspace, tool);
  // The console's overrides of the roles × actions matrix for the person's roles, read at each call
  // so an edit applies at once on every interface (D-039).
  const access = record ? await context.registry.accessFor(record.id, who.person.roles) : {};
  const headers: Record<string, string> = {
    "x-forgeron-user": JSON.stringify({
      id: who.person.id,
      email: who.person.email,
      name: who.person.name,
      roles: who.person.roles,
      access,
    }),
    "x-forgeron-base-url": `${new URL(request.url).origin}/t/${tool}`,
  };
  if (record) {
    let own: Record<string, string> = {};
    try {
      own = await context.registry.readUserSecrets(record.id, who.person.id);
    } catch {
      // No platform key bound: the tool then sees none, and asks for them (428).
    }
    if (Object.keys(own).length > 0) headers["x-forgeron-user-secrets"] = JSON.stringify(own);
    // The person's plain values, always sent when the gateway knows the tool: an empty object tells the
    // tool that the gateway is the one keeping them, so a required field left out is asked for (D-097).
    headers["x-forgeron-user-setup"] = JSON.stringify(
      await context.registry.readUserSetup(record.id, who.person.id),
    );
    if (context.connectors) {
      let manifest: Manifest | undefined;
      try {
        manifest = await context.registry.currentManifest(record.id);
      } catch {
        // No published version: no connector either.
      }
      if (manifest) {
        const connectors = await connectorHeaders(record, manifest, who.person, environment, {
          registry: context.registry,
          workspace: context.workspace,
          ...context.connectors,
        });
        if ("refuse" in connectors) return connectors;
        Object.assign(headers, connectors.headers);
      }
    }
  }
  return { headers };
}
