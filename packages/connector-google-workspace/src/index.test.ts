import { checkConnectorDeclaration, ToolError } from "@forgeron/sdk";
import { mockConnector, mockFetch } from "@forgeron/sdk/testing";
import { describe, expect, it } from "vitest";
import { googleWorkspace } from "./index";

const gmail = "https://www.googleapis.com/auth/gmail.readonly";

describe("google-workspace connector", () => {
  it("accepts a declaration in either mode with known scopes", () => {
    for (const mode of ["delegated", "application"] as const) {
      const declaration = { type: "google-workspace", mode, scopes: [gmail], why: "x" };
      expect(checkConnectorDeclaration(googleWorkspace, declaration)).toEqual([]);
    }
  });

  it("refuses an unknown scope", () => {
    const problems = checkConnectorDeclaration(googleWorkspace, {
      type: "google-workspace",
      mode: "delegated",
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      why: "x",
    });
    expect(problems).toHaveLength(1);
  });

  it("calls the simulated upstream with the bearer token", async () => {
    const url = "https://gmail.googleapis.com/gmail/v1/users/me/messages";
    const upstream = mockFetch({ [`GET ${url}`]: { messages: [{ id: "m1" }] } });
    const google = mockConnector(googleWorkspace, { fetch: upstream, token: "fake" });

    const response = await google.fetch(url);

    expect(await response.json()).toEqual({ messages: [{ id: "m1" }] });
    expect(upstream.calls[0]?.headers.authorization).toBe("Bearer fake");
  });

  it("refuses a host outside the Google APIs", async () => {
    const google = mockConnector(googleWorkspace);
    await expect(google.fetch("https://example.com/x")).rejects.toBeInstanceOf(ToolError);
    await expect(google.fetch("https://googleapis.com.evil.test/x")).rejects.toBeInstanceOf(
      ToolError,
    );
  });
});
