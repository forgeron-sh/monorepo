import { describe, expect, it } from "vitest";
import { checkConnectorDeclaration } from "@forgeron/sdk";
import { mockConnector, mockFetch, reply } from "@forgeron/sdk/testing";
import { microsoft365 } from "./index";

const graphUrl = "https://graph.microsoft.com/v1.0";

describe("microsoft-365 connector", () => {
  it("gets and posts with the token, as JSON", async () => {
    const fetch = mockFetch({
      [`GET ${graphUrl}/me`]: { displayName: "Ada" },
      [`POST ${graphUrl}/me/sendMail`]: reply(202, ""),
    });
    const { graph } = mockConnector(microsoft365, { fetch, token: "fake-token" });
    expect(await graph.get("/me")).toEqual({ displayName: "Ada" });
    await graph.post("/me/sendMail", { message: { subject: "Hi" } });
    expect(fetch.calls[0]!.headers.authorization).toBe("Bearer fake-token");
    expect(fetch.calls[1]!.json()).toEqual({ message: { subject: "Hi" } });
  });

  it("follows @odata.nextLink when listing", async () => {
    const next = `${graphUrl}/me/messages?$skiptoken=2`;
    const fetch = mockFetch({
      [`GET ${graphUrl}/me/messages`]: { value: [1], "@odata.nextLink": next },
      [`GET ${next}`]: { value: [2, 3] },
    });
    const { graph } = mockConnector(microsoft365, { fetch });
    expect(await graph.list("/me/messages")).toEqual([1, 2, 3]);
  });

  it("deletes and patches", async () => {
    const fetch = mockFetch({
      [`DELETE ${graphUrl}/me/events/1`]: reply(204, ""),
      [`PATCH ${graphUrl}/me/events/2`]: { id: "2" },
    });
    const { graph } = mockConnector(microsoft365, { fetch });
    await expect(graph.delete("/me/events/1")).resolves.toBeUndefined();
    expect(await graph.patch("/me/events/2", { subject: "x" })).toEqual({ id: "2" });
  });

  it("translates Graph errors", async () => {
    const fetch = mockFetch({
      [`GET ${graphUrl}/a`]: reply(404, { error: { message: "Not here" } }),
      [`GET ${graphUrl}/b`]: reply(403, {}),
      [`GET ${graphUrl}/c`]: reply(429, ""),
      [`GET ${graphUrl}/d`]: reply(500, "oops"),
    });
    const { graph } = mockConnector(microsoft365, { fetch });
    await expect(graph.get("/a")).rejects.toMatchObject({ code: "NOT_FOUND", message: "Not here" });
    await expect(graph.get("/b")).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(graph.get("/c")).rejects.toMatchObject({ code: "RATE_LIMITED" });
    await expect(graph.get("/d")).rejects.toMatchObject({ code: "UPSTREAM" });
  });

  it("reaches only graph.microsoft.com", async () => {
    const client = mockConnector(microsoft365, { fetch: mockFetch({}) });
    await expect(client.fetch("https://evil.test/")).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(client.graph.get("https://evil.test/x")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("checks declarations", () => {
    const ok = {
      type: "microsoft-365",
      mode: "delegated",
      scopes: ["Mail.Send"],
      why: "x",
    } as const;
    expect(checkConnectorDeclaration(microsoft365, { ...ok, scopes: ["Mail.Send"] })).toEqual([]);
    expect(checkConnectorDeclaration(microsoft365, { ...ok, scopes: ["Nope.All"] })).toHaveLength(
      1,
    );
  });
});
