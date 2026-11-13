import type { Manifest } from "@forgeron/manifest";
import { ADMIN_TEAM, subjectsOf } from "@forgeron/permissions";
import { createServer, type IncomingMessage, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { Miniflare } from "miniflare";
import { applyMigrations, type D1Database } from "./migrate";
import { corsHeaders, isViewCall, serveLocalView } from "./local-views";
import {
  createLocalRealtime,
  readPublished,
  REALTIME_HEADER,
  type RealtimeUser,
} from "./local-realtime";
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
  avatar?: string;
  /** `everyone` and `team:<id>` for each team (D-136). */
  subjects: string[];
  teams?: string[];
  /** What each subject is given in the tool; without it, the default grants (`everyone`: the default profile, `team:admin`: all). */
  permissions?: Record<string, string[]>;
}

export interface LocalHostingOptions {
  /** Who the developer is for the tool. In the admin team by default: every permission of the tool. */
  identity?: (manifest: Manifest) => LocalUser;
  /** The workspace's people and teams, for a tool that declares `resources.directory` (D-131). */
  directory?: (manifest: Manifest) => unknown;
  /** The port the environment answers on; free port by default. */
  port?: number;
  host?: string;
  /** Where the databases, KV and R2 of the environment are kept on disk. In memory by default. */
  persist?: string;
  /**
   * The same person under another email of the directory, for `?as=` and a page's `local:<email>` token:
   * how two people are tried at once on one machine. `undefined` for an email it does not know.
   */
  identityFor?: (manifest: Manifest, email: string) => LocalUser | undefined;
  /** Reads a built file of the tool's views (`views/<name>.js`); without it no view is served. */
  viewFile?: (file: string) => Promise<Buffer | undefined>;
}

export interface LocalHosting extends Hosting {
  /** Stops every running environment. */
  close(): Promise<void>;
}

const COMPATIBILITY_DATE = "2026-07-01";

const admin = (): LocalUser => ({
  id: "dev",
  email: "dev@localhost",
  name: "Local developer",
  subjects: subjectsOf([ADMIN_TEAM]),
  teams: [ADMIN_TEAM],
});

interface Running {
  miniflare: Miniflare;
  server?: Server;
  /** Of the build being served: the server outlives a build. */
  identity: string;
  manifest: Manifest;
  /** The JSON of `x-forgeron-directory`, for a tool that declares it. */
  directory?: string;
  /** The realtime hub of this environment (D-135): the sockets and what actions publish. */
  realtime?: ReturnType<typeof createLocalRealtime>;
}

async function readBody(request: IncomingMessage): Promise<Buffer | undefined> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(chunk as Buffer);
  return chunks.length ? Buffer.concat(chunks) : undefined;
}

export function createLocalHosting(options: LocalHostingOptions = {}): LocalHosting {
  const running = new Map<string, Running>();
  const identityOf = options.identity ?? admin;
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

  /** The other person a page asked to be, when the directory knows them and they are not the developer. */
  const identityOther = (running: Running, email: string | undefined): LocalUser | undefined => {
    if (!email || !options.identityFor) return undefined;
    return options.identityFor(running.manifest, email);
  };

  const directoryOf = (manifest: Manifest) =>
    manifest.resources.directory && options.directory
      ? { directory: JSON.stringify(options.directory(manifest)) }
      : {};

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
      manifest: uploaded.build.manifest,
      ...directoryOf(uploaded.build.manifest),
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
      current.manifest = uploaded.build.manifest;
      delete current.directory;
      Object.assign(current, directoryOf(uploaded.build.manifest));

      if (!current.server) {
        const server = createServer(async (incoming, outgoing) => {
          try {
            const headers: Record<string, string> = {};
            for (const [name, value] of Object.entries(incoming.headers)) {
              if (value !== undefined)
                headers[name] = Array.isArray(value) ? value.join(", ") : value;
            }
            // Whatever the caller sent, the identity is the developer's, or another person of the directory
            // when the page says so (`?as=<email>`, or its `local:<email>` token): how two people are tried
            // at once on one machine.
            const asked = new URL(incoming.url ?? "/", "http://local").searchParams.get("as");
            const bearer = /^Bearer local:(.+)$/.exec(
              String(incoming.headers.authorization ?? ""),
            )?.[1];
            const other = identityOther(current, asked ?? bearer);
            const identity = other ? JSON.stringify(other) : current.identity;
            headers["x-forgeron-user"] = identity;
            delete headers["x-forgeron-directory"];
            if (current.directory) headers["x-forgeron-directory"] = current.directory;
            const pathname = new URL(incoming.url ?? "/", "http://local").pathname;
            // A view's page runs in a sandbox with an opaque origin: its calls are cross-origin.
            if (incoming.method === "OPTIONS" && isViewCall(pathname)) {
              outgoing.writeHead(204, corsHeaders);
              outgoing.end();
              return;
            }
            if (options.viewFile) {
              const view = await serveLocalView(
                incoming.method ?? "GET",
                pathname,
                current.manifest,
                JSON.parse(identity) as LocalUser,
                options.viewFile,
              );
              if (view) {
                outgoing.writeHead(view.status, view.headers);
                outgoing.end(view.body);
                return;
              }
            }
            const body = await readBody(incoming);
            const response = await current.miniflare.dispatchFetch(
              `http://${incoming.headers.host ?? "localhost"}${incoming.url ?? "/"}`,
              { method: incoming.method ?? "GET", headers, ...(body ? { body } : {}) },
            );
            // What the action published (D-135) goes to the people listening, and not to the caller.
            const published = readPublished(response.headers);
            if (published.length > 0) current.realtime?.publish(published);
            const answered = Object.fromEntries(response.headers);
            delete answered[REALTIME_HEADER];
            outgoing.writeHead(response.status, {
              ...answered,
              ...(isViewCall(pathname) ? corsHeaders : {}),
            });
            outgoing.end(Buffer.from(await response.arrayBuffer()));
          } catch (error) {
            outgoing.writeHead(500, { "content-type": "application/json" });
            outgoing.end(JSON.stringify({ error: { code: "INTERNAL", message: String(error) } }));
          }
        });
        // Realtime (D-135): a page connects a WebSocket to `/_f/realtime`.
        const callAs = async (user: RealtimeUser, action: string, input: unknown) => {
          const answer = await current.miniflare.dispatchFetch(
            `http://local/_f/call/${encodeURIComponent(action)}`,
            {
              method: "POST",
              headers: {
                "content-type": "application/json",
                "x-forgeron-user": JSON.stringify(user),
              },
              body: JSON.stringify(input ?? {}),
            },
          );
          return answer.ok ? answer.json() : undefined;
        };
        current.realtime = createLocalRealtime({
          manifest: () => current.manifest,
          userOf: (token) => {
            const email = /^local:(.+)$/.exec(token ?? "")?.[1];
            if (!email) return undefined;
            return (identityOther(current, email) ?? JSON.parse(current.identity)) as RealtimeUser;
          },
          callAction: callAs,
        });
        server.on("upgrade", (incoming, socket, head) => {
          if (!current.realtime?.upgrade(incoming, socket, head)) socket.destroy();
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
