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

/** The `ctx` an action receives (`@forgeron/sdk` types it as `Context`). */
export interface ActionContext {
  input: unknown;
  user: User;
  can(level: string): boolean;
  interface: Interface;
  emit(event: string, payload?: unknown): void | Promise<void>;
  secrets: Readonly<Record<string, string | undefined>>;
  userSecrets: Readonly<Record<string, string | undefined>>;
  connectors: Readonly<Record<string, unknown>>;
  fetch: Fetch;
  files: unknown;
  cache: unknown;
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

/** What the platform provides to `ctx`; each part has a safe default. */
export interface Platform {
  secrets: ActionContext["secrets"];
  userSecrets: ActionContext["userSecrets"];
  connectors: ActionContext["connectors"];
  /** The unfiltered `fetch`; the runtime only lets through the hosts of `resources.network`. */
  fetch: Fetch;
  files: unknown;
  cache: unknown;
  tools: ActionContext["tools"];
  log: Logger;
  emit: ActionContext["emit"];
  now(): Date;
}

export interface RuntimeOptions {
  manifest: Manifest;
  /** One implementation per action of the manifest, by action name. */
  actions: Record<string, RuntimeAction>;
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

export type { Interface, Manifest };
