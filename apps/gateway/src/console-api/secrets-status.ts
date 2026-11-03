import type { Registry } from "@forgeron/registry";

// `GET /api/tools/<tool>/secrets-status`: the secrets the tool declares and whether each environment
// has them, `{ "secrets": [{ "name", "environments": { "preview": "set" | "missing", ... } }] }`.
// It is the answer of the admin MCP's `secrets_status` too (docs/sdk.md section 17): developers and
// admins may ask; no value is read, so none can leave.

const ROUTE = /^\/api\/tools\/([a-z0-9-]+)\/secrets-status$/;

export interface SecretsStatusApiOptions {
  registry: Registry;
  workspace: string;
  caller(request: Request): Promise<{ developer: boolean; admin: boolean } | undefined>;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export async function handleSecretsStatus(
  request: Request,
  options: SecretsStatusApiOptions,
): Promise<Response | undefined> {
  const match = ROUTE.exec(new URL(request.url).pathname);
  if (!match) return undefined;
  if (request.method !== "GET") return json(405, { error: "METHOD_NOT_ALLOWED" });

  const caller = await options.caller(request);
  if (!caller) return json(401, { error: "UNAUTHENTICATED" });
  if (!caller.developer && !caller.admin) {
    return json(403, {
      error: "FORBIDDEN",
      message: "Secrets status is for developers and admins.",
    });
  }
  const tool = await options.registry.findTool(options.workspace, match[1]!);
  if (!tool) return json(404, { error: "NOT_FOUND", message: `There is no tool ${match[1]}.` });
  return json(200, { secrets: await options.registry.secretsStatus(tool.id) });
}
