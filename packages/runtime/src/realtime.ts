import { mayAccess, type Manifest } from "@forgeron/manifest";

// Realtime (D-135): channels people subscribe to over a WebSocket, messages the tool's actions publish
// (`ctx.realtime`) or a page sends, and who is on a channel (presence). This is the part that does not
// depend on where it runs: a hub that holds the connections of one room and decides what goes where. A host
// brings the sockets (`forgeron dev` in Node, a Durable Object on a platform) and the rules (`authorize`).
// Neutral: no Node module, no workerd API.

/** A channel name: `note`, or one instance of it, `note:<id>`. */
export const CHANNEL = /^[a-z][a-z0-9-]{0,39}(?::[A-Za-z0-9_.~-]{1,64})?$/;
/** The part of a channel's name the tool declares: `note` for `note:<id>`. */
export const channelKey = (channel: string) => channel.split(":")[0]!;

export const MAX_PAYLOAD_BYTES = 8 * 1024;
const MAX_CHANNELS_PER_CONNECTION = 50;
/** What an action may publish in one call, and a page send in one second. */
export const MAX_PUBLISH_PER_CALL = 20;
const MAX_SENDS_PER_SECOND = 30;

/** Who asks to join, as the access rules read them: the roles, and what an admin changed in the matrix. */
interface AccessUser {
  roles: string[];
  access?: Record<string, Record<string, boolean>>;
  permissions?: Record<string, string[]>;
}

export interface RealtimePerson {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

/** What the hub needs of a socket: the same on `ws`, on workerd's `WebSocket` and on a test double. */
export interface RealtimeSocket {
  send(data: string): void;
  close(code?: number, reason?: string): void;
}

/** A message a tool published, on its way to the subscribers. */
export interface Published {
  channel: string;
  event: string;
  payload?: unknown;
}

/** What a page sends the hub. */
export type ClientMessage =
  | { t: "subscribe"; channel: string; state?: unknown }
  | { t: "unsubscribe"; channel: string }
  | { t: "send"; channel: string; event: string; payload?: unknown; self?: boolean }
  | { t: "track"; channel: string; state: unknown }
  | { t: "ping" };

/** What the hub sends a page. */
export type ServerMessage =
  | { t: "ready" }
  | { t: "subscribed"; channel: string; presence?: PresenceEntry[] }
  | { t: "denied"; channel: string; reason: string }
  | {
      t: "message";
      channel: string;
      event: string;
      payload?: unknown;
      from?: { id: string; name: string; avatar?: string };
      at: string;
    }
  | { t: "presence"; channel: string; joins: PresenceEntry[]; leaves: string[] }
  | { t: "pong" }
  | { t: "error"; message: string };

export interface PresenceEntry {
  id: string;
  name: string;
  avatar?: string;
  /** What the person said about themselves with `track`: a cursor, a typing flag, a status. */
  state?: unknown;
}

export interface HubHooks {
  /** May this person listen (`subscribe`) or send on the channel? `true`, or the reason it is refused. */
  authorize(
    person: RealtimePerson,
    channel: string,
    kind: "subscribe" | "send",
  ): Promise<true | string>;
  /** Whether the people on this channel are listed to each other. */
  presence(channel: string): boolean;
  now(): Date;
}

interface Subscriber {
  id: number;
  socket: RealtimeSocket;
  person: RealtimePerson;
  channels: Map<string, { state?: unknown }>;
  sends: number[];
}

const bytes = (value: unknown) => new TextEncoder().encode(JSON.stringify(value ?? null)).length;

export interface Connection {
  /** Handles what the page sent, as text. Never throws: a bad message is answered with `error`. */
  receive(raw: string): Promise<void>;
  /** The socket closed: the person leaves every channel. */
  close(): void;
}

/** The connections of one room (a workspace's tool on one channel) and what goes between them. */
export class RealtimeHub {
  private readonly channels = new Map<string, Set<Subscriber>>();
  private next = 1;

  constructor(private readonly hooks: HubHooks) {}

  /** The number of people connected (a tab counts once). */
  get size(): number {
    return new Set([...this.channels.values()].flatMap((s) => [...s].map((x) => x.id))).size;
  }

