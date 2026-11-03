import { RegistryError, type Registry } from "@forgeron/registry";

// The pilot groups of the workspace (D-034), for the console:
//   GET /api/groups                 -> { "groups": [{ "name", "members": [{ "id", "email", "name" }] }] }
//   PUT /api/groups/<name>          body { "members": ["ada@acme.test", ...] } replaces the members
//   GET /api/members                -> { "members": [{ "id", "email", "name", "roles" }] }
// A group is a name; the pilot environment of a tool says which group gets its version at the
// production address (`forgeron deploy --env pilot --group <name>`). A member is named by email.
// Only an admin may call them.

const ROUTE = /^\/api\/(?:groups(?:\/([a-z0-9][a-z0-9-]{0,39}))?|(members))$/;
const MAX_MEMBERS = 500;

export interface GroupsApiOptions {
  registry: Registry;
  /** The workspace the request was dispatched to. */
  workspace: string;
  /** The caller, resolved by identity: `undefined` is anonymous. */
  caller(request: Request): Promise<{ admin: boolean } | undefined>;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const shown = (m: { id: string; email: string; name: string }) => ({
  id: m.id,
  email: m.email,
  name: m.name,
});

/** Answers a groups route, or `undefined` when the request is for another route. */
export async function handleGroups(
  request: Request,
  options: GroupsApiOptions,
): Promise<Response | undefined> {
  const match = ROUTE.exec(new URL(request.url).pathname);
  if (!match) return undefined;
  const [, name, members] = match;
  const { registry, workspace } = options;

  const caller = await options.caller(request);
  if (!caller) return json(401, { error: "UNAUTHENTICATED" });
  if (!caller.admin) return json(403, { error: "FORBIDDEN", message: "Groups are for admins." });

  if (members) {
    if (request.method !== "GET") return json(405, { error: "METHOD_NOT_ALLOWED" });
    const all = await registry.listMembers(workspace);
    return json(200, { members: all.map((m) => ({ ...shown(m), roles: m.roles })) });
  }
  if (request.method === "GET" && !name) {
    const groups = await registry.listGroups(workspace);
    return json(200, {
      groups: groups.map((g) => ({ name: g.name, members: g.members.map(shown) })),
    });
  }
  if (request.method === "PUT" && name) {
    let emails: unknown;
    try {
      emails = ((await request.json()) as { members?: unknown }).members;
    } catch {
      return json(400, { error: "INVALID", message: "The body is not JSON." });
    }
    if (
      !Array.isArray(emails) ||
      emails.length > MAX_MEMBERS ||
      emails.some((e) => typeof e !== "string")
    ) {
      return json(400, {
        error: "INVALID",
        message: `\`members\` is a list of emails (${MAX_MEMBERS} max).`,
      });
    }
    const known = new Map(
      (await registry.listMembers(workspace)).map((m) => [m.email.toLowerCase(), m]),
    );
    const wanted = (emails as string[]).map((e) => e.trim().toLowerCase());
    const unknown = wanted.filter((e) => !known.has(e));
    if (unknown.length > 0) {
      return json(400, {
        error: "UNKNOWN_MEMBER",
        message: `Not members of this workspace: ${unknown.join(", ")}.`,
      });
    }
    try {
      const set = await registry.setGroupMembers(
        workspace,
        name,
        wanted.map((e) => known.get(e)!.id),
      );
      return json(200, { name, members: set.map(shown) });
    } catch (error) {
      if (error instanceof RegistryError) {
        return json(400, { error: error.code, message: error.message });
      }
      throw error;
    }
  }
  return json(405, { error: "METHOD_NOT_ALLOWED" });
}
