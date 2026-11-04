import { catalogAssetRoute, listCatalogRoute, toolCardRoute } from "@forgeron/platform-contract";
import { isSafeDocPath } from "@forgeron/manifest";
import { findAsset, findCard, listCatalog, RegistryError } from "@forgeron/registry";
import type { OpenAPIHono } from "@hono/zod-openapi";
import { memberOnly, methodNotAllowed, platformRoute, type PlatformEnv } from "./app";

// The catalog API (docs/console-ux.md, "Catalog API", D-061) served from the contract. A README
// leaves as a JSON string of markdown and is never turned into HTML here. An image leaves with a
// type from an allow list, `nosniff` and a CSP that lets an SVG do nothing (no script, no request).

/** Image types the gateway serves; the registry only stores these, this is the second lock. */
const IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);
const TOOL = "[a-z0-9-]+";

const missing = (message: string) => ({ error: "NOT_FOUND", message });
const failed = (error: RegistryError) => ({ error: error.code, message: error.message });

/** The decoded path of an image, or `undefined` if it is not a plain path inside the bundle. */
function assetPath(raw: string): string | undefined {
  try {
    const path = decodeURIComponent(raw);
    return isSafeDocPath(path) ? path : undefined;
  } catch {
    return undefined;
  }
}

export function mountCatalog(app: OpenAPIHono<PlatformEnv>): void {
  app.openapi(platformRoute(listCatalogRoute, "member"), async (c) => {
    try {
      const { registry, workspace } = c.env;
      return c.json({ tools: await listCatalog(registry, workspace, c.get("person")) }, 200);
    } catch (error) {
      if (error instanceof RegistryError) return c.json(failed(error), 500);
      throw error;
    }
  });

  app.openapi(platformRoute(toolCardRoute, "member"), async (c) => {
    try {
      const { registry, workspace, origin } = c.env;
      const { tool } = c.req.valid("param");
      const card = await findCard(registry, workspace, tool, c.get("person"), origin);
      return card ? c.json(card, 200) : c.json(missing(`There is no tool ${tool}.`), 404);
    } catch (error) {
      if (error instanceof RegistryError) return c.json(failed(error), 500);
      throw error;
    }
  });

  // The image route is a plain Hono route: `{path}` of OpenAPI is one segment for `app.openapi`, and
  // an image path has slashes (`docs/shot.png`). The contract object still describes it in the document.
  app.openAPIRegistry.registerPath(catalogAssetRoute);
  app.get(`/api/catalog/:tool{${TOOL}}/assets/:path{.+}`, memberOnly, async (c) => {
    try {
      const { registry, workspace } = c.env;
      const path = assetPath(c.req.param("path"));
      if (!path) return c.json(missing("There is no such image."), 404);
      const asset = await findAsset(registry, workspace, c.req.param("tool"), path);
      if (!asset || !IMAGE_TYPES.has(asset.type)) {
        return c.json(missing("There is no such image."), 404);
      }
      // The address carries the hash of the file: an answer for that hash never changes. Another
      // hash (an older address, a hand-written one) gets the current file, and no cache.
      const current = c.req.query("v") === asset.hash;
      return c.body(asset.bytes as unknown as ArrayBuffer, 200, {
        "content-type": asset.type,
        "x-content-type-options": "nosniff",
        "content-security-policy":
          asset.type === "image/svg+xml"
            ? "default-src 'none'; style-src 'unsafe-inline'; sandbox"
            : "default-src 'none'; sandbox",
        "cross-origin-resource-policy": "same-origin",
        "cache-control": current ? "private, max-age=31536000, immutable" : "private, no-store",
        etag: `"${asset.hash}"`,
      });
    } catch (error) {
      if (error instanceof RegistryError) return c.json(failed(error), 500);
      throw error;
    }
  });

  // GET (and HEAD, which Hono derives from it) only: any other method is 405, as before.
  app.all(`/api/catalog`, methodNotAllowed);
  app.all(`/api/catalog/:tool{${TOOL}}`, methodNotAllowed);
  app.all(`/api/catalog/:tool{${TOOL}}/assets/:path{.+}`, methodNotAllowed);
}
