import { z } from "zod";
import { ErrorSchema } from "./error";
import { defineRoute } from "./route";

// A person's library of tools (D-117), and who may add a tool to it. A member lists what is in their
// library and what they may add, adds a tool (then gives what its setup asks), reads how to use it and
// removes it. An admin decides, per tool, who may add it. Nothing here is technical: no version, role,
// action or resource reaches a member's screens.

const json = <T extends z.ZodType>(schema: T, description: string) => ({
  description,
  content: { "application/json": { schema } },
});
const notSignedIn = json(ErrorSchema, "Not signed in");
const params = z.object({ tool: z.string() });

export const LibraryToolSchema = z.strictObject({
  name: z.string(),
  title: z.string(),
  /** One sentence for the person, with no technical term. */
  summary: z.string(),
  /** The URL of the tool's icon, or `null`. */
  icon: z.string().nullable(),
  /** Whether it is in the person's library. */
  installed: z.boolean(),
  /** `false` for a tool open to everyone without an install (it predates libraries): it cannot be removed. */
  managed: z.boolean(),
  /** Whether the person still has something to give before it works (their own key, an account…). */
  needsSetup: z.boolean(),
  /**
   * A channel other than production (D-119, D-125), by its reference: a branch for a temporary
   * channel, `~<name>` for a permanent one. It has its own data, apart from production. `null` for
   * the tool itself (production).
   */
  pilot: z.string().nullable(),
});

export const listLibraryRoute = defineRoute({
  method: "get",
  path: "/api/library",
  summary: "The tools in the person's library and those they may add",
  tags: ["library"],
  responses: {
    200: json(z.strictObject({ tools: z.array(LibraryToolSchema) }), "The tools"),
    401: notSignedIn,
  },
});

export const LibraryCardSchema = LibraryToolSchema.extend({
  /** `GUIDE.md`: how to use the tool, written for the person. */
  guide: z.string().nullable(),
  /** The images the guide references: path → address. */
  images: z.record(z.string(), z.string()),
  /** Where the person finishes the setup, or `null` when nothing is missing. */
  setupUrl: z.string().nullable(),
  /** How to use it, per way of using it; `null` for one the tool does not offer. */
  use: z.strictObject({
    web: z.strictObject({ url: z.string() }).nullable(),
    mcp: z.strictObject({ url: z.string() }).nullable(),
    cli: z.strictObject({ command: z.string() }).nullable(),
  }),
});

export const libraryCardRoute = defineRoute({
  method: "get",
  path: "/api/library/{tool}",
  summary: "How to use a tool, for the person",
  tags: ["library"],
  request: { params },
  responses: {
    200: json(LibraryCardSchema, "The card"),
    401: notSignedIn,
    404: json(ErrorSchema, "No such tool, or the person may not add it"),
  },
});

export const installLibraryToolRoute = defineRoute({
  method: "post",
  path: "/api/library/{tool}",
  summary: "Add a tool to the person's library",
  tags: ["library"],
  request: { params },
  responses: {
    200: json(
      z.strictObject({
        installed: z.literal(true),
        /** Where to finish the setup, or `null` when the tool is ready. */
        setupUrl: z.string().nullable(),
      }),
      "Added",
    ),
    401: notSignedIn,
    404: json(ErrorSchema, "No such tool, or the person may not add it"),
  },
});

export const uninstallLibraryToolRoute = defineRoute({
  method: "delete",
  path: "/api/library/{tool}",
  summary: "Remove a tool from the person's library, with what they gave it",
  tags: ["library"],
  request: { params },
  responses: {
    204: { description: "Removed" },
    401: notSignedIn,
    404: json(ErrorSchema, "It is not in the person's library"),
    409: json(ErrorSchema, "A tool open to everyone cannot be removed"),
  },
});

export const AvailabilitySchema = z.strictObject({
  /** `open`: the tool has no rule yet, everyone reaches it with no install. */
  mode: z.enum(["open", "nobody", "everyone", "roles", "people"]),
  roles: z.array(z.string()),
  /** Member ids. */
  people: z.array(z.string()),
  updatedAt: z.string().nullable(),
});

