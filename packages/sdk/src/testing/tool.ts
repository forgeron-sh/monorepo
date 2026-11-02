import type { Manifest } from "@forgeron/manifest";
import type { Runtime, RuntimeOptions } from "@forgeron/runtime";
import type { Environment, Fetch, ToolClient } from "../context";
import { ToolError } from "../errors";
import { memoryCache } from "./cache";

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
  /** Freezes `ctx.now()`. */
  now?: string | Date;
  env?: Environment;
  /** Stubs of the tools in `uses`, by tool then action. */
  tools?: Record<string, Record<string, (input: unknown) => unknown>>;
}

export interface TestTool {
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
  /** What actions, handlers and tasks emitted with `ctx.emit`, in order. */
  events: EmittedEvent[];
}

interface BuiltWorker {
  createTool(options?: Partial<RuntimeOptions>): Runtime;
  manifest: Manifest;
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

export async function createTestTool(options: TestToolOptions = {}): Promise<TestTool> {
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

  const make = (given: Partial<TestIdentity>): TestTool => {
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
        fetch: options.fetch ?? noFetch,
        cache: memoryCache(user.id, cache),
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
