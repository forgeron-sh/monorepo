import type { Manifest } from "@forgeron/manifest";
import { createDb, type Db, type Runtime, type RuntimeOptions } from "@forgeron/runtime";
import type { Kysely } from "kysely";
import type { Batch } from "../db/schema";
import type { Environment, Fetch, ToolClient } from "../context";
import { createSchemaSql } from "../db/ddl";
import type { Schema } from "../db/schema";
import type { SeedDefinition } from "../db/seed";
import { ToolError } from "../errors";
import { memoryCache } from "./cache";
import { createMemoryD1 } from "./memory-d1";

// `createTestTool` runs the tool the way it will be deployed: it loads the Worker that
// `forgeron build` wrote to `.forgeron/build/`, and gives it a test platform (docs/sdk.md §13).

export interface TestIdentity {
  email: string;
  name?: string;
  id?: string;
  roles: string[];
  userSecrets?: Record<string, string>;
}

export interface EmittedEvent {
  event: string;
  payload: unknown;
}

export interface TestToolOptions {
  /** The tool folder; the current directory by default. It must have been built. */
  dir?: string;
  /** Who calls. Every role of the tool by default; `tool.as(...)` changes it. */
  as?: Partial<TestIdentity>;
  /** Tool secrets (`ctx.secrets`). */
  secrets?: Record<string, string>;
  /** Upstreams: `mockFetch({...})`. The tool's `resources.network` still filters the hosts. */
  fetch?: Fetch;
  /** Fakes of `ctx.connectors.<name>`: `mockConnector(definition, { fetch })`. */
  connectors?: Record<string, unknown>;
  /** Fills the database with `db/seed.ts` before the test starts. */
  seed?: boolean;
  /** Freezes `ctx.now()`. */
  now?: string | Date;
  env?: Environment;
  /** Stubs of the tools in `uses`, by tool then action. */
  tools?: Record<string, Record<string, (input: unknown) => unknown>>;
}

export interface TestTool<DB = any> {
  /**
   * Calls an action through access, validation and the platform. Resolves with the result,
   * rejects with the `ToolError` the caller would get (or with the error an action threw).
   */
  call(action: string, input?: unknown): Promise<unknown>;
  /** The same tool, called by another person. Emitted events and the cache are shared. */
  as(identity: Partial<TestIdentity>): TestTool;
  /**
   * Sends a request to the tool as this person, through its interfaces: `/mcp`, `/api/<action>`,
   * `/cli`. Paths are relative to the tool, as the gateway forwards them.
   */
  fetch(path: string, init?: RequestInit): Promise<Response>;
  /** Runs a scheduled task now, as the tool: `forgeron jobs run`. */
  runJob(name: string): Promise<void>;
  /**
   * The cron trigger at `now`: runs the tasks due then, each in its own time zone, and returns
   * their names. Freeze the clock with a date, as the trigger would carry one.
   */
  scheduled(now: Date): Promise<string[]>;
  /**
   * The tool's database, for arranging and checking a test: a Kysely on the same in-memory
   * database the actions use. Only for a tool that declares `resources.db`.
   */
  db: Kysely<DB> & Batch;
  /** What actions, handlers and tasks emitted with `ctx.emit`, in order. */
  events: EmittedEvent[];
}

interface BuiltWorker {
  createTool(options?: Partial<RuntimeOptions>): Runtime;
  manifest: Manifest;
  /** The tool's `db/schema.ts`, if it has one. */
  schema?: Schema;
  /** The tool's `db/seed.ts`, if it has one. */
  seed?: SeedDefinition;
}

function currentDirectory(): string {
  const { process } = globalThis as { process?: { cwd(): string } };
  if (!process) throw new Error("createTestTool needs `dir`: there is no current directory here.");
  return process.cwd();
}

async function loadWorker(dir: string): Promise<BuiltWorker> {
  const path = `${dir.replace(/\/+$/, "")}/.forgeron/build/worker.js`;
  try {
    return (await import(/* @vite-ignore */ `file://${path}`)) as BuiltWorker;
  } catch (cause) {
    throw new Error(`Cannot load ${path}: build the tool first (forgeron build).`, { cause });
  }
}

const noFetch: Fetch = async (url) => {
  throw new Error(`No upstream in this test: pass \`fetch: mockFetch({...})\` to reach "${url}".`);
};

export async function createTestTool<DB = any>(
  options: TestToolOptions = {},
): Promise<TestTool<DB>> {
  const worker = await loadWorker(options.dir ?? currentDirectory());
  const events: EmittedEvent[] = [];
  const cache = new Map<string, unknown>();
  const frozen = options.now === undefined ? undefined : new Date(options.now);
  const stubs = options.tools ?? {};
  const tools: Record<string, ToolClient> = Object.fromEntries(
    Object.entries(stubs).map(([tool, actions]) => [
      tool,
      {
        call: async (action: string, input?: unknown) => {
          const stub = actions[action];
          if (!stub) throw new Error(`No stub for ${tool}.${action}: add it to \`tools\`.`);
          return stub(input);
        },
      },
    ]),
  );

  // One database for the test, shared by every person: the tables of the schema, empty.
  let db: Db | undefined;
  if (worker.manifest.resources.db) {
    const d1 = await createMemoryD1();
    for (const statement of worker.schema ? createSchemaSql(worker.schema) : [])
      await d1.exec(statement);
    db = createDb(d1);
    if (options.seed) {
      if (!worker.seed) throw new Error("`seed: true` needs a db/seed.ts in the tool.");
      await worker.seed.run({ db: db as never });
    }
  } else if (options.seed) {
    throw new Error("`seed: true` needs a tool with resources.db.");
  }

  const make = (given: Partial<TestIdentity>): TestTool<DB> => {
    const identity: TestIdentity = {
      email: "test@example.com",
      roles: Object.keys(worker.manifest.roles),
      ...options.as,
      ...given,
    };
    const user = {
      id: identity.id ?? `user:${identity.email}`,
      email: identity.email,
      name: identity.name ?? identity.email,
      roles: identity.roles,
    };
    // The engine hides an unexpected exception from the caller and logs it: keep it for the test.
    const thrown: unknown[] = [];
    const runtime = worker.createTool({
      env: options.env ?? "local",
      authenticate: () => user,
      platform: {
        secrets: options.secrets ?? {},
        userSecrets: identity.userSecrets ?? {},
        connectors: options.connectors ?? {},
        fetch: options.fetch ?? noFetch,
        cache: memoryCache(user.id, cache),
        ...(db ? { db } : {}),
        tools,
        emit: (event, payload) => void events.push({ event, payload }),
        now: () => (frozen ? new Date(frozen) : new Date()),
        log: {
          info: () => {},
          warn: () => {},
          error: (_, data) => void thrown.push(data),
        },
      },
    });

    return {
      db: db as unknown as TestTool<DB>["db"],
      events,
      fetch: (path, init) => runtime.fetch(new Request(`https://tool.test${path}`, init)),
      runJob: (name) => runtime.runJob(name),
      scheduled: (now) => runtime.scheduled(now),
      as: (next) => make({ ...identity, ...next }),
      async call(action, input) {
        const outcome = await runtime.invoke(user, action, input);
        if (outcome.ok) return outcome.result;
        const { code, message, details } = outcome.error;
        if (code === "INTERNAL") {
          const original = thrown.at(-1);
          throw original instanceof Error ? original : new Error(message);
        }
        throw new ToolError(code, message, details);
      },
    };
  };

  return make({});
}
