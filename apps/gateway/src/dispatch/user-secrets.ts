import type { Manifest } from "@forgeron/manifest";
import type { Registry } from "@forgeron/registry";
import { handleSecretsInput, type UserSecretStore } from "@forgeron/runtime";
import type { Person } from "../identity/authenticate";
import type { Forwarding } from "./dispatch";

// Per-person secrets at the gateway (D-036). The tool's own code never receives the form or the
// stored value of anyone: the gateway keeps them sealed in the platform D1, serves
// `/t/<tool>/secrets`, and hands a call only the caller's own values, in a header the tool's
// runtime reads and a caller cannot set (the dispatcher drops it).

export interface UserSecretsContext {
  registry: Registry;
  workspace: string;
  /** The person and the audience of their token, if any (a session has none). */
  identify(request: Request): Promise<{ person: Person; audience?: string } | undefined>;
}

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
    write: (user, name, value) =>
      context.registry.setUserSecret({ toolId: record.id, person: user.id, name, value }),
  };
  const url = new URL(request.url);
  return handleSecretsInput(
    request,
    manifest,
    { id: who.person.id, email: who.person.email, name: who.person.name, roles: who.person.roles },
    store,
    `${url.origin}/t/${tool}`,
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
): Promise<Forwarding | undefined> {
  const who = await context.identify(request);
  if (!who) return undefined;
  const refused = wrongAudience(context.workspace, tool, who.audience);
  if (refused) return { refuse: refused };
  const headers: Record<string, string> = {
    "x-forgeron-user": JSON.stringify({
      id: who.person.id,
      email: who.person.email,
      name: who.person.name,
      roles: who.person.roles,
    }),
    "x-forgeron-base-url": `${new URL(request.url).origin}/t/${tool}`,
  };
  const record = await context.registry.findTool(context.workspace, tool);
  if (record) {
    let own: Record<string, string> = {};
    try {
      own = await context.registry.readUserSecrets(record.id, who.person.id);
    } catch {
      // No platform key bound: the tool then sees none, and asks for them (428).
    }
    if (Object.keys(own).length > 0) headers["x-forgeron-user-secrets"] = JSON.stringify(own);
  }
  return { headers };
}
