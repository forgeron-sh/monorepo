import type { Manifest } from "@forgeron/manifest";
import { createServer, type IncomingMessage, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { Miniflare } from "miniflare";
import {
  bindingsOf,
  environmentKey,
  type Activation,
  type Environment,
  type Hosting,
  type Provisioned,
  type Uploaded,
} from "./index";

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
  server: Server;
}

async function readBody(request: IncomingMessage): Promise<Buffer | undefined> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(chunk as Buffer);
  return chunks.length ? Buffer.concat(chunks) : undefined;
}

export function createLocalHosting(options: LocalHostingOptions = {}): LocalHosting {
  const running = new Map<string, Running>();
  // A new build keeps the URL of the one it replaces.
  const ports = new Map<string, number>();
  const identityOf = options.identity ?? everyRole;
  const host = options.host ?? "127.0.0.1";

  async function stop(key: string): Promise<void> {
    const current = running.get(key);
    if (!current) return;
    running.delete(key);
    ports.set(key, (current.server.address() as AddressInfo).port);
    await new Promise<void>((resolve) => {
      current.server.close(() => resolve());
      current.server.closeAllConnections();
    });
    await current.miniflare.dispose();
  }

  return {
    async provision(environment: Environment, manifest: Manifest): Promise<Provisioned> {
      return { environment, bindings: bindingsOf(manifest) };
    },

    async upload(provisioned: Provisioned, build): Promise<Uploaded> {
      return { provisioned, build };
    },

    async activate({ provisioned, build }: Uploaded): Promise<Activation> {
      const key = environmentKey(provisioned.environment);
      // A new build replaces the one that is running.
      await stop(key);

      const named = (kind: string) =>
        provisioned.bindings.filter((b) => b.kind === kind).map((b) => b.name);
      const miniflare = new Miniflare({
        modules: [{ type: "ESModule", path: "worker.js", contents: build.worker }],
        compatibilityDate: COMPATIBILITY_DATE,
        host: "127.0.0.1",
        port: 0,
        d1Databases: named("d1"),
        kvNamespaces: named("kv"),
        r2Buckets: named("r2"),
      });
      await miniflare.ready;

      const identity = JSON.stringify(identityOf(build.manifest));
      const server = createServer(async (incoming, outgoing) => {
        try {
          const headers: Record<string, string> = {};
          for (const [name, value] of Object.entries(incoming.headers)) {
            if (value !== undefined)
              headers[name] = Array.isArray(value) ? value.join(", ") : value;
          }
          // Whatever the caller sent, the identity is the developer's.
          headers["x-forgeron-user"] = identity;
          const body = await readBody(incoming);
          const response = await miniflare.dispatchFetch(
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
      await new Promise<void>((resolve, reject) => {
        server.once("error", reject);
        server.listen(options.port ?? ports.get(key) ?? 0, host, resolve);
      });
      running.set(key, { miniflare, server });

      const { port } = server.address() as AddressInfo;
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
