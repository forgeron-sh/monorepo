import type { Interface } from "@forgeron/manifest";
import type { Database, Schema } from "./db/schema";

// The `ctx` of docs/sdk.md section 6. The types are always present: the build refuses code
// that uses a resource the config does not declare, so no member is optional here.
// `ctx.db` comes with `@forgeron/sdk/db`.

export type Environment = "local" | "preview" | "production";

/** Where a call comes from: an interface, a scheduled task or another tool. */
export type CallSource = Interface | "job" | "tool";

export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
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

/** The standard `fetch`, filtered by `resources.network`. */
export type Fetch = (url: string, init?: FetchInit) => Promise<FetchResponse>;

export interface Logger {
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, data?: unknown): void;
}

export interface CacheOptions {
  /** Time to live: seconds, or a duration such as `"1h"`. */
  ttl?: number | string;
  /** `"user"` by default; `"tool"` for reference data that is identical for everyone. */
  scope?: "user" | "tool";
}

export interface Cache {
  get<T = unknown>(key: string, options?: Pick<CacheOptions, "scope">): Promise<T | undefined>;
  set(key: string, value: unknown, options?: CacheOptions): Promise<void>;
  getOrSet<T>(key: string, options: CacheOptions, compute: () => Promise<T>): Promise<T>;
  delete(key: string, options?: Pick<CacheOptions, "scope">): Promise<void>;
}

export interface Files {
  put(
    content: string | Uint8Array,
    options?: { prefix?: string; contentType?: string },
  ): Promise<string>;
  get(key: string): Promise<Uint8Array | undefined>;
  delete(key: string): Promise<void>;
  signedUrl(key: string, options: { expiresIn: number | string }): Promise<string>;
}

/** Another tool, declared in `uses` (docs/sdk.md section 12). */
export interface ToolClient {
  call(action: string, input?: unknown): Promise<unknown>;
}

/**
 * Filled in by the file `forgeron build` generates (`.forgeron/generated/db.d.ts`), which gives
 * `ctx.db` the types of the tool's schema: `interface Register { db: Database<typeof schema> }`.
 */
// oxlint-disable-next-line typescript/no-empty-object-type -- an interface, to be augmented
export interface Register {}

/** `ctx.db`: typed by the tool's schema once built, an untyped Kysely before. */
export type ContextDb = Register extends { db: infer D } ? D : Database<Schema>;

/** `ctx.connectors`: typed by the tool's connectors once built, untyped before. */
export type ContextConnectors = Register extends { connectors: infer C }
  ? Readonly<C>
  : Readonly<Record<string, unknown>>;

export interface Context<Input = unknown> {
  /** Validated, typed input. */
  input: Input;
  /** The person, or `tool:<name>` in a scheduled task. */
  user: User;
  /** The tool's database, with `resources.db`: a Kysely typed by its schema, plus `batch`. */
  db: ContextDb;
  /** Checks an additional access level in code. */
  can(level: string): boolean;
  interface: CallSource;
  emit(event: string, payload?: unknown): void | Promise<void>;
  secrets: Readonly<Record<string, string | undefined>>;
  userSecrets: Readonly<Record<string, string | undefined>>;
  /** One entry per `resources.connectors`: the official client when there is one, and `fetch`. */
  connectors: ContextConnectors;
  fetch: Fetch;
  files: Files;
  cache: Cache;
  tools: Readonly<Record<string, ToolClient>>;
  log: Logger;
  now(): Date;
  env: Environment;
}
