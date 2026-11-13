import {
  authorizeChannel,
  channelKey,
  RealtimeHub,
  type Published,
  type RealtimePerson,
  type RealtimeSocket,
} from "@forgeron/runtime";
import type { Manifest } from "@forgeron/manifest";
import { serviceBindingTarget } from "../dispatch/targets";
import type { Target } from "../dispatch/dispatch";

// The room of a tool's channel (D-135): the hub of `@forgeron/runtime` held by a Durable Object, so that
// everyone connected to the same tool channel reaches the same hub whichever isolate answered them. The
// gateway authenticates a person and hands the room their identity; the room never trusts a page.
//
// The room is made of a factory (`createRoom`) with its Workers pieces given in, so that what it does is
// tested here, and a thin class (`RealtimeRoom`) that binds those pieces to the runtime's globals. The class
// has not run on Cloudflare yet (D-135, "Not done").

/** What the gateway tells the room about a connection: who, what they may, and where to ask the tool. */
export interface RoomContext {
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    roles: string[];
    teams?: string[];
    access?: Record<string, Record<string, boolean>>;
    permissions?: Record<string, string[]>;
  };
  manifest: Pick<Manifest, "roles" | "realtime">;
  /** The tool's Worker for this channel, to ask its `authorize` action. */
  worker: string;
}

export const CONTEXT_HEADER = "x-forgeron-room-context";

export interface RoomDeps {
  /** A pair of WebSockets: the page's end and the room's. */
  pair(): { client: unknown; server: RoomSocket };
  /** The Worker of a tool, to run its authorize action as the person. */
  target(worker: string): Target | undefined;
  now(): Date;
}

/** The server end of a WebSocket as the room uses it. */
export interface RoomSocket extends RealtimeSocket {
  accept(): void;
  addEventListener(type: "message", listener: (event: { data: unknown }) => void): void;
  addEventListener(type: "close" | "error", listener: () => void): void;
}

const json = (status: number, body: unknown) => Response.json(body, { status });

export function createRoom(deps: RoomDeps) {
  const contexts = new Map<string, RoomContext>();
  const hub = new RealtimeHub({
    authorize: async (person, channel, kind) => {
      const context = contexts.get(person.id);
      if (!context) return "Unknown person.";
      return authorizeChannel({
        manifest: context.manifest,
        user: context.user,
        channel,
        kind,
        callAction: async (action, input) => {
          const target = deps.target(context.worker);
          if (!target) throw new Error("The tool is not reachable.");
          const answer = await target.fetch(
            new Request(`https://tool.internal/_f/call/${encodeURIComponent(action)}`, {
              method: "POST",
              headers: {
                "content-type": "application/json",
                "x-forgeron-user": JSON.stringify(context.user),
              },
              body: JSON.stringify(input ?? {}),
            }),
          );
          return answer.ok ? answer.json() : undefined;
        },
      });
    },
    presence: (channel) => {
      const context = [...contexts.values()][0];
      return context?.manifest.realtime?.channels[channelKey(channel)]?.presence === true;
    },
    now: deps.now,
  });

  return {
    hub,
    /** `GET /connect` (a WebSocket upgrade) and `POST /publish`, as the gateway sends them. */
    async fetch(request: Request): Promise<Response> {
      const url = new URL(request.url);
      if (url.pathname === "/publish" && request.method === "POST") {
        const list = (await request.json().catch(() => [])) as Published[];
        hub.publishAll(Array.isArray(list) ? list : []);
        return json(200, { ok: true });
      }
      if (url.pathname === "/connect") {
        if (request.headers.get("upgrade")?.toLowerCase() !== "websocket") {
          return json(426, { error: { code: "UPGRADE_REQUIRED", message: "Use a WebSocket." } });
        }
        let context: RoomContext;
        try {
          context = JSON.parse(request.headers.get(CONTEXT_HEADER) ?? "") as RoomContext;
        } catch {
          return json(400, { error: { code: "INVALID", message: "No identity." } });
        }
        const { client, server } = deps.pair();
        server.accept();
        contexts.set(context.user.id, context);
        const person: RealtimePerson = {
          id: context.user.id,
          email: context.user.email,
          name: context.user.name,
          ...(context.user.avatar ? { avatar: context.user.avatar } : {}),
        };
        const connection = hub.connect(server, person);
        server.addEventListener("message", (event) => void connection.receive(String(event.data)));
        server.addEventListener("close", () => connection.close());
        server.addEventListener("error", () => connection.close());
        // 101 is answered by the runtime's `Response` with a `webSocket`: the caller builds it.
        return Object.assign(new Response(null, { status: 200 }), { client });
      }
      return json(404, { error: { code: "NOT_FOUND", message: "Not found." } });
    },
  };
}

/** The Durable Object class the Workers runtime instantiates: the pieces of `createRoom` bound to its globals. */
export class RealtimeRoom {
  private readonly room;

  constructor(_state: unknown, env: Record<string, unknown>) {
    this.room = createRoom({
      pair: () => {
        const { 0: client, 1: server } = new (
          globalThis as unknown as { WebSocketPair: new () => Record<number, unknown> }
        ).WebSocketPair();
        return { client, server: server as RoomSocket };
      },
      target: (worker) => serviceBindingTarget(env, worker) ?? namespace(env, worker),
      now: () => new Date(),
    });
  }

  async fetch(request: Request): Promise<Response> {
    const answer = await this.room.fetch(request);
    const client = (answer as { client?: unknown }).client;
    // The runtime answers an upgrade with status 101 and the page's end in `webSocket`.
    if (client) return new Response(null, { status: 101, webSocket: client } as ResponseInit);
    return answer;
  }
}

function namespace(env: Record<string, unknown>, worker: string): Target | undefined {
  const dispatcher = env.DISPATCHER as { get(worker: string): Target } | undefined;
  return dispatcher?.get(worker);
}
