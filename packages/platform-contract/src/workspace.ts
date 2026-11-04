import { z } from "zod";
import { ErrorSchema } from "./error";
import { defineRoute } from "./route";

// What the console shell and its first-run checklist draw (FOR-129), and the workspace's audit log.

const json = <T extends z.ZodType>(schema: T, description: string) => ({
  description,
  content: { "application/json": { schema } },
});
const notSignedIn = json(ErrorSchema, "Not signed in");
const notAdmin = json(ErrorSchema, "Not an admin");

const method = z.strictObject({ enabled: z.boolean(), configured: z.boolean() });

/** Which sign-in methods are on and how mail is sent; for admins. */
const SignInSchema = z.strictObject({
  email: z.strictObject({ enabled: z.boolean(), mail: z.enum(["email", "console", "off"]) }),
  oidc: method,
  saml: method,
});
export type SignIn = z.infer<typeof SignInSchema>;

const WorkspaceSchema = z.strictObject({
  workspace: z.string(),
  /** `https://<workspace>.<base domain>`: where people and tools reach the workspace. */
  endpoint: z.string(),
  person: z.strictObject({
    id: z.string(),
    email: z.string(),
    name: z.string(),
    roles: z.array(z.string()),
    admin: z.boolean(),
  }),
  /** Counts only: what the first-run checklist needs. */
  setup: z.strictObject({
    members: z.number().int(),
    /** Pending invitations. */
    invitations: z.number().int(),
    tools: z.number().int(),
    /** Tools with a version on an environment. */
    deployed: z.number().int(),
    /** Whether any tool has been called. */
    called: z.boolean(),
  }),
  /** For admins. */
  signIn: SignInSchema.optional(),
  /** For admins. */
  install: z.strictObject({ baseDomain: z.string() }).optional(),
});

export const workspaceRoute = defineRoute({
  method: "get",
  path: "/api/workspace",
  summary: "The workspace, the signed-in person and the first-run counts",
  tags: ["workspace"],
  responses: { 200: json(WorkspaceSchema, "The workspace"), 401: notSignedIn },
});

const AuditAnswerSchema = z.strictObject({
  entries: z.array(
    z.strictObject({
      id: z.string(),
      at: z.string(),
      tool: z.string(),
      /** The email of a member. */
      actor: z.string(),
      interface: z.string().optional(),
      kind: z.string(),
      subject: z.string(),
      result: z.string(),
    }),
  ),
});

/** Newest first. Each tool contributes its latest `limit` lines; the merged list is cut to `limit`. */
export const auditRoute = defineRoute({
  method: "get",
  path: "/api/audit",
  summary: "The latest audit lines of the workspace's tools, newest first, without their payloads",
  tags: ["audit"],
  request: {
    query: z.object({
      limit: z
        .string()
        .optional()
        .describe("How many lines: 50 by default, at most 200; any other value is read as 50"),
    }),
  },
  responses: { 200: json(AuditAnswerSchema, "The lines"), 401: notSignedIn, 403: notAdmin },
});
