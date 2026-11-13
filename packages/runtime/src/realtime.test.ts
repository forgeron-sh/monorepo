import type { Manifest } from "@forgeron/manifest";
import { describe, expect, it } from "vitest";
import {
  authorizeChannel,
  MAX_PAYLOAD_BYTES,
  RealtimeHub,
  type RealtimePerson,
  type ServerMessage,
} from "./realtime";

class FakeSocket {
  out: ServerMessage[] = [];
  send(data: string) {
    this.out.push(JSON.parse(data) as ServerMessage);
  }
  close() {}
  of<T extends ServerMessage["t"]>(t: T) {
    return this.out.filter((m): m is Extract<ServerMessage, { t: T }> => m.t === t);
  }
}

const ely: RealtimePerson = { id: "u1", email: "ely@acme.fr", name: "Ely" };
const sam: RealtimePerson = {
  id: "u2",
  email: "sam@acme.fr",
  name: "Sam",
  avatar: "https://x/s.png",
};
let clock = 0;

const hub = (
  rules: (person: RealtimePerson, channel: string, kind: string) => true | string = () => true,
) =>
  new RealtimeHub({
    authorize: async (p, c, k) => rules(p, c, k),
    presence: (c) => c.startsWith("note:"),
    now: () => new Date(Date.UTC(2026, 10, 12, 10, 0, 0) + clock),
  });

const join = (h: RealtimeHub, person: RealtimePerson) => {
  const socket = new FakeSocket();
  return { socket, c: h.connect(socket, person) };
};
const say = (c: { receive(raw: string): Promise<void> }, message: unknown) =>
  c.receive(JSON.stringify(message));

describe("the realtime hub", () => {
  it("says it is ready, subscribes after the rule agrees, and tells why it refuses", async () => {
    const h = hub((_p, c) => (c === "secret" ? "Not for you." : true));
    const { socket, c } = join(h, ely);
    expect(socket.out[0]).toEqual({ t: "ready" });
    await say(c, { t: "subscribe", channel: "notes" });
    await say(c, { t: "subscribe", channel: "secret" });
    await say(c, { t: "subscribe", channel: "Bad Name" });
    expect(socket.of("subscribed").map((m) => m.channel)).toEqual(["notes"]);
    expect(socket.of("denied").map((m) => m.reason)).toEqual([
      "Not for you.",
      "Not a channel name.",
    ]);
  });

  it("delivers what the tool publishes to the people on the channel, and to nobody else", async () => {
    const h = hub();
    const a = join(h, ely);
    const b = join(h, sam);
    await say(a.c, { t: "subscribe", channel: "notes" });
    expect(h.publish("notes", "changed", { id: "n1" })).toBe(1);
    expect(a.socket.of("message")[0]).toMatchObject({
      channel: "notes",
      event: "changed",
      payload: { id: "n1" },
    });
    expect(b.socket.of("message")).toEqual([]);
    h.publishAll([
      { channel: "notes", event: "changed" },
      { channel: "bad name", event: "x" },
      { channel: "notes", event: "big", payload: "x".repeat(MAX_PAYLOAD_BYTES + 1) },
    ]);
    expect(a.socket.of("message")).toHaveLength(2);
  });

  it("lets a page send to the others when the tool allows it, never to people who did not subscribe", async () => {
    const h = hub((_p, _c, kind) => (kind === "send" ? true : true));
    const a = join(h, ely);
    const b = join(h, sam);
    await say(a.c, { t: "subscribe", channel: "note:n1" });
    await say(b.c, { t: "subscribe", channel: "note:n1" });
    await say(a.c, { t: "send", channel: "note:n1", event: "typing", payload: { on: true } });
    expect(b.socket.of("message")[0]).toMatchObject({
      event: "typing",
      from: { id: "u1", name: "Ely" },
    });
    expect(a.socket.of("message")).toEqual([]);
    await say(a.c, { t: "send", channel: "note:n1", event: "echo", self: true });
    expect(a.socket.of("message")).toHaveLength(1);
    const outsider = join(h, { id: "u3", email: "x@acme.fr", name: "X" });
    await say(outsider.c, { t: "send", channel: "note:n1", event: "hi" });
    expect(outsider.socket.of("denied")[0]!.reason).toBe("Subscribe first.");
  });

  it("refuses a send the tool does not allow, and too many, and too big", async () => {
    const h = hub((_p, _c, kind) => (kind === "send" ? "Read only." : true));
    const a = join(h, ely);
    await say(a.c, { t: "subscribe", channel: "notes" });
    await say(a.c, { t: "send", channel: "notes", event: "x" });
    expect(a.socket.of("denied")[0]!.reason).toBe("Read only.");
    const loud = hub();
    const b = join(loud, ely);
    await say(b.c, { t: "subscribe", channel: "notes" });
    await say(b.c, {
      t: "send",
      channel: "notes",
      event: "x",
      payload: "x".repeat(MAX_PAYLOAD_BYTES + 1),
    });
    for (let i = 0; i < 40; i++) await say(b.c, { t: "send", channel: "notes", event: "x" });
    expect(
      b.socket
        .of("error")
        .map((m) => m.message)
        .join(" "),
    ).toContain("8 KB");
    expect(
      b.socket
        .of("error")
        .map((m) => m.message)
        .join(" "),
    ).toContain("slow down");
  });

  it("lists who is on a channel, says who comes and goes, and counts a person once whatever their tabs", async () => {
    const h = hub();
    const a = join(h, ely);
    const b = join(h, sam);
    await say(a.c, { t: "subscribe", channel: "note:n1" });
    expect(a.socket.of("subscribed")[0]!.presence).toEqual([{ id: "u1", name: "Ely" }]);
    await say(b.c, { t: "subscribe", channel: "note:n1" });
    expect(
      b.socket
        .of("subscribed")[0]!
        .presence?.map((p) => p.id)
        .sort(),
    ).toEqual(["u1", "u2"]);
    expect(a.socket.of("presence")[0]).toEqual({
      t: "presence",
      channel: "note:n1",
      joins: [{ id: "u2", name: "Sam", avatar: "https://x/s.png" }],
      leaves: [],
    });
    const second = join(h, sam);
    await say(second.c, { t: "subscribe", channel: "note:n1" });
    expect(a.socket.of("presence")).toHaveLength(1);
    b.c.close();
    expect(a.socket.of("presence")).toHaveLength(1);
    second.c.close();
    expect(a.socket.of("presence")[1]).toMatchObject({ leaves: ["u2"] });
    await say(a.c, { t: "track", channel: "note:n1", state: { cursor: 3 } });
    expect(h.presenceOf("note:n1")).toEqual([{ id: "u1", name: "Ely", state: { cursor: 3 } }]);
    expect(a.socket.of("presence").at(-1)).toMatchObject({ joins: [{ state: { cursor: 3 } }] });
  });

  it("lists nobody on a channel without presence, and answers a ping and a broken message", async () => {
    const h = hub();
    const a = join(h, ely);
    await say(a.c, { t: "subscribe", channel: "notes" });
    expect(a.socket.of("subscribed")[0]!.presence).toBeUndefined();
    await say(a.c, { t: "ping" });
    await a.c.receive("not json");
    expect(a.socket.of("pong")).toHaveLength(1);
    expect(a.socket.of("error")).toHaveLength(1);
  });
});

