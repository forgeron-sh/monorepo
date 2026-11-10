import { z } from "zod";
import { ErrorSchema } from "./error";
import { defineRoute } from "./route";

// The marketplaces of a workspace (D-116), for admins: the official catalogue, whose id is `official`,
// and the GitHub repositories an admin added. An admin lists what one offers, reads a tool's technical
// card and installs it, directly (the console) or through a plan (the admin MCP, D-092).

const json = <T extends z.ZodType>(schema: T, description: string) => ({
  description,
  content: { "application/json": { schema } },
});
const notSignedIn = json(ErrorSchema, "Not signed in");
const notAdmin = json(ErrorSchema, "Not an admin");
const noMarketplace = json(ErrorSchema, "No such marketplace");

export const MarketplaceSchema = z.strictObject({
  /** `official` for the platform's catalogue. */
  id: z.string(),
  /** `owner/name` on GitHub; `null` for an official catalogue the platform fills another way. */
  repo: z.string().nullable(),
  title: z.string().nullable(),
  official: z.boolean(),
  /** Whether a read token is kept. The token itself is never given back. */
  hasToken: z.boolean(),
  syncedAt: z.string().nullable(),
  syncError: z.string().nullable(),
});

const params = z.object({ id: z.string() });
const toolParams = z.object({ id: z.string(), tool: z.string() });

export const listMarketplacesRoute = defineRoute({
  method: "get",
  path: "/api/marketplaces",
  summary: "The official catalogue and the marketplaces the workspace added",
  tags: ["marketplaces"],
  responses: {
    200: json(z.strictObject({ marketplaces: z.array(MarketplaceSchema) }), "The marketplaces"),
    401: notSignedIn,
    403: notAdmin,
  },
});

export const addMarketplaceRoute = defineRoute({
  method: "post",
  path: "/api/marketplaces",
  summary: "Add a GitHub repository as a marketplace, with a read token when it is private",
  tags: ["marketplaces"],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.object({
            /** `owner/name`. */
            repo: z.string().min(3).max(140),
            /** A read-only token (GitHub: fine-grained, "Contents: read"); sealed, never given back. */
            token: z.string().min(1).max(500).optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: json(MarketplaceSchema, "The marketplace, not synced yet"),
    400: json(ErrorSchema, "`repo` is not owner/name"),
    401: notSignedIn,
    403: notAdmin,
    409: json(ErrorSchema, "The repository is already a marketplace of the workspace"),
  },
});

export const removeMarketplaceRoute = defineRoute({
  method: "delete",
  path: "/api/marketplaces/{id}",
  summary: "Remove a marketplace and its token; the tools installed from it stay",
  tags: ["marketplaces"],
  request: { params },
  responses: {
    204: { description: "Removed" },
    401: notSignedIn,
    403: notAdmin,
    404: noMarketplace,
  },
});

export const SyncedToolSchema = z.strictObject({
  name: z.string(),
  version: z.string(),
  status: z.enum(["added", "current", "unpublished", "refused"]),
  reason: z.string().optional(),
});

export const syncMarketplaceRoute = defineRoute({
  method: "post",
  path: "/api/marketplaces/{id}/sync",
  summary: "Read the marketplace's index and record the versions it publishes",
  tags: ["marketplaces"],
  request: { params },
  responses: {
    200: json(
      z.strictObject({ title: z.string().nullable(), tools: z.array(SyncedToolSchema) }),
      "What the sync did, tool by tool",
    ),
    401: notSignedIn,
    403: notAdmin,
    404: noMarketplace,
    502: json(ErrorSchema, "GitHub refused, or the index is not valid"),
  },
});

export const MarketplaceToolSchema = z.strictObject({
  name: z.string(),
  title: z.string(),
  summary: z.string(),
  version: z.string(),
  /** What an admin will have to approve (`resources.db`, `resources.network`…). */
  resources: z.array(z.string()),
  /** Whether the workspace already has a tool of that name. */
  installed: z.boolean(),
});

export const listMarketplaceToolsRoute = defineRoute({
  method: "get",
  path: "/api/marketplaces/{id}/tools",
  summary: "What a marketplace offers, at its latest version",
  tags: ["marketplaces"],
  request: { params },
  responses: {
    200: json(z.strictObject({ tools: z.array(MarketplaceToolSchema) }), "The tools"),
    401: notSignedIn,
    403: notAdmin,
    404: noMarketplace,
  },
});

/** The technical card of a tool, for the admin who decides to install it. */
export const MarketplaceToolCardSchema = MarketplaceToolSchema.extend({
  description: z.string().nullable(),
  publishedAt: z.string(),
  /** Technical, for administrators. */
  readme: z.string().nullable(),
  /** For the people who will use it. */
  guide: z.string().nullable(),
  interfaces: z.record(z.string(), z.boolean()),
  roles: z.array(z.strictObject({ name: z.string(), label: z.string() })),
  actions: z.array(
    z.strictObject({ name: z.string(), access: z.string(), description: z.string() }),
  ),
  network: z.array(z.string()),
  secrets: z.array(z.strictObject({ name: z.string(), why: z.string().nullable() })),
  userSecrets: z.array(z.strictObject({ name: z.string(), label: z.string() })),
  connectors: z.array(z.strictObject({ name: z.string(), type: z.string() })),
  database: z.boolean(),
  changelog: z.array(z.unknown()),
});

export const marketplaceToolCardRoute = defineRoute({
  method: "get",
  path: "/api/marketplaces/{id}/tools/{tool}",
  summary: "The technical card of a tool of a marketplace",
  tags: ["marketplaces"],
  request: { params: toolParams },
  responses: {
    200: json(MarketplaceToolCardSchema, "The card"),
    401: notSignedIn,
    403: notAdmin,
    404: json(ErrorSchema, "No such marketplace or tool"),
  },
});

const installed = z.strictObject({
  tool: z.string(),
  version: z.string(),
  /** The requests an admin still has to decide before production. */
  approvals: z.array(z.strictObject({ resource: z.string(), kind: z.string() })),
});

export const installMarketplaceToolRoute = defineRoute({
  method: "post",
  path: "/api/marketplaces/{id}/tools/{tool}/install",
  summary: "Create the tool in the workspace, with its requests for resources pending",
  tags: ["marketplaces"],
  request: { params: toolParams },
  responses: {
    201: json(installed, "The tool, created: it has a version and no environment"),
    401: notSignedIn,
    403: notAdmin,
    404: json(ErrorSchema, "No such marketplace or tool"),
    409: json(ErrorSchema, "The workspace already has a tool of that name"),
  },
});

export const planMarketplaceToolRoute = defineRoute({
  method: "post",
  path: "/api/marketplaces/{id}/tools/{tool}/install-plan",
  summary: "Show what installing a tool would create, and record the plan; creates nothing",
  tags: ["marketplaces"],
  request: { params: toolParams },
  responses: {
    201: json(
      z.strictObject({
        plan: z.string(),
        template: z.string(),
        version: z.string(),
        resources: z.array(z.string()),
        expiresAt: z.string(),
      }),
      "The plan; install it with POST /api/install-plans/{plan}/install",
    ),
    401: notSignedIn,
    403: notAdmin,
    404: json(ErrorSchema, "No such marketplace or tool"),
    409: json(ErrorSchema, "The workspace already has a tool of that name"),
  },
});
