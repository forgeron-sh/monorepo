import type { Interface, Manifest } from "@forgeron/manifest";

export type Environment = "local" | "preview" | "production";

export interface User {
  id: string;
  email: string;
  name: string;
  /** The person's picture, an address, when the workspace has one (D-131). */
  avatar?: string;
  roles: string[];
  /** The ids of the teams the person belongs to (D-132); only with `resources.directory.teams`. */
  teams?: string[];
  /**
   * What an admin changed in the console, for this person's roles: per role, per action,
   * `true` to allow and `false` to refuse, whatever the role's levels say. The gateway adds it
   * with the roles, so the change reaches every interface with no new version (docs/sdk.md §3).
   */
  access?: Record<string, Record<string, boolean>>;
  /**
   * The tool permissions each of the person's workspace roles is mapped to in the console (D-127).
   * Without it (`forgeron dev`, tests), a role is read with the default mapping: the profile of that
   * name, else `admin` holds every permission and `member` the default profile.
   */
  permissions?: Record<string, string[]>;
}

/** A person of the workspace as a tool sees them (D-131): only the fields its `resources.directory` asks for. */
export interface DirectoryMember {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  roles?: string[];
  teams?: string[];
}

/** A team of the workspace (D-132). */
export interface DirectoryTeam {
  id: string;
  name: string;
  description?: string;
  /** The ids of its members. */
  members: string[];
}

/** What the gateway hands a call when the tool declared `resources.directory`. */
export interface DirectorySnapshot {
  members: DirectoryMember[];
  teams?: DirectoryTeam[];
}

/** `ctx.directory`: the people and teams of the workspace the tool may know about (D-131, D-132). */
export interface Directory {
  /** The person who calls. */
  me(): DirectoryMember;
  /** A member by id or email; `undefined` when nobody of the workspace has it. */
  member(idOrEmail: string): Promise<DirectoryMember | undefined>;
  /** The members, optionally those whose name or email contains `query`, or those of one team. */
  members(options?: { query?: string; team?: string; limit?: number }): Promise<DirectoryMember[]>;
  team(id: string): Promise<DirectoryTeam | undefined>;
  teams(options?: { mine?: boolean }): Promise<DirectoryTeam[]>;
  /** Whether the caller belongs to the team. */
  inTeam(id: string): boolean;
}

interface Issue {
  path: readonly PropertyKey[];
  message: string;
}

/** What the runtime needs of a validator: the Zod schemas of `@forgeron/sdk` fit. */
export interface Schema {
  safeParse(value: unknown): {
    success: boolean;
    data?: unknown;
    error?: { issues: readonly Issue[] };
  };
}

export interface FetchInit {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

export interface FetchResponse {
  ok: boolean;
  status: number;
  // oxlint-disable-next-line typescript/no-explicit-any -- same as the standard `Response.json()`
  json(): Promise<any>;
  text(): Promise<string>;
}

export type Fetch = (url: string, init?: FetchInit) => Promise<FetchResponse>;

export interface Logger {
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, data?: unknown): void;
}

/** Where a call comes from: an interface, a scheduled task or another tool. */
export type CallSource = Interface | "job" | "tool";

/** The `ctx` an action receives (`@forgeron/sdk` types it as `Context`). */
export interface ActionContext {
  input: unknown;
  /** The person, with the plain values they gave the tool's setup (`ctx.user.setup`, D-097). */
  user: User & { setup: Readonly<Record<string, string | undefined>> };
  can(level: string): boolean;
  interface: CallSource;
  emit(event: string, payload?: unknown): void | Promise<void>;
  secrets: Readonly<Record<string, string | undefined>>;
  userSecrets: Readonly<Record<string, string | undefined>>;
  /** The workspace's people and teams, with `resources.directory` only. */
  directory: Directory;
  connectors: Readonly<Record<string, unknown>>;
  fetch: Fetch;
  files: unknown;
  cache: unknown;
  /** The tool's database: with `resources.db` only. A Kysely, plus `batch` (see `createDb`). */
  db: unknown;
  tools: Readonly<Record<string, unknown>>;
  log: Logger;
  now(): Date;
  env: Environment;
}

