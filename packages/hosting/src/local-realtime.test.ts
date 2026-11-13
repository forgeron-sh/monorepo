import type { Manifest } from "@forgeron/manifest";
import { afterEach, describe, expect, it } from "vitest";
import { WebSocket } from "ws";
import type { Build, Environment } from "./index";
import { createLocalHosting, type LocalHosting } from "./local";
import { readPublished } from "./local-realtime";

// Realtime in the local host (D-135): a page's WebSocket, the rules of the manifest, and what an action
// publishes (`x-forgeron-realtime`) reaching the people listening and not the caller.

const worker = `
export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/api/notes.add") {
      const list = [{ channel: "notes", event: "changed" }, { channel: "note:n1", event: "changed", payload: { id: "n1" } }];
      return new Response("{}", { headers: { "content-type": "application/json", "x-forgeron-realtime": btoa(unescape(encodeURIComponent(JSON.stringify(list)))) } });
    }
    if (url.pathname === "/_f/call/notes.canJoin") {
      const input = await request.json();
      return Response.json(input.id === "n1");
    }
    return Response.json({});
  },
};`;

const manifest = {
  name: "notes",
  version: "1.0.0",
  profiles: { member: { grants: ["read", "write"], default: true } },
  actions: {},
  views: {},
  resources: {},
  realtime: {
    channels: {
      notes: { access: "read" },
      note: { access: "read", presence: true, authorize: "notes.canJoin" },
    },
  },
} as unknown as Manifest;
const environment: Environment = { tool: "notes", name: "local" };
const build: Build = { manifest, worker, fingerprint: "v1" };

let hosting: LocalHosting | undefined;
afterEach(async () => {
  await hosting?.close();
  hosting = undefined;
});

const start = async () => {
  hosting = createLocalHosting({
    identity: () => ({ id: "dev", email: "dev@localhost", name: "Dev", subjects: ["everyone"] }),
    identityFor: (_m, email) =>
      email === "sam@acme.fr"
        ? { id: "sam", email, name: "Sam", subjects: ["everyone"] }
        : undefined,
  });
  const provisioned = await hosting.provision(environment, manifest);
  const { url } = await hosting.activate(await hosting.upload(provisioned, build));
  return url;
};

const connect = (url: string, token: string) =>
  new Promise<{ ws: WebSocket; messages: Array<Record<string, unknown>> }>((resolve, reject) => {
    const ws = new WebSocket(
      `${url.replace("http", "ws")}/_f/realtime?token=${encodeURIComponent(token)}`,
    );
    const messages: Array<Record<string, unknown>> = [];
    ws.on("message", (data) => messages.push(JSON.parse(data.toString())));
    ws.on("open", () => resolve({ ws, messages }));
    ws.on("error", reject);
  });
const wait = (ms = 80) => new Promise((r) => setTimeout(r, ms));

describe("local realtime", () => {
  it("refuses a socket whose token it does not know", async () => {
    const url = await start();
    await expect(connect(url, "nope")).rejects.toBeDefined();
  });

  it("lets a person follow a channel, and tells them what an action published, not the caller", async () => {
    const url = await start();
    const { ws, messages } = await connect(url, "local:dev@localhost");
    ws.send(JSON.stringify({ t: "subscribe", channel: "notes" }));
    await wait();
    const answer = await fetch(`${url}/api/notes.add`, { method: "POST" });
    expect(answer.headers.get("x-forgeron-realtime")).toBeNull();
    await wait();
    expect(messages.filter((m) => m.t === "message")).toEqual([
      expect.objectContaining({ channel: "notes", event: "changed" }),
    ]);
    ws.close();
  });

  it("asks the tool before letting a person into one note, as that person", async () => {
    const url = await start();
    const { ws, messages } = await connect(url, "local:sam@acme.fr");
    ws.send(JSON.stringify({ t: "subscribe", channel: "note:n1" }));
    ws.send(JSON.stringify({ t: "subscribe", channel: "note:n2" }));
    ws.send(JSON.stringify({ t: "subscribe", channel: "ghost" }));
    await wait(200);
    expect(messages.filter((m) => m.t === "subscribed").map((m) => m.channel)).toEqual(["note:n1"]);
    expect(
      messages
        .filter((m) => m.t === "denied")
        .map((m) => m.channel)
        .sort(),
    ).toEqual(["ghost", "note:n2"]);
    expect(messages.find((m) => m.channel === "note:n1" && m.t === "subscribed")).toMatchObject({
      presence: [{ id: "sam", name: "Sam" }],
    });
    ws.close();
  });
});

describe("readPublished", () => {
  it("reads the header an action's response carries, and nothing from a broken one", () => {
    const list = [{ channel: "notes", event: "changed" }];
    const header = btoa(unescape(encodeURIComponent(JSON.stringify(list))));
    expect(readPublished(new Headers({ "x-forgeron-realtime": header }))).toEqual(list);
    expect(readPublished(new Headers({ "x-forgeron-realtime": "%%%" }))).toEqual([]);
    expect(readPublished(new Headers())).toEqual([]);
  });
});
