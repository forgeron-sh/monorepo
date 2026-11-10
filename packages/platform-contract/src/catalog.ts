import { CatalogResponseSchema, ToolCardSchema } from "@forgeron/manifest";
import { z } from "zod";
import { ErrorSchema } from "./error";
import { defineRoute } from "./route";

// The catalog API (docs/console-ux.md, "Catalog API", D-061): any signed-in member reads it. The
// schemas are the manifest's; this file only says which route answers with which.

const json = <T extends z.ZodType>(schema: T, description: string) => ({
  description,
  content: { "application/json": { schema } },
});
const notSignedIn = json(ErrorSchema, "Not signed in");
const notFound = json(ErrorSchema, "No such tool or image");
const registryError = json(ErrorSchema, "The registry refused: `error` is its code");
const tool = z.string().describe("The tool's name");
/** A branch with a preview (D-120): the card and images of the version it serves. */
const branch = z.string().min(1).optional().describe("A branch with a preview");

export const listCatalogRoute = defineRoute({
  method: "get",
  path: "/api/catalog",
  summary: "The tools of the workspace, with what the signed-in person may do with each",
  tags: ["catalog"],
  responses: {
    200: json(CatalogResponseSchema, "The catalog"),
    401: notSignedIn,
    500: registryError,
  },
});

export const toolCardRoute = defineRoute({
  method: "get",
  path: "/api/catalog/{tool}",
  summary: "A tool's card: README, assets, how to connect, what the person may call",
  tags: ["catalog"],
  request: { params: z.object({ tool }), query: z.object({ branch }) },
  responses: {
    200: json(ToolCardSchema, "The card"),
    401: notSignedIn,
    403: json(ErrorSchema, "A branch's card is for admins and developers"),
    404: notFound,
    500: registryError,
  },
});

/** An image of the tool's stored bundle. The path may hold slashes (`docs/shot.png`). */
export const catalogAssetRoute = defineRoute({
  method: "get",
  path: "/api/catalog/{tool}/assets/{path}",
  summary: "An image of a tool's documentation, as stored with the version",
  tags: ["catalog"],
  request: {
    params: z.object({ tool, path: z.string().describe("A plain path inside the bundle") }),
    query: z.object({
      v: z.string().optional().describe("The file's hash: that answer is immutable"),
      branch,
    }),
  },
  responses: {
    200: {
      description: "The image",
      content: {
        "image/png": { schema: z.string() },
        "image/jpeg": { schema: z.string() },
        "image/webp": { schema: z.string() },
        "image/gif": { schema: z.string() },
        "image/svg+xml": { schema: z.string() },
      },
    },
    401: notSignedIn,
    403: json(ErrorSchema, "A branch's images are for admins and developers"),
    404: notFound,
    500: registryError,
  },
});
