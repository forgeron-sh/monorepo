import type { Registry } from "@forgeron/registry";
import { LONGEST_TOKEN_SECONDS } from "../identity/issue";

// The admin's revocations (D-033, D-034), on the console API:
//   POST   /api/people/<id>/tokens/revoke                 every token of a person, at once
//   GET    /api/tools/<tool>/user-secrets                 who holds which per-person secrets: names only
//   DELETE /api/tools/<tool>/user-secrets/<id>[/<NAME>]   one secret of a person, or all of theirs
// Only an admin may call them. A value never comes out.

const PEOPLE = /^\/api\/people\/([^/]+)\/tokens\/revoke$/;
const USER_SECRETS =
  /^\/api\/tools\/([a-z0-9-]+)\/user-secrets(?:\/([^/]+)(?:\/([A-Z][A-Z0-9_]*))?)?$/;

export interface RevocationsOptions {
  registry: Registry;
  workspace: string;
  caller(request: Request): Promise<{ admin: boolean } | undefined>;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

/** Answers a revocation route, or `undefined` when the request is for another route. */
export async function handleRevocations(
  request: Request,
  options: RevocationsOptions,
): Promise<Response | undefined> {
  const path = new URL(request.url).pathname;
  const people = PEOPLE.exec(path);
  const secrets = USER_SECRETS.exec(path);
  if (!people && !secrets) return undefined;

  const caller = await options.caller(request);
  if (!caller) return json(401, { error: "UNAUTHENTICATED" });
  if (!caller.admin) return json(403, { error: "FORBIDDEN", message: "Revocation is for admins." });
  const { registry, workspace } = options;

  if (people) {
    if (request.method !== "POST") return json(405, { error: "METHOD_NOT_ALLOWED" });
    const person = decodeURIComponent(people[1]!);
    if (!(await registry.findMember(workspace, person))) {
      return json(404, { error: "NOT_FOUND", message: "There is no such person." });
    }
    await registry.revokePersonTokens(workspace, person, LONGEST_TOKEN_SECONDS);
    return json(200, { revoked: "all", person });
  }

  const [, toolName, person, name] = secrets!;
  const tool = await registry.findTool(workspace, toolName!);
  if (!tool) return json(404, { error: "NOT_FOUND", message: `There is no tool ${toolName}.` });
  if (request.method === "GET" && person === undefined) {
    return json(200, { holders: await registry.userSecretHolders(tool.id) });
  }
  if (request.method === "DELETE" && person !== undefined) {
    const revoked = await registry.revokeUserSecrets(tool.id, decodeURIComponent(person), name);
    return json(200, { revoked });
  }
  return json(405, { error: "METHOD_NOT_ALLOWED" });
}
