import { describe, expect, it } from "vitest";
import { ToolError } from "../index";
import { createTestTool, mockFetch, reply } from "./index";

const dir = new URL("../../fixtures/tool", import.meta.url).pathname;
const create = (options: Parameters<typeof createTestTool>[0] = {}) =>
  createTestTool({ dir, ...options });

describe("createTestTool", () => {
  it("tells the developer to build when there is nothing to load", async () => {
    await expect(createTestTool({ dir: "/nowhere" })).rejects.toThrow(/build the tool first/);
  });

  it("calls an action, whatever the interfaces the tool exposes", async () => {
    const tool = await create();
    // `interfaces` of this tool is MCP only: a test still reaches every action.
    await expect(tool.call("notes.info")).resolves.toMatchObject({ env: "local" });
  });

  it("runs as every role of the tool unless told otherwise", async () => {
    const tool = await create();
    await expect(tool.call("notes.info")).resolves.toMatchObject({
      user: { email: "test@example.com", roles: ["reader", "editor"] },
    });
  });

  it("gives the action what the test provided", async () => {
    const tool = await create({
      secrets: { API_KEY: "k" },
      as: { email: "ely@acme.fr", roles: ["reader"], userSecrets: { LOGIN: "ely" } },
      env: "preview",
    });
    expect(await tool.call("notes.info")).toMatchObject({
      user: { id: "user:ely@acme.fr", email: "ely@acme.fr", name: "ely@acme.fr" },
      secret: "k",
      login: "ely",
      env: "preview",
    });
  });

  it("freezes the clock", async () => {
    const tool = await create({ now: "2026-10-20T09:00:00+02:00" });
    expect(await tool.call("notes.info")).toMatchObject({ now: "2026-10-20T07:00:00.000Z" });
  });

  describe("access and validation", () => {
    it("checks access", async () => {
      const tool = await create({ as: { roles: ["reader"] } });
      await expect(tool.call("notes.add", { text: "x" })).rejects.toMatchObject({
        name: "ToolError",
        code: "FORBIDDEN",
      });
    });

    it("validates the input", async () => {
      const tool = await create({ as: { roles: ["editor"] } });
      const error = await tool.call("notes.add", { text: "" }).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ToolError);
      expect(error).toMatchObject({ code: "INVALID" });
    });

    it("rejects an unknown action", async () => {
      const tool = await create();
      await expect(tool.call("notes.nope")).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("throws the ToolError of the action", async () => {
      const tool = await create();
      await expect(tool.call("notes.denied")).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Not yours",
      });
    });

    it("throws the original error of an action that crashed, not a generic one", async () => {
      const tool = await create();
      const error = await tool.call("notes.crash").catch((e: unknown) => e);
      expect(error).toBeInstanceOf(RangeError);
      expect(error).toMatchObject({ message: "boom" });
    });
  });

  describe("as", () => {
    it("calls as another person, without changing the first", async () => {
      const tool = await create({ as: { roles: ["editor"] } });
      const reader = tool.as({ roles: ["reader"] });
      await expect(reader.call("notes.add", { text: "x" })).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      expect(await tool.call("notes.info")).toMatchObject({ user: { roles: ["editor"] } });
    });

    it("keeps what the test gave, and replaces what it overrides", async () => {
      const tool = await create({ as: { email: "a@x.fr", roles: ["reader"] } });
      expect(await tool.as({ roles: ["editor"] }).call("notes.info")).toMatchObject({
        user: { email: "a@x.fr", roles: ["editor"] },
      });
    });

    it("shares the emitted events", async () => {
      const tool = await create({
        fetch: mockFetch({ "POST https://api.example.com/notes": { id: 1 } }),
      });
      await tool.as({ email: "b@x.fr" }).call("notes.add", { text: "x" });
      expect(tool.events).toEqual([{ event: "note.added", payload: { id: 1 } }]);
    });
  });

  describe("upstreams", () => {
    it("reaches the upstream through mockFetch and records the events", async () => {
      const fetch = mockFetch({ "POST https://api.example.com/notes": { id: 7, text: "x" } });
      const tool = await create({ fetch });
      expect(await tool.call("notes.add", { text: "x" })).toEqual({ id: 7, text: "x" });
      expect(tool.events).toEqual([{ event: "note.added", payload: { id: 7 } }]);
      expect(fetch.calls[0]).toMatchObject({
        method: "POST",
        url: "https://api.example.com/notes",
      });
      expect(fetch.calls[0]?.json()).toEqual({ text: "x" });
    });

    it("fails when no upstream was provided, rather than reaching the network", async () => {
      const tool = await create();
      await expect(tool.call("notes.add", { text: "x" })).rejects.toThrow(/mockFetch/);
    });

    it("still filters the hosts by the tool's network resources", async () => {
      // The route exists, but the tool never declared this host: that is what is tested.
      const fetch = mockFetch({ "GET https://evil.test/": { leaked: true } });
      const tool = await create({ fetch });
      await expect(tool.call("notes.leak")).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(fetch.calls).toHaveLength(0);
    });
  });

  describe("tools in `uses`", () => {
    it("calls the stub of another tool", async () => {
      const tool = await create({
        as: { email: "ely@acme.fr" },
        tools: { crm: { "deals.list": async (input) => [{ asked: input }] } },
      });
      expect(await tool.call("notes.crm")).toEqual([{ asked: { owner: "ely@acme.fr" } }]);
    });

    it("fails on an action nobody stubbed", async () => {
      const tool = await create({ tools: { crm: {} } });
      await expect(tool.call("notes.crm")).rejects.toThrow(/No stub for crm.deals.list/);
    });
  });

  describe("cache", () => {
    it("is per person by default and shared when the action says `tool`", async () => {
      const tool = await create();
      const first = await tool.as({ email: "a@x.fr" }).call("notes.counter", { scope: "user" });
      const again = await tool.as({ email: "a@x.fr" }).call("notes.counter", { scope: "user" });
      const other = await tool.as({ email: "b@x.fr" }).call("notes.counter", { scope: "user" });
      expect(again).toBe(first);
      expect(other).not.toBe(first);
      const shared = await tool.as({ email: "a@x.fr" }).call("notes.counter", { scope: "tool" });
      expect(await tool.as({ email: "b@x.fr" }).call("notes.counter", { scope: "tool" })).toBe(
        shared,
      );
    });

    it("starts empty for each test tool", async () => {
      const one = await (await create()).call("notes.counter", { scope: "tool" });
      const two = await (await create()).call("notes.counter", { scope: "tool" });
      expect(two).not.toBe(one);
    });
  });
});