/** An action as the runtime runs it: what `@forgeron/sdk`'s `action()` returns fits. */
export interface RuntimeAction {
  input: Schema;
  output?: Schema;
  run(ctx: ActionContext): unknown;
}

/** What an event handler receives (sdk.md §9). */
export interface EventContext {
  payload: unknown;
  user: User;
  emit: ActionContext["emit"];
  secrets: ActionContext["secrets"];
  fetch: Fetch;
  db: unknown;
  log: Logger;
  now(): Date;
  env: Environment;
}

/** A handler of the tool, as the runtime runs it: what `@forgeron/sdk`'s `on()` returns fits. */
export interface RuntimeEvent {
  event: string;
  mode: "sync" | "queue";
  handler(ctx: EventContext): unknown;
}

/** A scheduled task: what `schedule()` returns fits. Its context is the tool's own. */
export interface RuntimeJob {
  handler(ctx: ActionContext): unknown;
}

/** A `queue` handler waiting to run: sent through the queue, delivered back to the runtime. */
export interface QueuedDelivery {
  /** The name of the handler (its file under `events/`). */
  handler: string;
  event: string;
  payload: unknown;
  user: User;
}

/**
 * Where the platform keeps per-person secrets (`resources.userSecrets`), encrypted. The runtime
 * reads a person's own values for `ctx.userSecrets` and writes what that person submitted; it has
 * no way to read another person's, and nothing here lets a developer or an admin read one back.
 */
export interface UserSecretStore {
  read(user: User): Promise<Readonly<Record<string, string>>>;
  write(user: User, name: string, value: string): Promise<void>;
}

/**
 * Where the platform keeps the plain values of a person's setup (`manifest.setup`, D-097): in clear,
 * the person's own. The runtime writes what that person submitted; the gateway hands the tool the
 * caller's values for a call (`Platform.userSetup`).
 */
export interface UserSetupStore {
  read(user: User): Promise<Readonly<Record<string, string>>>;
  /** Sets the given values; an empty string removes one. */
  write(user: User, values: Record<string, string>): Promise<void>;
}

/**
 * What the platform lends the runtime for delegated connectors (D-046): the access token of the
 * caller's own consent, for each connector they gave one for, and where to give it for the others.
 * There is no refresh token here: the platform keeps it and refreshes before handing a token over.
 */
export interface ConnectorSessions {
  /** The caller's access tokens by connector name; a connector without consent is absent. */
  tokens(user: User): Promise<Readonly<Record<string, string>>>;
  /** Where the person gives their consent for the connector `name`, or `undefined` if unknown. */
  consentUrl(name: string): string | undefined;
}

/** What a connector's session is given: the same shape as the SDK's `ConnectorSession`. */
export interface ConnectorSessionInput {
  mode: "delegated" | "application";
  scopes: readonly string[];
  token(): Promise<string>;
  fetch: Fetch;
}

/** What the platform provides to `ctx`; each part has a safe default. */
export interface Platform {
  secrets: ActionContext["secrets"];
  userSecrets: ActionContext["userSecrets"];
  /** When set, `ctx.userSecrets` is the caller's own, and a missing one is collected on first use. */
  userSecretStore?: UserSecretStore;
  /**
   * The caller's own plain values of the tool's setup, handed by the gateway for this call. When set,
   * `ctx.user.setup` is these and a required field that is missing is asked for on first use.
   */
  userSetup?: Readonly<Record<string, string>>;
  connectors: ActionContext["connectors"];
  /** The workspace's people and teams, as the gateway filtered them for this tool and this call (D-131). */
  directory?: DirectorySnapshot;
  /** When set, a delegated connector gets the caller's own token, and a missing consent is asked for on first use. */
  connectorSessions?: ConnectorSessions;
  /**
   * Builds `ctx.connectors.<name>` from a session (`createConnectorClient` of `@forgeron/sdk`, with
   * the connector package's definition). Without it a connector is not exposed to the action.
   */
  connectorClient?: (name: string, session: ConnectorSessionInput) => unknown;
  /** The unfiltered `fetch`; the runtime only lets through the hosts of `resources.network`. */
  fetch: Fetch;
  files: unknown;
  cache: unknown;
  /** The database of the environment: `createDb(env.DB)` in a Worker. */
  db?: unknown;
  tools: ActionContext["tools"];
  log: Logger;
  /** Sees every emitted event, before its handlers run (tests record them here). */
  emit: ActionContext["emit"];
  /**
   * Puts a `queue` delivery on the platform's queue (Cloudflare Queues), which hands it back to
   * `Runtime.deliver` with its own retries. Without it, the runtime delivers in process.
   */
  enqueue?: (delivery: QueuedDelivery) => void | Promise<void>;
  now(): Date;
}

