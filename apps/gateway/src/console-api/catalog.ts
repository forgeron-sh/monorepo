import { isSafeDocPath } from "@forgeron/manifest";
import { findAsset, findCard, listCatalog, RegistryError, type Registry } from "@forgeron/registry";

// The catalog of the workspace (docs/console-ux.md, "Catalog API", D-056), for any signed-in member:
//   GET /api/catalog                       -> { tools: CatalogTool[] }
//   GET /api/catalog/<tool>                -> ToolCard
//   GET /api/catalog/<tool>/assets/<path>  -> an image of the stored bundle
// A README leaves as a JSON string of markdown and is never turned into HTML here. An image leaves with
// a type from an allow list, `nosniff` and a CSP that lets an SVG do nothing (no script, no request).

const LIST = "/api/catalog";
const ROUTE = /^\/api\/catalog\/([a-z0-9-]+)(?:\/assets\/(.+))?$/;
/** Image types the gateway serves; the registry only stores these, this is the second lock. */
const IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

export interface CatalogApiOptions {
  registry: Registry;
  /** The workspace the request was dispatched to. */
  workspace: string;
  /** The workspace's address, `https://acme.forgeron.app`: what the card tells a person to connect to. */
  origin: string;
  /** The caller, resolved by identity: `undefined` is anonymous. Any member of the workspace may read. */
  caller(request: Request): Promise<{ roles: readonly string[] } | undefined>;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const notFound = (message: string) => json(404, { error: "NOT_FOUND", message });

/** The decoded path of an image, or `undefined` if it is not a plain path inside the bundle. */
function assetPath(raw: string): string | undefined {
  try {
    const path = decodeURIComponent(raw);
    return isSafeDocPath(path) ? path : undefined;
  } catch {
    return undefined;
  }
}

/** Answers a catalog route, or `undefined` when the request is for another route. */
export async function handleCatalog(
  request: Request,
  options: CatalogApiOptions,
): Promise<Response | undefined> {
  const url = new URL(request.url);
  const match = ROUTE.exec(url.pathname);
  if (url.pathname !== LIST && !match) return undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    return json(405, { error: "METHOD_NOT_ALLOWED" });
  }
  const caller = await options.caller(request);
  if (!caller) return json(401, { error: "UNAUTHENTICATED" });

  const { registry, workspace } = options;
  try {
    if (!match) {
      return json(200, { tools: await listCatalog(registry, workspace, caller) });
    }
    const [, tool, rawPath] = match;
    if (rawPath === undefined) {
      const card = await findCard(registry, workspace, tool!, caller, options.origin);
      return card ? json(200, card) : notFound(`There is no tool ${tool}.`);
    }

    const path = assetPath(rawPath);
    if (!path) return notFound("There is no such image.");
    const asset = await findAsset(registry, workspace, tool!, path);
    if (!asset || !IMAGE_TYPES.has(asset.type)) return notFound("There is no such image.");
    // The address carries the hash of the file: an answer for that hash never changes. Another hash
    // (an older address, a hand-written one) gets the current file, and no cache.
    const current = url.searchParams.get("v") === asset.hash;
    return new Response(request.method === "HEAD" ? null : asset.bytes, {
      headers: {
        "content-type": asset.type,
        "x-content-type-options": "nosniff",
        "content-security-policy":
          asset.type === "image/svg+xml"
            ? "default-src 'none'; style-src 'unsafe-inline'; sandbox"
            : "default-src 'none'; sandbox",
        "cross-origin-resource-policy": "same-origin",
        "cache-control": current ? "private, max-age=31536000, immutable" : "private, no-store",
        etag: `"${asset.hash}"`,
      },
    });
  } catch (error) {
    if (error instanceof RegistryError)
      return json(500, { error: error.code, message: error.message });
    throw error;
  }
}