describe("mockFetch", () => {
  const fetch = mockFetch({
    "GET https://api.example.com/x": { ok: true },
    "GET https://api.example.com/search": { hits: 0 },
    "POST https://api.example.com/echo": (request) => ({ got: request.json() }),
    "GET https://api.example.com/missing": reply(404, { error: "not found" }),
    "GET https://api.example.com/text": "plain",
  });

  it("answers a body with a 200", async () => {
    const res = await fetch("https://api.example.com/x");
    expect(res).toMatchObject({ ok: true, status: 200 });
    expect(await res.json()).toEqual({ ok: true });
  });

  it("matches the method", async () => {
    await expect(fetch("https://api.example.com/echo")).rejects.toThrow(/no route for "GET/);
  });

  it("matches an address with a query string when the route has none", async () => {
    expect(await (await fetch("https://api.example.com/search?q=a")).json()).toEqual({ hits: 0 });
  });

  it("calls a function route with the request", async () => {
    const res = await fetch("https://api.example.com/echo", { method: "post", body: '{"a":1}' });
    expect(await res.json()).toEqual({ got: { a: 1 } });
  });

  it("answers another status with reply()", async () => {
    const res = await fetch("https://api.example.com/missing");
    expect(res).toMatchObject({ ok: false, status: 404 });
    expect(await res.json()).toEqual({ error: "not found" });
  });

  it("answers text as is", async () => {
    expect(await (await fetch("https://api.example.com/text")).text()).toBe("plain");
  });

  it("fails on a call no route matches, and lists the routes", async () => {
    await expect(fetch("https://api.example.com/nope")).rejects.toThrow(
      /routes: GET https:\/\/api/,
    );
  });

  it("records the calls", async () => {
    const own = mockFetch({ "GET https://a.test/": {} });
    await own("https://a.test/", { headers: { "x-k": "v" } });
    expect(own.calls).toEqual([
      expect.objectContaining({ method: "GET", url: "https://a.test/", headers: { "x-k": "v" } }),
    ]);
  });
});
