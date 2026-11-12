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
type Directory = NonNullable<Resources["directory"]>;
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
  /**
   * The tool's profiles (D-127): named sets of the permissions its actions require (`access`), which
   * the tool suggests to the workspace. Mark one `default: true`: the workspace's `member` role is
   * mapped to it when the tool arrives (else the profile with the fewest permissions). A tool never
   * names the workspace's roles: an admin maps them to profiles in the tool's Access tab.
   */
  profiles?: Manifest["roles"];
  /** @deprecated Since D-127, `profiles`: the same entries, read as profiles. */
  roles?: Manifest["roles"];
  /** Everything the tool asks of the platform: what is not declared does not exist at runtime. */
  resources?: Resources;
  /**
   * The realtime channels of the tool (D-135): who may listen (`access`), who may send from a page (`send`),
   * whether the people on it are listed (`presence`), and an action that decides for one instance
   * (`authorize`, `note:<id>`). Actions publish with `ctx.realtime`.
   */
  realtime?: Manifest["realtime"];
  /** What each person must give before the tool works: values, secrets, and the connectors' consent. */
  setup?: ToolSetup;
  uses?: Manifest["uses"];
  preview?: Manifest["preview"];
}

/** The tool's profiles, whichever key declares them: `profiles`, or `roles` before D-127. */
function profilesOf(config: Pick<ToolConfig, "profiles" | "roles">): Manifest["roles"] {
  return config.profiles ?? config.roles ?? {};
}

/**
 * Declares a tool. Throws if the name or a permission is malformed, if both `profiles` and `roles`
 * are given, or if more than one profile is the default.
 */
export function defineConfig(config: ToolConfig): ToolConfig {
  ToolNameSchema.parse(config.name);
  for (const tool of Object.keys(config.uses ?? {})) ToolNameSchema.parse(tool);
  if (config.profiles && config.roles) {
    throw new Error("Declare the profiles once: `profiles` (`roles` is its former name).");
  }
  const profiles = profilesOf(config);
  for (const profile of Object.values(profiles)) {
    for (const level of profile.grants) AccessLevelSchema.parse(level);
  }
  const defaults = Object.keys(profiles).filter((name) => profiles[name]!.default === true);
  if (defaults.length > 1) {
    throw new Error(`Only one profile may be the default: ${defaults.join(", ")}.`);
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

/** The workspace's people and teams the tool may read through `ctx.directory` (D-131). */
export function directory(options: Directory): Directory {
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
