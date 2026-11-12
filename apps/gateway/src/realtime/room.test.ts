import { describe, expect, it } from "vitest";
import { CONTEXT_HEADER, createRoom, type RoomContext, type RoomSocket } from "./room";

class Server implements RoomSocket {
  out: Array<Record<string, unknown>> = [];
  private readonly listeners: Record<string, Array<(e: { data: unknown }) => void>> = {};
  accepted = false;
  accept() {
    this.accepted = true;
  }
  send(data: string) {
    this.out.push(JSON.parse(data));
  }
  close() {}
  addEventListener(type: string, listener: (e: { data: unknown }) => void) {
    (this.listeners[type] ??= []).push(listener);
  }
  /** The page says something. */
  say(message: unknown) {
    this.listeners.message?.forEach((l) => l({ data: JSON.stringify(message) }));
  }
  drop() {
    this.listeners.close?.forEach((l) => l({ data: undefined }));
  }
}

const context = (id: string, roles = ["member"]): RoomContext => ({
  user: { id, email: `${id}@acme.fr`, name: id.toUpperCase(), roles },
  manifest: {
    roles: { member: { grants: ["read", "write"], default: true } },
    realtime: {
      channels: {
        notes: { access: "read" },
        note: { access: "read", send: "write", presence: true, authorize: "notes.canJoin" },
      },
    },
  } as RoomContext["manifest"],
  worker: "acme--notes--production",
});

const setup = (allowed: (input: unknown) => unknown = () => true) => {
  const asked: Array<{ url: string; user: string | null; body: unknown }> = [];
  const servers: Server[] = [];
  const room = createRoom({
    pair: () => {
      const server = new Server();
      servers.push(server);
      return { client: { page: servers.length }, server };
    },
    target: (worker) =>
      worker === "acme--notes--production"
        ? {
            fetch: async (request: Request) => {
              asked.push({
                url: request.url,
                user: request.headers.get("x-forgeron-user"),
                body: await request.json(),
              });
              return Response.json(allowed(asked.at(-1)!.body));
            },
          }
        : undefined,
    now: () => new Date("2026-11-12T10:00:00Z"),
  });
  const connect = (ctx: RoomContext) =>
    room.fetch(
      new Request("https://room/connect", {
        headers: { upgrade: "websocket", [CONTEXT_HEADER]: JSON.stringify(ctx) },
      }),
    );
  return { room, asked, servers, connect };
};
const tick = () => new Promise((r) => setTimeout(r, 0));

describe("a tool channel's room", () => {
  it("takes a WebSocket from the gateway with the person's identity, and refuses anything else", async () => {
    const { room, servers, connect } = setup();
    const answer = await connect(context("u1"));
    expect(answer.status).toBe(200);
    expect((answer as unknown as { client: unknown }).client).toEqual({ page: 1 });
    expect(servers[0]!.accepted).toBe(true);
    expect(servers[0]!.out[0]).toEqual({ t: "ready" });
    expect((await room.fetch(new Request("https://room/connect"))).status).toBe(426);
    const noIdentity = await room.fetch(
      new Request("https://room/connect", { headers: { upgrade: "websocket" } }),
    );
    expect(noIdentity.status).toBe(400);
    expect((await room.fetch(new Request("https://room/elsewhere"))).status).toBe(404);
  });

  it("lets a person join a channel the matrix allows, and asks the tool about an instance as that person", async () => {
    const { servers, asked, connect } = setup();
    await connect(context("u1"));
    servers[0]!.say({ t: "subscribe", channel: "notes" });
    servers[0]!.say({ t: "subscribe", channel: "note:n1" });
    await tick();
    await tick();
    expect(servers[0]!.out.filter((m) => m.t === "subscribed").map((m) => m.channel)).toEqual([
      "notes",
      "note:n1",
    ]);
    expect(asked).toHaveLength(1);
    expect(asked[0]!.url).toBe("https://tool.internal/_f/call/notes.canJoin");
    expect(JSON.parse(asked[0]!.user!)).toMatchObject({ id: "u1", roles: ["member"] });
    expect(asked[0]!.body).toMatchObject({ channel: "note:n1", id: "n1", kind: "subscribe" });
  });

  it("refuses an instance the tool does not allow, and a channel the tool did not declare", async () => {
    const { servers, connect } = setup(() => false);
    await connect(context("u1"));
    servers[0]!.say({ t: "subscribe", channel: "note:n1" });
    servers[0]!.say({ t: "subscribe", channel: "other" });
    await tick();
    await tick();
    expect(
      servers[0]!.out
        .filter((m) => m.t === "denied")
        .map((m) => m.reason)
        .sort(),
    ).toEqual(["The tool does not let you in.", 'The tool has no channel "other".']);
  });

  it("delivers what the gateway says the tool published, to the people on the channel only", async () => {
    const { room, servers, connect } = setup();
    await connect(context("u1"));
    await connect(context("u2"));
    servers[0]!.say({ t: "subscribe", channel: "notes" });
    await tick();
    await room.fetch(
      new Request("https://room/publish", {
        method: "POST",
        body: JSON.stringify([
          { channel: "notes", event: "changed" },
          { channel: "bad name", event: "x" },
        ]),
      }),
    );
    expect(servers[0]!.out.filter((m) => m.t === "message")).toHaveLength(1);
    expect(servers[1]!.out.filter((m) => m.t === "message")).toHaveLength(0);
  });

  it("lists who is on a channel and forgets them when their socket closes", async () => {
    const { room, servers, connect } = setup();
    await connect(context("u1"));
    await connect(context("u2"));
    servers[0]!.say({ t: "subscribe", channel: "note:n1" });
    servers[1]!.say({ t: "subscribe", channel: "note:n1" });
    await tick();
    await tick();
    await tick();
    expect(
      room.hub
        .presenceOf("note:n1")
        .map((p) => p.id)
        .sort(),
    ).toEqual(["u1", "u2"]);
    servers[1]!.drop();
    expect(room.hub.presenceOf("note:n1").map((p) => p.id)).toEqual(["u1"]);
  });
});