describe("authorizeChannel", () => {
  const manifest = {
    profiles: {
      member: { grants: ["read", "write"], default: true },
      viewer: { grants: ["read"] },
    },
    realtime: {
      channels: {
        notes: { access: "read" },
        note: { access: "read", send: "write", presence: true, authorize: "notes.canJoin" },
        admin: { access: "admin" },
      },
    },
  } as unknown as Manifest;
  // A person who is given a profile's permissions as `everyone`.
  const user = (profile: "member" | "viewer") => ({
    id: "u1",
    email: "e@x.fr",
    name: "E",
    subjects: ["everyone"],
    permissions: { everyone: [...manifest.profiles[profile]!.grants] },
  });
  const ask = (
    channel: string,
    profile: "member" | "viewer",
    kind: "subscribe" | "send",
    answer: unknown = true,
  ) =>
    authorizeChannel({
      manifest,
      user: user(profile),
      channel,
      kind,
      callAction: async () => answer,
    });

  it("needs the channel declared and the level it asks", async () => {
    expect(await ask("notes", "viewer", "subscribe")).toBe(true);
    expect(await ask("ghost", "member", "subscribe")).toContain("no channel");
    expect(await ask("admin", "member", "subscribe")).toContain("admin");
  });

  it("lets a page send only when the channel says who may, with its own level", async () => {
    expect(await ask("notes", "member", "send")).toContain("only the tool publishes");
    expect(await ask("note:n1", "viewer", "send")).toContain("write");
    expect(await ask("note:n1", "member", "send")).toBe(true);
  });

  it("asks the tool's action for an instance, and refuses when it says no or fails", async () => {
    expect(await ask("note:n1", "member", "subscribe", { allowed: true })).toBe(true);
    expect(await ask("note:n1", "member", "subscribe", false)).toContain("does not let you in");
    const failing = await authorizeChannel({
      manifest,
      user: user("member"),
      channel: "note:n1",
      kind: "subscribe",
      callAction: async () => {
        throw new Error("boom");
      },
    });
    expect(failing).toContain("does not let you in");
    expect(await ask("note", "member", "subscribe")).toBe(true);
  });
});