/**
 * What the gateway injects into a view's page: who is looking, and the short-lived token the
 * view calls its tool with (sdk.md §7, Isolation point 3). `@forgeron/sdk/react` reads it.
 */
export interface ViewBootstrap {
  workspace: string;
  tool: string;
  /** The name of the view in the manifest. */
  view: string;
  /** Where the tool lives on the workspace origin, like `/t/crm`. */
  base: string;
  /** Signed, bound to `<workspace>/<tool>` and to the person; refused by any other tool. */
  token: string;
  /** When the token stops working, in seconds since the epoch. */
  expiresAt: number;
  user: User;
  /** The access levels the person holds: it only serves to disable controls. */
  grants: string[];
  /**
   * The actions the person may call, the console's matrix included (D-043): what `useCanCall` reads.
   * Absent: `canCall` shows nothing as allowed.
   */
  callable?: string[];
}

/** A person the gateway resolved from a token, with the audience the token was issued for (`acme/crm`). */
export interface Authenticated {
  user: User;
  audience: string;
}

export interface RuntimeOptions {
  manifest: Manifest;
  /** One implementation per action of the manifest, by action name. */
  actions: Record<string, RuntimeAction>;
  /** One implementation per handler of the manifest, by name. */
  events?: Record<string, RuntimeEvent>;
  /** One implementation per scheduled task of the manifest, by name. */
  jobs?: Record<string, RuntimeJob>;
  /** The time zone of tasks that name none: the workspace's. UTC by default. */
  timeZone?: string;
  /**
   * Who is calling. Identity and tokens belong to the gateway: the runtime only
   * receives the person it resolved, or `undefined` for an anonymous call.
   */
  authenticate(
    request: Request,
  ): User | Authenticated | undefined | Promise<User | Authenticated | undefined>;
  /**
   * The audience of this tool, `<workspace>/<tool>` (`acme/crm`; sdk.md §7, Isolation point 5).
   * When set, a call is refused unless `authenticate` returns the audience; a token issued for
   * another tool is useless here.
   */
  audience?: string;
  /** The public address of the tool (`https://acme.forgeron.app/t/crm`): the base of the input link. */
  baseUrl?: string;
  env?: Environment;
  platform?: Partial<Platform>;
}

export type ErrorCode =
  | "INVALID"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "SECRET_REQUIRED"
  | "UPSTREAM"
  | "INTERNAL";

export interface Failure {
  code: ErrorCode;
  message: string;
  details?: unknown;
}

export type Outcome = { ok: true; result: unknown } | { ok: false; error: Failure };

/** sdk.md section 6. */
export const HTTP_STATUS: Record<ErrorCode, number> = {
  INVALID: 400,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  SECRET_REQUIRED: 428,
  UPSTREAM: 502,
  INTERNAL: 500,
};

/** `forgeron <tool> …` exit codes (sdk.md §5): 0 is success, 1 any other failure of the action. */
export const EXIT_CODE: Record<ErrorCode, number> = {
  INVALID: 2,
  FORBIDDEN: 3,
  NOT_FOUND: 4,
  CONFLICT: 1,
  RATE_LIMITED: 1,
  SECRET_REQUIRED: 1,
  UPSTREAM: 1,
  INTERNAL: 1,
};

export type { Interface, Manifest };
