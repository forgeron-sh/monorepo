import { RegistryError, type Registry } from "@forgeron/registry";

// `GET /api/tools/<tool>/manifest`: the manifest of the version production serves, else the latest
// one published, `{ "manifest": { ... } }`. The console draws the architecture diagram from it.
// For developers and admins: the manifest names every action, secret and outbound host.

const ROUTE = /^\/api\/tools\/([a-z0-9-]+)\/manifest$/;

export interface ManifestApiOptions {
  registry: Registry;
  workspace: string;
  caller(request: Request): Promise<{ developer: boolean; admin: boolean } | undefined>;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

/** Answers the manifest route, or `undefined` when the request is for another route. */
export async function handleManifest(
  request: Request,
  options: ManifestApiOptions,
): Promise<Response | undefined> {
  const match = ROUTE.exec(new URL(request.url).pathname);
  if (!match) return undefined;
  if (request.method !== "GET") return json(405, { error: "METHOD_NOT_ALLOWED" });

  const caller = await options.caller(request);
  if (!caller) return json(401, { error: "UNAUTHENTICATED" });
  if (!caller.developer && !caller.admin) {
    return json(403, { error: "FORBIDDEN", message: "The manifest is for developers and admins." });
  }
  const tool = await options.registry.findTool(options.workspace, match[1]!);
  if (!tool) return json(404, { error: "NOT_FOUND", message: `There is no tool ${match[1]}.` });
  try {
    return json(200, { manifest: await options.registry.currentManifest(tool.id) });
  } catch (error) {
    if (error instanceof RegistryError && error.code === "NO_MANIFEST") {
      return json(404, { error: "NO_MANIFEST", message: error.message });
    }
    throw error;
  }
}
