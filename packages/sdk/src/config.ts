import {
  AccessLevelSchema,
  ToolNameSchema,
  type Manifest,
  type Resources,
  type SetupField,
} from "@forgeron/manifest";

type Database = NonNullable<Resources["db"]>;
type Bucket = NonNullable<Resources["files"]>;
type Cache = NonNullable<Resources["cache"]>;
type Queue = NonNullable<Resources["queue"]>;
type ConnectorResource = NonNullable<Resources["connectors"]>[string];
type UserSecret = NonNullable<Resources["userSecrets"]>[string];

/** A plain field of a setup: what the manifest keeps of it. */
export type PlainField = Extract<SetupField, { type: "text" | "choice" }>;

/** A secret field of a setup: it ends up in `resources.userSecrets` (D-096). */
export interface SecretField extends UserSecret {
  type: "secret";
}

/** What a person gives a tool before using it (docs/sdk.md section 10, D-096). */
export interface ToolSetup {
  /** `field.text`, `field.choice` and `field.secret`; the names are `camelCase`, secrets `UPPER_SNAKE`. */
  fields: Record<string, PlainField | SecretField>;
  /** An action of the tool that validates the values; internal, on no interface. */
  check?: string;
}

/** The content of `forgeron.config.ts` (docs/sdk.md section 3). */
export interface ToolConfig {
  /** Identifier, `[a-z0-9-]`, unique within the workspace. */
  name: string;
  title?: string;
  description?: string;
  /** One sentence for the people who use the tool, with no technical term: shown in their library. */
  summary?: string;
  /** A small `.svg` or `.png` of the tool folder, shown in the catalog: `"docs/icon.svg"`. */
  icon?: string;
  /** All `true` except `web`, which is `true` only if the tool has views. */
  interfaces?: Partial<Manifest["interfaces"]>;
  roles?: Manifest["roles"];
  /** Everything the tool asks of the platform: what is not declared does not exist at runtime. */
  resources?: Resources;
  /** What each person must give before the tool works: values, secrets, and the connectors' consent. */
  setup?: ToolSetup;
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

/** The fields of a `setup` (D-096): a value anyone may read, a choice among options, a secret. */
export const field = {
  text(options: {
    label: string;
    help?: string;
    required?: boolean;
    maxLength?: number;
  }): PlainField {
    const { required = true, ...rest } = options;
    return { type: "text", required, ...rest };
  },
  choice(options: {
    label: string;
    options: string[];
    help?: string;
    required?: boolean;
  }): PlainField {
    const { required = true, ...rest } = options;
    return { type: "choice", required, ...rest };
  },
  /** A per-person secret, sealed by the platform and never readable by the developer (D-036). */
  secret(options: { label: string; why: string; help?: string; kind?: string }): SecretField {
    return { type: "secret", ...options };
  },
};
