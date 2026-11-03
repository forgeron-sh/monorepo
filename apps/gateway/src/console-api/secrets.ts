import type { Registry } from "@forgeron/registry";
import { RegistryError } from "@forgeron/registry";

// The secrets routes of the platform API (docs/sdk.md section 5, "Secrets and access"):
//   PUT /api/tools/<tool>/environments/<env>/secrets/<NAME>   body { "value": "..." }
//   GET /api/tools/<tool>/environments/<env>/secrets          -> { "secrets": ["NAME", ...] }
// Only an admin may call them. A value goes in and never comes out: the answers carry names.

const ROUTE =
  /^\/api\/tools\/([a-z0-9-]+)\/environments\/(preview|production)\/secrets(?:\/([A-Z][A-Z0-9_]*))?$/;
const MAX_VALUE = 16 * 1024;

export interface SecretsApiOptions {
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

/** Answers a secrets route, or `undefined` when the request is for another route. */
export async function handleSecrets(
  request: Request,
  options: SecretsApiOptions,
): Promise<Response | undefined> {
  const match = ROUTE.exec(new URL(request.url).pathname);
  if (!match) return undefined;
  const [, toolName, environment, name] = match as unknown as [
    string,
    string,
    "preview" | "production",
    string | undefined,
  ];

  const caller = await options.caller(request);
  if (!caller) return json(401, { error: "UNAUTHENTICATED" });
  if (!caller.admin) return json(403, { error: "FORBIDDEN", message: "Secrets are for admins." });

  const tool = await options.registry.findTool(options.workspace, toolName);
  if (!tool) return json(404, { error: "NOT_FOUND", message: `There is no tool ${toolName}.` });

  if (request.method === "GET" && !name) {
    return json(200, { secrets: await options.registry.secretNames(tool.id, environment) });
  }
  if (request.method === "PUT" && name) {
    let value: unknown;
    try {
      value = ((await request.json()) as { value?: unknown }).value;
    } catch {
      return json(400, { error: "INVALID", message: "The body is not JSON." });
    }
    if (typeof value !== "string" || value === "" || value.length > MAX_VALUE) {
      return json(400, { error: "INVALID", message: "`value` is a non-empty string (16 KB max)." });
    }
    try {
      await options.registry.setSecret(tool.id, environment, name, value);
    } catch (error) {
      if (error instanceof RegistryError) return json(500, { error: error.code });
      throw error;
    }
    return new Response(null, { status: 204 });
  }
  return json(405, { error: "METHOD_NOT_ALLOWED" });
}
