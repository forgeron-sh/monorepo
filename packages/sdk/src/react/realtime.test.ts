import { RealtimeHub, type RealtimePerson } from "@forgeron/runtime";
import { describe, expect, it } from "vitest";
import { RealtimeConnection, realtimeUrl, type WebSocketLike } from "./realtime";

// The page's connection against the real hub, over an in-memory pair of sockets (no network).

class Pipe implements WebSocketLike {
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private readonly toHub: Array<(raw: string) => void> = [];
  closed = false;
  private hubSide: { close(): void } | undefined;
  constructor(
    private readonly open: (page: Pipe) => { receive(raw: string): Promise<void>; close(): void },
  ) {
    queueMicrotask(() => {
      const connection = this.open(this);
      this.hubSide = connection;
      this.toHub.push((raw) => void connection.receive(raw));
      this.onopen?.();
    });
  }
  /** What the hub sends the page. */
  deliver(data: string) {
    queueMicrotask(() => this.onmessage?.({ data }));
  }
  send(data: string) {
    this.toHub.forEach((f) => f(data));
  }
  close() {
    this.closed = true;
    this.hubSide?.close();
    this.onclose?.();
  }
}

const person = (id: string, name: string): RealtimePerson => ({ id, email: `${id}@acme.fr`, name });
const hub = (rule: (channel: string) => true | string = () => true) =>
  new RealtimeHub({
    authorize: async (_p, channel) => rule(channel),
    presence: (c) => c.startsWith("note:"),
    now: () => new Date("2026-11-12T10:00:00Z"),
  });
const page = (h: RealtimeHub, who: RealtimePerson) => {
  const sockets: Pipe[] = [];
  const connection = new RealtimeConnection({
    url: "ws://x/_f/realtime",
    webSocket: () => {
      const pipe = new Pipe((p) => {
        const c = h.connect({ send: (d) => p.deliver(d), close: () => {} }, who);
        return c;
      });
      sockets.push(pipe);
      return pipe;
    },
    retryAfter: 1,
  });
  return { connection, sockets };
};
const settle = () => new Promise((r) => setTimeout(r, 5));

describe("the page's realtime connection", () => {
  it("joins a channel, hears what the tool publishes, and leaves", async () => {
    const h = hub();
    const { connection } = page(h, person("u1", "Ely"));
    const channel = connection.channel("notes");
    const heard: string[] = [];
    const stop = channel.onMessage((m) => heard.push(m.event));
    await settle();
    expect(channel.getSnapshot().status).toBe("subscribed");
    h.publish("notes", "changed");
    await settle();
    expect(heard).toEqual(["changed"]);
    expect(channel.getSnapshot().messages).toHaveLength(1);
    stop();
    await settle();
    expect(h.publish("notes", "changed")).toBe(0);
  });

  it("says why it was refused", async () => {
    const { connection } = page(
      hub((c) => (c === "secret" ? "Not yours." : true)),
      person("u1", "Ely"),
    );
    const channel = connection.channel("secret");
    channel.subscribe(() => {});
    await settle();
    expect(channel.getSnapshot()).toMatchObject({ status: "denied", reason: "Not yours." });
  });

  it("shows who is on a channel as people come and go, and passes messages between pages", async () => {
    const h = hub();
    const a = page(h, person("u1", "Ely"));
    const b = page(h, person("u2", "Sam"));
    const ca = a.connection.channel("note:n1");
    const cb = b.connection.channel("note:n1");
    ca.subscribe(() => {});
    await settle();
    expect(ca.getSnapshot().presence.map((p) => p.name)).toEqual(["Ely"]);
    const stop = cb.subscribe(() => {});
    await settle();
    expect(
      ca
        .getSnapshot()
        .presence.map((p) => p.name)
        .sort(),
    ).toEqual(["Ely", "Sam"]);
    cb.send("typing", { on: true });
    await settle();
    expect(ca.getSnapshot().messages[0]).toMatchObject({ event: "typing", from: { name: "Sam" } });
    stop();
    b.connection.close();
    await settle();
    expect(ca.getSnapshot().presence.map((p) => p.name)).toEqual(["Ely"]);
  });

  it("comes back by itself after the socket drops, and joins its channels again", async () => {
    const h = hub();
    const { connection, sockets } = page(h, person("u1", "Ely"));
    const channel = connection.channel("notes");
    channel.subscribe(() => {});
    await settle();
    sockets[0]!.close();
    expect(channel.getSnapshot().status).toBe("connecting");
    await new Promise((r) => setTimeout(r, 30));
    expect(sockets.length).toBe(2);
    expect(channel.getSnapshot().status).toBe("subscribed");
    expect(h.publish("notes", "changed")).toBe(1);
  });
});

describe("realtimeUrl", () => {
  it("is the tool's own address over ws or wss, with the token", () => {
    expect(realtimeUrl("/t/notes", "tok", "https://acme.forgeron.app/t/notes/")).toBe(
      "wss://acme.forgeron.app/t/notes/_f/realtime?token=tok",
    );
    expect(realtimeUrl("", "local:a@b.fr", "http://127.0.0.1:8787/?as=x")).toBe(
      "ws://127.0.0.1:8787/_f/realtime?token=local%3Aa%40b.fr",
    );
  });
});
