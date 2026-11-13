// The browser side of realtime (D-135): one WebSocket per page to the tool's `/_f/realtime`, shared by every
// component, that reconnects by itself and joins again the channels in use. The hooks (`useChannel`,
// `useAction({ live })`) are made of this; tests give it a fake socket.

/** The part of the browser's `WebSocket` the client uses. */
export interface WebSocketLike {
  send(data: string): void;
  close(): void;
  onopen: (() => void) | null;
  onmessage: ((event: { data: unknown }) => void) | null;
  onclose: (() => void) | null;
  onerror: (() => void) | null;
}

export interface PresencePerson {
  id: string;
  name: string;
  avatar?: string;
  state?: unknown;
}

export interface ChannelMessage {
  event: string;
  payload?: unknown;
  from?: { id: string; name: string; avatar?: string };
  at: string;
}

export interface ChannelState {
  /** `connecting` until the tool lets the person in; `denied` says why in `reason`; `closed` once left. */
  status: "connecting" | "subscribed" | "denied" | "closed";
  reason?: string;
  /** The last messages, oldest first (50 at most). */
  messages: ChannelMessage[];
  /** Who is on the channel, when the tool lists them. */
  presence: PresencePerson[];
}

const MAX_MESSAGES = 50;

export interface ChannelHandle {
  getSnapshot(): ChannelState;
  /** Calls `listener` when the state changes (for `useSyncExternalStore`). */
  subscribe(listener: () => void): () => void;
  /** Calls `listener` with each message that arrives: what `useAction({ live })` listens to. */
  onMessage(listener: (message: ChannelMessage) => void): () => void;
  /** Sends the others on the channel a message; the tool must allow pages to send (`send` of the channel). */
  send(event: string, payload?: unknown, options?: { self?: boolean }): void;
  /** Tells the others something about yourself on the channel: a cursor, a typing flag. */
  track(state: unknown): void;
}

interface Entry {
  name: string;
  uses: number;
  state: ChannelState;
  listeners: Set<() => void>;
  messageListeners: Set<(m: ChannelMessage) => void>;
  initial?: unknown;
}

export interface RealtimeOptions {
  url: string;
  webSocket?: (url: string) => WebSocketLike;
  /** Milliseconds before the first reconnection; doubles up to ten seconds. */
  retryAfter?: number;
  setTimer?: (run: () => void, ms: number) => unknown;
  clearTimer?: (id: unknown) => void;
}

export class RealtimeConnection {
  private socket: WebSocketLike | undefined;
  private open = false;
  private readonly entries = new Map<string, Entry>();
  private attempts = 0;
  private retry: unknown;
  private heartbeat: unknown;
  private closedForGood = false;

  constructor(private readonly options: RealtimeOptions) {}

  private timer(run: () => void, ms: number) {
    return (this.options.setTimer ?? ((r, m) => setTimeout(r, m)))(run, ms);
  }
  private untimer(id: unknown) {
    (this.options.clearTimer ?? ((i) => clearTimeout(i as number)))(id);
  }

  /** A handle on a channel: the connection opens with the first one and closes with the last. */
  channel(name: string): ChannelHandle {
    let entry = this.entries.get(name);
    if (!entry) {
      entry = {
        name,
        uses: 0,
        state: { status: "connecting", messages: [], presence: [] },
        listeners: new Set(),
        messageListeners: new Set(),
      };
      this.entries.set(name, entry);
    }
    const mine = entry;
    return {
      getSnapshot: () => mine.state,
      subscribe: (listener) => {
        mine.listeners.add(listener);
        mine.uses += 1;
        this.connect();
        if (this.open) this.send({ t: "subscribe", channel: name });
        return () => {
          mine.listeners.delete(listener);
          mine.uses -= 1;
          if (mine.uses <= 0) this.release(mine);
        };
      },
      onMessage: (listener) => {
        mine.messageListeners.add(listener);
        mine.uses += 1;
        this.connect();
        if (this.open) this.send({ t: "subscribe", channel: name });
        return () => {
          mine.messageListeners.delete(listener);
          mine.uses -= 1;
          if (mine.uses <= 0) this.release(mine);
        };
      },
      send: (event, payload, options) =>
        this.send({
          t: "send",
          channel: name,
          event,
          ...(payload === undefined ? {} : { payload }),
          ...(options?.self ? { self: true } : {}),
        }),
      track: (state) => this.send({ t: "track", channel: name, state }),
    };
  }

