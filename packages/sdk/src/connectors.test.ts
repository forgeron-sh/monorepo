import { describe, expect, it } from "vitest";
import {
  checkConnectorDeclaration,
  type ConnectorDeclaration,
  createConnectorClient,
  defineConnector,
  ToolError,
} from "./index";
import { mockConnector, mockFetch } from "./testing";

const demo = defineConnector({
  type: "demo",
  hosts: ["api.demo.test", "*.cdn.demo.test"],
  modes: ["delegated", "application"],
  scopes: ["read", "write"],
  client: (fetch) => ({
    items: async () => (await fetch("https://api.demo.test/items")).json(),
  }),
});

const declaration: ConnectorDeclaration = {
  type: "demo",
  mode: "delegated",
  scopes: ["read"],
  why: "x",
};

describe("defineConnector", () => {
  it("refuses a malformed type or no mode", () => {
    expect(() => defineConnector({ ...demo, type: "Demo" })).toThrow(/must match/);
    expect(() => defineConnector({ ...demo, modes: [] })).toThrow(/no mode/);
  });
});

describe("checkConnectorDeclaration", () => {
  it("accepts a valid declaration", () => {
    expect(checkConnectorDeclaration(demo, declaration)).toEqual([]);
  });
  it("reports type, mode and scope problems", () => {
    const only = defineConnector({ ...demo, modes: ["application"] });
    const problems = checkConnectorDeclaration(only, {
      ...declaration,
      type: "other",
      scopes: ["admin"],
    });
    expect(problems).toHaveLength(3);
  });
});

describe("createConnectorClient", () => {
  const session = (fetch = mockFetch({})) => ({
    mode: "delegated" as const,
    scopes: ["read"],
    token: async () => "tok",
    fetch,
  });

  it("exposes the official client and the authenticated fetch", async () => {
    const upstream = mockFetch({ "GET https://api.demo.test/items": [1, 2] });
    const client = createConnectorClient(demo, declaration, session(upstream));
    expect(await client.items()).toEqual([1, 2]);
    await client.fetch("https://api.demo.test/items", { headers: { accept: "json" } });
    expect(upstream.calls[1]!.headers).toEqual({ accept: "json", authorization: "Bearer tok" });
  });

  it("is only an authenticated fetch when there is no official client", () => {
    const bare = defineConnector({ ...demo, client: undefined });
    const client = createConnectorClient(bare, declaration, session());
    expect(Object.keys(client).sort()).toEqual(["fetch", "mode", "scopes"]);
  });

  it("refuses hosts outside the connector, wildcards included", async () => {
    const upstream = mockFetch({ "GET https://img.cdn.demo.test/a": "ok" });
    const client = createConnectorClient(demo, declaration, session(upstream));
    await expect(client.fetch("https://img.cdn.demo.test/a")).resolves.toMatchObject({ ok: true });
    await expect(client.fetch("https://evil.test/")).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(upstream.calls).toHaveLength(1);
  });

  it("refuses an invalid declaration or a session of another mode", () => {
    expect(() =>
      createConnectorClient(demo, { ...declaration, scopes: ["admin"] }, session()),
    ).toThrow(ToolError);
    expect(() =>
      createConnectorClient(demo, { ...declaration, mode: "application" }, session()),
    ).toThrow(/session is "delegated"/);
  });

  it("takes the hosts from the session when they depend on it", async () => {
    const dynamic = defineConnector({
      ...demo,
      hosts: () => ["odoo.example.test"],
      client: undefined,
    });
    const client = createConnectorClient(
      dynamic,
      declaration,
      session(mockFetch({ "GET https://odoo.example.test/": 1 })),
    );
    await expect(client.fetch("https://odoo.example.test/")).resolves.toMatchObject({ ok: true });
    await expect(client.fetch("https://api.demo.test/")).rejects.toThrow(/does not reach/);
  });
});

describe("mockConnector", () => {
  it("fakes the token and the upstream", async () => {
    const fetch = mockFetch({ "GET https://api.demo.test/items": [] });
    const client = mockConnector(demo, { fetch, mode: "application" });
    expect(client.mode).toBe("application");
    await client.items();
    expect(fetch.calls[0]!.headers.authorization).toBe("Bearer test-token");
  });
});
