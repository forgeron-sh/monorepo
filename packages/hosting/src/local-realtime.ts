import "./ws-types";
import type { Manifest } from "@forgeron/manifest";
import {
  authorizeChannel,
  channelKey,
  RealtimeHub,
  type Published,
  type RealtimePerson,
} from "@forgeron/runtime";
import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocketServer } from "ws";

// Realtime in `forgeron dev` (D-135): the same hub a platform runs, on Node's `ws`. There is one room (the
// tool's local environment). A page connects to `/_f/realtime?token=local:<email>`; what the tool's actions
// publish comes back in the `x-forgeron-realtime` header of their response, which the host reads and
// removes before the caller sees it.

export const REALTIME_PATH = "/_f/realtime";
export const REALTIME_HEADER = "x-forgeron-realtime";

export interface RealtimeUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  roles: string[];
  teams?: string[];
  access?: Record<string, Record<string, boolean>>;
  permissions?: Record<string, string[]>;
}

/** The messages an action published, as its response carries them; none when the header is absent or broken. */
export function readPublished(headers: Headers): Published[] {
  const raw = headers.get(REALTIME_HEADER);
  if (!raw) return [];
  try {
    const list = JSON.parse(decodeURIComponent(escape(atob(raw)))) as unknown;
    return Array.isArray(list) ? (list as Published[]) : [];
  } catch {
    return [];
  }
}

export function createLocalRealtime(options: {
  manifest(): Manifest;
  /** Who a connection is: the identity of its token, `undefined` for a token the host does not know. */
  userOf(token: string | null): RealtimeUser | undefined;
  /** Runs an action of the tool as that person: the authorize action of a channel. */
  callAction(user: RealtimeUser, action: string, input: unknown): Promise<unknown>;
}) {
  const hub = new RealtimeHub({
    // The hub asks with a person; the user is found again by id from the connection that asked.
    authorize: async (person, channel, kind) => {
      const user = users.get(person.id);
      if (!user) return "Unknown person.";
      return authorizeChannel({
        manifest: options.manifest(),
        user,
        channel,
        kind,
        callAction: (action, input) => options.callAction(user, action, input),
      });
    },
    presence: (channel) =>
      options.manifest().realtime?.channels[channelKey(channel)]?.presence === true,
    now: () => new Date(),
  });
  const users = new Map<string, RealtimeUser>();
  const sockets = new WebSocketServer({ noServer: true });

  return {
    hub,
    /** Takes over an HTTP upgrade for `/_f/realtime`; `false` when it is not one. */
    upgrade(request: IncomingMessage, socket: Duplex, head: Buffer): boolean {
      const url = new URL(request.url ?? "/", "http://local");
      if (url.pathname !== REALTIME_PATH) return false;
      const user = options.userOf(url.searchParams.get("token"));
      if (!user || !options.manifest().realtime) {
        socket.write(
          `HTTP/1.1 ${user ? 404 : 401} ${user ? "Not Found" : "Unauthorized"}\r\nConnection: close\r\n\r\n`,
        );
        socket.destroy();
        return true;
      }
      sockets.handleUpgrade(request, socket, head, (ws) => {
        users.set(user.id, user);
        const person: RealtimePerson = {
          id: user.id,
          email: user.email,
          name: user.name,
          ...(user.avatar ? { avatar: user.avatar } : {}),
        };
        const connection = hub.connect(ws, person);
        ws.on("message", (data) => void connection.receive(data.toString()));
        ws.on("close", () => connection.close());
        ws.on("error", () => connection.close());
      });
      return true;
    },
    /** What an action published: to the people listening. */
    publish: (messages: readonly Published[]) => hub.publishAll(messages),
  };
}
