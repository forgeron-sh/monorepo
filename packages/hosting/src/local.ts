import type { Manifest } from "@forgeron/manifest";
import { createServer, type IncomingMessage, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { Miniflare } from "miniflare";
import { applyMigrations, type D1Database } from "./migrate";
import {
  bindingsOf,
  environmentKey,
  type Activation,
  type Environment,
  type Hosting,
  type Provisioned,
  type Uploaded,
} from "./core";

// The `local` mode: a tool runs in workerd, through Miniflare, on the developer's machine.
// The gateway does not exist here, so this host plays its part: it forwards requests to the Worker
// with the identity it would have resolved (`x-forgeron-user`, see the compiler's Worker entry).

export interface LocalUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

export interface LocalHostingOptions {
  /** Who the developer is for the tool. Every role of the tool by default. */
  identity?: (manifest: Manifest) => LocalUser;
  /** The port the environment answers on; free port by default. */
  port?: number;
  host?: string;
  /** Where the databases, KV and R2 of the environment are kept on disk. In memory by default. */
  persist?: string;
}

export interface LocalHosting extends Hosting {
  /** Stops every running environment. */
  close(): Promise<void>;
}

const COMPATIBILITY_DATE = "2026-07-01";

const everyRole = (manifest: Manifest): LocalUser => ({
  id: "dev",
  email: "dev@localhost",
  name: "Local developer",
  roles: Object.keys(manifest.roles),
});

interface Running {
  miniflare: Miniflare;
  server?: Server;
  /** Of the build being served: the server outlives a build. */
  identity: string;
}

async function readBody(request: IncomingMessage): Promise<Buffer | undefined> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(chunk as Buffer);
  return chunks.length ? Buffer.concat(chunks) : undefined;
}

export function createLocalHosting(options: LocalHostingOptions = {}): LocalHosting {
  const running = new Map<string, Running>();
  const identityOf = options.identity ?? everyRole;
  const host = options.host ?? "127.0.0.1";

  async function stop(key: string): Promise<void> {
    const current = running.get(key);
    if (!current) return;
    running.delete(key);
    const { server } = current;
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
        server.closeAllConnections();
      });
    }
    await current.miniflare.dispose();
  }

  const miniflareOptions = ({ provisioned, build }: Uploaded) => {
    const named = (kind: string) =>
      provisioned.bindings.filter((b) => b.kind === kind).map((b) => b.name);
    return {
      modules: [{ type: "ESModule" as const, path: "worker.js", contents: build.worker }],
      compatibilityDate: COMPATIBILITY_DATE,
      host: "127.0.0.1",
      port: 0,
      d1Databases: named("d1"),
      kvNamespaces: named("kv"),
      r2Buckets: named("r2"),
      ...(options.persist ? { defaultPersistRoot: options.persist } : {}),
    };
  };

  // The environment's workerd, with its databases: made once, and kept while builds replace one another.
  async function open(key: string, uploaded: Uploaded): Promise<Running> {
    const existing = running.get(key);
    if (existing) return existing;
    const miniflare = new Miniflare(miniflareOptions(uploaded));
    await miniflare.ready;
    const created: Running = {
      miniflare,
      identity: JSON.stringify(identityOf(uploaded.build.manifest)),
    };
    running.set(key, created);
    return created;
  }

  return {
    async provision(environment: Environment, manifest: Manifest): Promise<Provisioned> {
      return { environment, bindings: bindingsOf(manifest) };
    },

    async upload(provisioned: Provisioned, build): Promise<Uploaded> {
      return { provisioned, build };
    },

    // The database is migrated while the previous build, if any, keeps serving.
    async migrate(uploaded, migrateOptions) {
      if (!uploaded.provisioned.bindings.some((b) => b.kind === "d1")) return { applied: [] };
      const current = await open(environmentKey(uploaded.provisioned.environment), uploaded);
      const d1 = (await current.miniflare.getD1Database("DB")) as unknown as D1Database;
      return applyMigrations(d1, uploaded.build.migrations ?? [], {
        allowDestructive: true,
        ...migrateOptions,
      });
    },

    async activate(uploaded: Uploaded): Promise<Activation> {
      const key = environmentKey(uploaded.provisioned.environment);
      const before = running.get(key);
      const current = await open(key, uploaded);
      // A new build replaces the worker that is running; its database stays.
      if (before) await current.miniflare.setOptions(miniflareOptions(uploaded));
      current.identity = JSON.stringify(identityOf(uploaded.build.manifest));

      if (!current.server) {
        const server = createServer(async (incoming, outgoing) => {
          try {
            const headers: Record<string, string> = {};
            for (const [name, value] of Object.entries(incoming.headers)) {
              if (value !== undefined)
                headers[name] = Array.isArray(value) ? value.join(", ") : value;
            }
            // Whatever the caller sent, the identity is the developer's.
            headers["x-forgeron-user"] = current.identity;
            const body = await readBody(incoming);
            const response = await current.miniflare.dispatchFetch(
              `http://${incoming.headers.host ?? "localhost"}${incoming.url ?? "/"}`,
              { method: incoming.method ?? "GET", headers, ...(body ? { body } : {}) },
            );
            outgoing.writeHead(response.status, Object.fromEntries(response.headers));
            outgoing.end(Buffer.from(await response.arrayBuffer()));
          } catch (error) {
            outgoing.writeHead(500, { "content-type": "application/json" });
            outgoing.end(JSON.stringify({ error: { code: "INTERNAL", message: String(error) } }));
          }
        });
        try {
          await new Promise<void>((resolve, reject) => {
            server.once("error", reject);
            server.listen(options.port ?? 0, host, resolve);
          });
        } catch (error) {
          // The port is taken: do not leave workerd running behind the failure.
          running.delete(key);
          await current.miniflare.dispose();
          throw error;
        }
        current.server = server;
      }

      const { port } = current.server.address() as AddressInfo;
      return { url: `http://${host}:${port}` };
    },

    async teardown(environment: Environment): Promise<void> {
      await stop(environmentKey(environment));
    },

    async close(): Promise<void> {
      for (const key of [...running.keys()]) await stop(key);
    },
  };
}

/** The local database of a tool, outside any running environment: what `forgeron db` works on. */
export async function openLocalDatabase(
  persist: string,
): Promise<{ d1: D1Database; close(): Promise<void> }> {
  const miniflare = new Miniflare({
    modules: [
      {
        type: "ESModule",
        path: "worker.js",
        contents: "export default { fetch() { return new Response(); } };",
      },
    ],
    compatibilityDate: COMPATIBILITY_DATE,
    d1Databases: ["DB"],
    defaultPersistRoot: persist,
  });
  await miniflare.ready;
  return {
    d1: (await miniflare.getD1Database("DB")) as unknown as D1Database,
    close: () => miniflare.dispose(),
  };
}
