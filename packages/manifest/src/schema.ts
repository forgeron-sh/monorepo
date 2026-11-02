import { z } from "zod";

// What `forgeron build` writes to .forgeron/build/manifest.json (sdk.md §14).
// Defaults are resolved by the compiler: a reader never has to apply them.

export const BUILT_IN_ACCESS_LEVELS = ["read", "write", "delete", "admin"] as const;
export const INTERFACES = ["mcp", "api", "cli", "web"] as const;

const SEMVER =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

const text = z.string().min(1);

/** A built-in level, or one specific to the tool (`import`). */
export const AccessLevelSchema = z.string().regex(/^[a-z][a-z0-9-]*$/);

export const InterfaceSchema = z.enum(INTERFACES);

/** A JSON Schema describing an object (action input, view params). */
const JsonObjectSchema = z.looseObject({ type: z.literal("object") });

/** The tool's identifier, used in URLs, MCP and the CLI. */
export const ToolNameSchema = z.string().regex(/^[a-z0-9-]+$/);

/** `group.verb`, from the path under `actions/`; two levels at most. */
export const ActionNameSchema = z.string().regex(/^[a-z][a-zA-Z0-9-]*(\.[a-z][a-zA-Z0-9-]*)?$/);

const SecretNameSchema = z.string().regex(/^[A-Z][A-Z0-9_]*$/);

export const ActionSchema = z.strictObject({
  description: text,
  access: AccessLevelSchema,
  input: JsonObjectSchema,
  output: z.looseObject({}).optional(),
  confirm: z.boolean(),
  cli: z.strictObject({ args: z.array(text) }),
  http: z.strictObject({ method: z.enum(["GET", "POST"]) }),
  interfaces: z.array(InterfaceSchema),
  rateLimit: z
    .strictObject({
      per: z.enum(["user", "tool"]),
      max: z.number().int().positive(),
      window: text,
    })
    .optional(),
});

export const ViewSchema = z.strictObject({
  title: text,
  path: z.string().regex(/^\/\S*$/),
  access: AccessLevelSchema,
  params: JsonObjectSchema.optional(),
});

export const JobSchema = z.strictObject({
  cron: text,
  timezone: text.optional(),
  description: text.optional(),
});

export const RoleSchema = z.strictObject({
  label: text.optional(),
  grants: z.array(AccessLevelSchema),
});

export const ConnectorSchema = z.strictObject({
  type: text,
  mode: z.enum(["delegated", "application"]),
  scopes: z.array(text),
  why: text,
});

export const ResourcesSchema = z.strictObject({
  db: z.strictObject({ engine: z.literal("d1"), why: text.optional() }).optional(),
  files: z.strictObject({ maxSize: text, types: z.array(text), why: text.optional() }).optional(),
  cache: z.strictObject({ why: text.optional() }).optional(),
  queue: z.strictObject({ why: text.optional() }).optional(),
  secrets: z.record(SecretNameSchema, z.strictObject({ why: text.optional() })).optional(),
  userSecrets: z
    .record(SecretNameSchema, z.strictObject({ label: text, help: text.optional(), why: text }))
    .optional(),
  connectors: z.record(z.string().regex(/^[a-z][a-z0-9-]*$/), ConnectorSchema).optional(),
  network: z.strictObject({ allow: z.array(text), why: text }).optional(),
});

/** Paths under /t/<tool> that belong to the platform (sdk.md §7). */
export const RESERVED_VIEW_PATHS = ["/mcp", "/api", "/cli", "/play", "/_f"] as const;

function isReserved(path: string): boolean {
  return RESERVED_VIEW_PATHS.some(
    (reserved) => path === reserved || path.startsWith(`${reserved}/`),
  );
}

// Rules that span several keys, which a field schema cannot express.
function checkInvariants(manifest: z.infer<typeof ManifestShape>, ctx: z.RefinementCtx): void {
  const seen = new Map<string, string>();
  for (const name of Object.keys(manifest.actions)) {
    const key = name.toLowerCase();
    const first = seen.get(key);
    if (first === undefined) seen.set(key, name);
    else {
      ctx.addIssue({
        code: "custom",
        path: ["actions", name],
        message: `Action "${name}" duplicates "${first}": action names are compared without case.`,
      });
    }
  }

  const paths = new Map<string, string>();
  for (const [name, view] of Object.entries(manifest.views)) {
    if (isReserved(view.path)) {
      ctx.addIssue({
        code: "custom",
        path: ["views", name, "path"],
        message: `View "${name}" uses the reserved path "${view.path}" (reserved: ${RESERVED_VIEW_PATHS.join(", ")}).`,
      });
    }
    const first = paths.get(view.path);
    if (first === undefined) paths.set(view.path, name);
    else {
      ctx.addIssue({
        code: "custom",
        path: ["views", name, "path"],
        message: `View "${name}" uses the path "${view.path}", already used by "${first}".`,
      });
    }
  }
}

const ManifestShape = z.strictObject({
  name: ToolNameSchema,
  version: z.string().regex(SEMVER),
  title: text.optional(),
  description: text.optional(),
  interfaces: z.strictObject({
    mcp: z.boolean(),
    api: z.boolean(),
    cli: z.boolean(),
    web: z.boolean(),
  }),
  roles: z.record(z.string(), RoleSchema),
  actions: z.record(ActionNameSchema, ActionSchema),
  views: z.record(z.string(), ViewSchema),
  jobs: z.record(z.string(), JobSchema),
  resources: ResourcesSchema,
  uses: z.record(ToolNameSchema, text),
  preview: z.strictObject({ data: z.enum(["seed", "empty", "snapshot"]) }),
});

export const ManifestSchema = ManifestShape.superRefine(checkInvariants);

export type AccessLevel = z.infer<typeof AccessLevelSchema>;
export type Interface = z.infer<typeof InterfaceSchema>;
export type Action = z.infer<typeof ActionSchema>;
export type View = z.infer<typeof ViewSchema>;
export type Job = z.infer<typeof JobSchema>;
export type Role = z.infer<typeof RoleSchema>;
export type Connector = z.infer<typeof ConnectorSchema>;
export type Resources = z.infer<typeof ResourcesSchema>;
export type Manifest = z.infer<typeof ManifestSchema>;
