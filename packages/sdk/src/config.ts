import {
  AccessLevelSchema,
  ToolNameSchema,
  type Manifest,
  type Resources,
} from "@forgeron/manifest";

type Database = NonNullable<Resources["db"]>;
type Bucket = NonNullable<Resources["files"]>;
type Cache = NonNullable<Resources["cache"]>;
type Queue = NonNullable<Resources["queue"]>;
type ConnectorResource = NonNullable<Resources["connectors"]>[string];

/** The content of `forgeron.config.ts` (docs/sdk.md section 3). */
export interface ToolConfig {
  /** Identifier, `[a-z0-9-]`, unique within the workspace. */
  name: string;
  title?: string;
  description?: string;
  /** All `true` except `web`, which is `true` only if the tool has views. */
  interfaces?: Partial<Manifest["interfaces"]>;
  roles?: Manifest["roles"];
  /** Everything the tool asks of the platform: what is not declared does not exist at runtime. */
  resources?: Resources;
  uses?: Manifest["uses"];
  preview?: Manifest["preview"];
}

/** Declares a tool. Throws if the name or a role's access level is malformed. */
export function defineConfig(config: ToolConfig): ToolConfig {
  ToolNameSchema.parse(config.name);
  for (const tool of Object.keys(config.uses ?? {})) ToolNameSchema.parse(tool);
  for (const role of Object.values(config.roles ?? {})) {
    for (const level of role.grants) AccessLevelSchema.parse(level);
  }
  return config;
}

export function database(options: { engine?: "d1"; why?: string } = {}): Database {
  return { ...options, engine: "d1" };
}

export function bucket(options: { maxSize: string; types: string[]; why?: string }): Bucket {
  return { ...options };
}

export function kv(options: { why?: string } = {}): Cache {
  return { ...options };
}

export function queue(options: { why?: string } = {}): Queue {
  return { ...options };
}

export function connector(
  type: string,
  options: { mode: "delegated" | "application"; scopes: string[]; why: string },
): ConnectorResource {
  return { type, ...options };
}