  connect(socket: RealtimeSocket, person: RealtimePerson): Connection {
    const me: Subscriber = { id: this.next++, socket, person, channels: new Map(), sends: [] };
    const reply = (message: ServerMessage) => {
      try {
        socket.send(JSON.stringify(message));
      } catch {
        // A closed socket: the host calls `close()` next.
      }
    };
    reply({ t: "ready" });
    return {
      receive: (raw) => this.handle(me, raw, reply),
      close: () => this.leaveAll(me),
    };
  }

  /** Delivers a message to the subscribers of a channel; the number reached. */
  publish(
    channel: string,
    event: string,
    payload?: unknown,
    from?: Subscriber,
    self = true,
  ): number {
    const message: ServerMessage = {
      t: "message",
      channel,
      event,
      ...(payload === undefined ? {} : { payload }),
      ...(from
        ? {
            from: {
              id: from.person.id,
              name: from.person.name,
              ...(from.person.avatar ? { avatar: from.person.avatar } : {}),
            },
          }
        : {}),
      at: this.hooks.now().toISOString(),
    };
    const text = JSON.stringify(message);
    let reached = 0;
    for (const subscriber of this.channels.get(channel) ?? []) {
      if (!self && subscriber === from) continue;
      try {
        subscriber.socket.send(text);
        reached += 1;
      } catch {
        // Dropped when its socket closes.
      }
    }
    return reached;
  }

  /** What the tool's actions published (`ctx.realtime`), refused when it is not a message this hub takes. */
  publishAll(messages: readonly Published[]): void {
    for (const m of messages.slice(0, MAX_PUBLISH_PER_CALL)) {
      if (!CHANNEL.test(m.channel) || typeof m.event !== "string" || m.event === "") continue;
      if (bytes(m.payload) > MAX_PAYLOAD_BYTES) continue;
      this.publish(m.channel, m.event, m.payload);
    }
  }

  /** Who is on a channel, each person once (several tabs are one person). */
  presenceOf(channel: string): PresenceEntry[] {
    const seen = new Map<string, PresenceEntry>();
    for (const s of this.channels.get(channel) ?? []) {
      const entry = s.channels.get(channel);
      seen.set(s.person.id, {
        id: s.person.id,
        name: s.person.name,
        ...(s.person.avatar ? { avatar: s.person.avatar } : {}),
        ...(entry?.state === undefined ? {} : { state: entry.state }),
      });
    }
    return [...seen.values()];
  }

  private async handle(
    me: Subscriber,
    raw: string,
    reply: (m: ServerMessage) => void,
  ): Promise<void> {
    let message: ClientMessage;
    try {
      if (raw.length > MAX_PAYLOAD_BYTES * 2) throw new Error("too big");
      message = JSON.parse(raw) as ClientMessage;
    } catch {
      return reply({ t: "error", message: "A message is JSON of 16 KB at most." });
    }
    if (message.t === "ping") return reply({ t: "pong" });
    if (!message || typeof (message as { channel?: unknown }).channel !== "string") {
      return reply({ t: "error", message: "A message names its channel." });
    }
    const channel = (message as { channel: string }).channel;
    if (!CHANNEL.test(channel)) {
      return reply({
        t: "denied",
        channel: String(channel).slice(0, 80),
        reason: "Not a channel name.",
      });
    }

    switch (message.t) {
      case "subscribe": {
        if (me.channels.has(channel))
          return reply({ t: "subscribed", channel, ...this.listed(channel) });
        if (me.channels.size >= MAX_CHANNELS_PER_CONNECTION) {
          return reply({
            t: "denied",
            channel,
            reason: `At most ${MAX_CHANNELS_PER_CONNECTION} channels per connection.`,
          });
        }
        const decision = await this.hooks.authorize(me.person, channel, "subscribe");
        if (decision !== true) return reply({ t: "denied", channel, reason: decision });
        me.channels.set(channel, message.state === undefined ? {} : { state: message.state });
        const room = this.channels.get(channel) ?? new Set();
        const wasThere = [...room].some((s) => s.person.id === me.person.id);
        room.add(me);
        this.channels.set(channel, room);
        reply({ t: "subscribed", channel, ...this.listed(channel) });
        if (this.hooks.presence(channel) && !wasThere)
          this.announce(channel, me, [this.entryOf(me, channel)], []);
        return;
      }
      case "unsubscribe":
        return this.leave(me, channel);
      case "track": {
        const entry = me.channels.get(channel);
        if (!entry) return reply({ t: "denied", channel, reason: "Subscribe first." });
        if (bytes(message.state) > MAX_PAYLOAD_BYTES)
          return reply({ t: "error", message: "A state is 8 KB at most." });
        entry.state = message.state;
        if (this.hooks.presence(channel))
          this.announce(channel, me, [this.entryOf(me, channel)], [], true);
        return;
      }
      case "send": {
        const now = this.hooks.now().getTime();
        me.sends = me.sends.filter((t) => now - t < 1000);
        if (me.sends.length >= MAX_SENDS_PER_SECOND)
          return reply({ t: "error", message: "Too many messages: slow down." });
        me.sends.push(now);
        if (
          typeof message.event !== "string" ||
          message.event === "" ||
          message.event.length > 60
        ) {
          return reply({
            t: "error",
            message: "A message has an event name of 60 characters at most.",
          });
        }
        if (bytes(message.payload) > MAX_PAYLOAD_BYTES)
          return reply({ t: "error", message: "A payload is 8 KB at most." });
        // Listening is not sending: the tool says who may send on a channel.
        const decision = await this.hooks.authorize(me.person, channel, "send");
        if (decision !== true) return reply({ t: "denied", channel, reason: decision });
        if (!me.channels.has(channel))
          return reply({ t: "denied", channel, reason: "Subscribe first." });
        this.publish(channel, message.event, message.payload, me, message.self === true);
        return;
      }
      default:
        return reply({ t: "error", message: "Unknown message." });
    }
  }

