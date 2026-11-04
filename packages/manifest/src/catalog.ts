import { z } from "zod";
import { DOC_IMAGE_TYPES, InterfaceSchema, ToolNameSchema } from "./schema";

// The catalog API of the console (docs/console-ux.md, "Catalog API", D-058). Any signed-in member of
// the workspace may read it: the catalog is how a person finds a tool they may not use yet.
//   GET /console-api/api/catalog                      -> CatalogResponse
//   GET /console-api/api/catalog/<tool>               -> ToolCard
//   GET /console-api/api/catalog/<tool>/assets/<path> -> the image, from the stored bundle

const text = z.string();

/** Whether the person's roles let them call at least one action: `requestable` means ask an admin. */
export const CatalogAccessSchema = z.enum(["granted", "requestable"]);

/** An asset of the card: `url` is ready to use in an `<img>` and carries the hash (immutable). */
export const CatalogAssetSchema = z.strictObject({
  path: text,
  type: z.enum(Object.values(DOC_IMAGE_TYPES) as [string, ...string[]]),
  size: z.number().int().nonnegative(),
  url: text,
});

export const CatalogToolSchema = z.strictObject({
  name: ToolNameSchema,
  /** The config's `title`, else the name. */
  title: text,
  /** One line: the config's `description`, or empty. */
  summary: text,
  /** The URL of the tool's icon, or `null` (show the first letter of the title). */
  icon: text.nullable(),
  /** The version production serves; `null` when the tool has no production version yet. */
  productionVersion: text.nullable(),
  interfaces: z.record(InterfaceSchema, z.boolean()),
  access: CatalogAccessSchema,
  /** The roles of the tool that may call at least one action, with their labels: what to ask for. */
  roles: z.array(z.strictObject({ name: text, label: text })),
});

export const CatalogResponseSchema = z.strictObject({ tools: z.array(CatalogToolSchema) });

export const ToolCardSchema = CatalogToolSchema.extend({
  /** Markdown source, as the developer wrote it. Never HTML: the client renders it without raw HTML. */
  readme: text.nullable(),
  assets: z.array(CatalogAssetSchema),
  /** What to give a person to connect, per interface; `null` for an interface the tool does not expose. */
  connect: z.strictObject({
    mcp: z.strictObject({ url: text }).nullable(),
    api: z.strictObject({ baseUrl: text }).nullable(),
    cli: z.strictObject({ command: text }).nullable(),
  }),
  /** The secrets an admin sets (the person never sees them). */
  requiredSecrets: z.array(z.strictObject({ name: text, why: text.nullable() })),
  /** The secrets the person is asked for themselves. */
  requiredUserSecrets: z.array(z.strictObject({ name: text, label: text, why: text })),
  connectors: z.array(
    z.strictObject({ name: text, type: text, mode: z.enum(["delegated", "application"]) }),
  ),
  /** Each action and whether this person may call it. */
  yourAccess: z.array(z.strictObject({ action: text, allowed: z.boolean() })),
  /** The latest version published, or `null` for a tool with none. */
  lastRelease: z
    .strictObject({
      version: text,
      date: text,
      changelog: z.array(z.unknown()),
    })
    .nullable(),
});

export type CatalogAccess = z.infer<typeof CatalogAccessSchema>;
export type CatalogAsset = z.infer<typeof CatalogAssetSchema>;
export type CatalogTool = z.infer<typeof CatalogToolSchema>;
export type CatalogResponse = z.infer<typeof CatalogResponseSchema>;
export type ToolCard = z.infer<typeof ToolCardSchema>;