export const getAvailabilityRoute = defineRoute({
  method: "get",
  path: "/api/tools/{tool}/availability",
  summary: "Who may add a tool to their library",
  tags: ["library"],
  request: { params },
  responses: {
    200: json(AvailabilitySchema, "The rule"),
    401: notSignedIn,
    403: json(ErrorSchema, "Not an admin"),
    404: json(ErrorSchema, "No such tool"),
  },
});

export const putAvailabilityRoute = defineRoute({
  method: "put",
  path: "/api/tools/{tool}/availability",
  summary: "Set who may add a tool to their library",
  tags: ["library"],
  request: {
    params,
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.object({
            mode: z.enum(["nobody", "everyone", "roles", "people"]),
            roles: z.array(z.string().min(1).max(64)).max(100).optional(),
            people: z.array(z.string().min(1).max(64)).max(1000).optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: json(AvailabilitySchema, "The rule now"),
    400: json(ErrorSchema, "Not a rule"),
    401: notSignedIn,
    403: json(ErrorSchema, "Not an admin"),
    404: json(ErrorSchema, "No such tool"),
  },
});

// ---- channels other than production (D-119, D-125): opened to people, each with its own data. The
// `{branch}` of these paths is the channel's reference: a branch for a temporary channel, `~<name>`
// for a permanent one (`~staging`). Git refuses `~` in a branch name, so the two never clash.

const pilotParams = z.object({ tool: z.string(), branch: z.string() });

export const pilotCardRoute = defineRoute({
  method: "get",
  path: "/api/library/{tool}/pilots/{branch}",
  summary: "How to use a channel of a tool other than production, for the person",
  tags: ["library"],
  request: { params: pilotParams },
  responses: {
    200: json(LibraryCardSchema, "The card"),
    401: notSignedIn,
    404: json(ErrorSchema, "No such channel, or the person may not add it"),
  },
});

export const installPilotRoute = defineRoute({
  method: "post",
  path: "/api/library/{tool}/pilots/{branch}",
  summary: "Add a channel of a tool other than production to the person's library",
  tags: ["library"],
  request: { params: pilotParams },
  responses: {
    200: json(
      z.strictObject({ installed: z.literal(true), setupUrl: z.string().nullable() }),
      "Added",
    ),
    401: notSignedIn,
    404: json(ErrorSchema, "No such channel, or the person may not add it"),
  },
});

export const uninstallPilotRoute = defineRoute({
  method: "delete",
  path: "/api/library/{tool}/pilots/{branch}",
  summary: "Remove a channel of a tool from the person's library",
  tags: ["library"],
  request: { params: pilotParams },
  responses: {
    204: { description: "Removed" },
    401: notSignedIn,
    404: json(ErrorSchema, "It is not in the person's library"),
  },
});

export const getPilotAvailabilityRoute = defineRoute({
  method: "get",
  path: "/api/tools/{tool}/previews/{branch}/availability",
  summary: "Who may use a channel of a tool other than production",
  tags: ["library"],
  request: { params: pilotParams },
  responses: {
    200: json(AvailabilitySchema, "The rule; `open` means admins and developers only"),
    401: notSignedIn,
    403: json(ErrorSchema, "Not an admin"),
    404: json(ErrorSchema, "No such tool or channel"),
  },
});

export const putPilotAvailabilityRoute = defineRoute({
  method: "put",
  path: "/api/tools/{tool}/previews/{branch}/availability",
  summary: "Set who may use a channel of a tool other than production",
  tags: ["library"],
  request: {
    params: pilotParams,
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.object({
            mode: z.enum(["nobody", "everyone", "roles", "people"]),
            roles: z.array(z.string().min(1).max(64)).max(100).optional(),
            people: z.array(z.string().min(1).max(64)).max(1000).optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: json(AvailabilitySchema, "The rule now"),
    400: json(ErrorSchema, "Not a rule"),
    401: notSignedIn,
    403: json(ErrorSchema, "Not an admin"),
    404: json(ErrorSchema, "No such tool or channel"),
  },
});