  private listed(channel: string): { presence?: PresenceEntry[] } {
    return this.hooks.presence(channel) ? { presence: this.presenceOf(channel) } : {};
  }

  private entryOf(me: Subscriber, channel: string): PresenceEntry {
    const entry = me.channels.get(channel);
    return {
      id: me.person.id,
      name: me.person.name,
      ...(me.person.avatar ? { avatar: me.person.avatar } : {}),
      ...(entry?.state === undefined ? {} : { state: entry.state }),
    };
  }

  private announce(
    channel: string,
    from: Subscriber,
    joins: PresenceEntry[],
    leaves: string[],
    includeSelf = false,
  ): void {
    const text = JSON.stringify({ t: "presence", channel, joins, leaves } satisfies ServerMessage);
    for (const s of this.channels.get(channel) ?? []) {
      if (s === from && !includeSelf) continue;
      try {
        s.socket.send(text);
      } catch {
        // Dropped when its socket closes.
      }
    }
  }

  private leave(me: Subscriber, channel: string): void {
    if (!me.channels.delete(channel)) return;
    const room = this.channels.get(channel);
    room?.delete(me);
    const stays = [...(room ?? [])].some((s) => s.person.id === me.person.id);
    if (room && room.size === 0) this.channels.delete(channel);
    if (!stays && this.hooks.presence(channel)) this.announce(channel, me, [], [me.person.id]);
  }

  private leaveAll(me: Subscriber): void {
    for (const channel of [...me.channels.keys()]) this.leave(me, channel);
  }
}

/**
 * The tool's rule for a channel (D-135), shared by every host: the channel is declared, the person holds
 * the level it asks (the matrix included, as for an action), and, for an instance, the tool's own action
 * agrees. `callAction` runs an action of the tool as that person.
 */
export async function authorizeChannel(input: {
  manifest: Pick<Manifest, "roles" | "realtime">;
  user: AccessUser;
  channel: string;
  kind: "subscribe" | "send";
  callAction?: (action: string, input: unknown) => Promise<unknown>;
}): Promise<true | string> {
  const { manifest, user, channel, kind } = input;
  const key = channelKey(channel);
  const declared = manifest.realtime?.channels[key];
  if (!declared) return `The tool has no channel "${key}".`;
  const level = kind === "send" ? declared.send : declared.access;
  if (level === undefined)
    return "Nobody sends on this channel from a page: only the tool publishes.";
  if (!mayAccess(user, manifest.roles, `channel:${key}`, level)) {
    return `This channel needs the "${level}" access level.`;
  }
  if (declared.authorize && channel.includes(":")) {
    if (!input.callAction) return "The tool's check cannot be asked here.";
    try {
      const answer = await input.callAction(declared.authorize, {
        channel,
        id: channel.slice(key.length + 1),
        kind,
      });
      const allowed =
        answer === true ||
        (typeof answer === "object" &&
          answer !== null &&
          (answer as { allowed?: unknown }).allowed === true);
      return allowed ? true : "The tool does not let you in.";
    } catch {
      return "The tool does not let you in.";
    }
  }
  return true;
}
