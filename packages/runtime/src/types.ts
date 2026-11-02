import type { Interface, Manifest } from "@forgeron/manifest";

export type Environment = "local" | "preview" | "pilot" | "production";

export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
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
  user: User;
  can(level: string): boolean;
  interface: CallSource;
  emit(event: string, payload?: unknown): void | Promise<void>;
  secrets: Readonly<Record<string, string | undefined>>;
  userSecrets: Readonly<Record<string, string | undefined>>;
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

/** What the platform provides to `ctx`; each part has a safe default. */
export interface Platform {
  secrets: ActionContext["secrets"];
  userSecrets: ActionContext["userSecrets"];
  connectors: ActionContext["connectors"];
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
  authenticate(request: Request): User | undefined | Promise<User | undefined>;
  env?: Environment;
  platform?: Partial<Platform>;
}

export type ErrorCode =
  | "INVALID"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
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
  UPSTREAM: 1,
  INTERNAL: 1,
};

export type { Interface, Manifest };