  /** Leaves everything and stops reconnecting. */
  close(): void {
    this.closedForGood = true;
    this.untimer(this.retry);
    this.untimer(this.heartbeat);
    this.socket?.close();
  }

  private release(entry: Entry): void {
    this.entries.delete(entry.name);
    if (this.open) this.send({ t: "unsubscribe", channel: entry.name });
    if (this.entries.size === 0) {
      this.untimer(this.heartbeat);
      this.socket?.close();
      this.socket = undefined;
      this.open = false;
    }
  }

  private send(message: Record<string, unknown>): void {
    if (this.open) this.socket?.send(JSON.stringify(message));
  }

  private connect(): void {
    if (this.socket || this.closedForGood) return;
    const socket = (
      this.options.webSocket ?? ((u) => new WebSocket(u) as unknown as WebSocketLike)
    )(this.options.url);
    this.socket = socket;
    socket.onopen = () => {
      // `ready` from the server says the hub is listening; until then nothing is sent.
    };
    socket.onmessage = (event) => this.receive(String(event.data));
    socket.onclose = socket.onerror = () => {
      if (this.socket !== socket) return;
      this.socket = undefined;
      this.open = false;
      this.untimer(this.heartbeat);
      for (const entry of this.entries.values()) {
        if (entry.state.status === "subscribed") this.set(entry, { status: "connecting" });
      }
      if (this.closedForGood || this.entries.size === 0) return;
      const wait = Math.min(10_000, (this.options.retryAfter ?? 500) * 2 ** this.attempts++);
      this.retry = this.timer(() => this.connect(), wait);
    };
  }

  private receive(raw: string): void {
    let message: Record<string, unknown>;
    try {
      message = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return;
    }
    switch (message.t) {
      case "ready": {
        this.open = true;
        this.attempts = 0;
        for (const name of this.entries.keys()) this.send({ t: "subscribe", channel: name });
        const ping = () => {
          this.send({ t: "ping" });
          this.heartbeat = this.timer(ping, 25_000);
        };
        this.heartbeat = this.timer(ping, 25_000);
        return;
      }
      case "subscribed": {
        const entry = this.entries.get(String(message.channel));
        if (entry) {
          this.set(entry, {
            status: "subscribed",
            presence: (message.presence as PresencePerson[] | undefined) ?? entry.state.presence,
          });
        }
        return;
      }
      case "denied": {
        const entry = this.entries.get(String(message.channel));
        if (entry) this.set(entry, { status: "denied", reason: String(message.reason) });
        return;
      }
      case "message": {
        const entry = this.entries.get(String(message.channel));
        if (!entry) return;
        const received: ChannelMessage = {
          event: String(message.event),
          ...(message.payload === undefined ? {} : { payload: message.payload }),
          ...(message.from ? { from: message.from as ChannelMessage["from"] & object } : {}),
          at: String(message.at),
        };
        this.set(entry, { messages: [...entry.state.messages, received].slice(-MAX_MESSAGES) });
        for (const listener of [...entry.messageListeners]) listener(received);
        return;
      }
      case "presence": {
        const entry = this.entries.get(String(message.channel));
        if (!entry) return;
        const leaves = new Set(message.leaves as string[]);
        const joins = message.joins as PresencePerson[];
        const stays = entry.state.presence.filter(
          (p) => !leaves.has(p.id) && !joins.some((j) => j.id === p.id),
        );
        this.set(entry, { presence: [...stays, ...joins] });
        return;
      }
      default:
        return;
    }
  }

  private set(entry: Entry, change: Partial<ChannelState>): void {
    entry.state = { ...entry.state, ...change };
    for (const listener of [...entry.listeners]) listener();
  }
}

/** The address of the tool's realtime endpoint for a page: `ws(s)` of its own origin, with its token. */
export function realtimeUrl(base: string, token: string, location: string): string {
  const url = new URL(`${base}/_f/realtime`, location);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.searchParams.set("token", token);
  return url.toString();
}
