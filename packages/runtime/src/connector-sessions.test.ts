import type { Manifest } from "@forgeron/manifest";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createRuntime, type ConnectorSessions, type User } from "./index";

// Delegated connectors at run time (D-046): the caller's own access token, or the link to consent.

const manifest: Manifest = {
  name: "mail",
  version: "1.0.0",
  title: "Mail",
  interfaces: { mcp: true, api: true, cli: true, web: true },
  profiles: { reader: { grants: ["read"] } },
  actions: {
    "mail.send": {
      description: "Send a mail.",
      access: "read",
      input: { type: "object", properties: {} },
      confirm: false,
      cli: { args: [] },
      http: { method: "GET" },
      interfaces: ["mcp", "api", "cli", "web"],
    },
  },
  views: {},
  jobs: {},
  events: {},
  resources: {
    connectors: {
      microsoft: {
        type: "microsoft-365",
        mode: "delegated",
        scopes: ["Mail.Send"],
        why: "Send as you",
      },
      odoo: { type: "odoo", mode: "application", scopes: [], why: "Read tickets" },
    },
  },
  uses: {},
  preview: { data: "seed" },
} as unknown as Manifest;

const ana: User = { id: "u1", email: "ana@acme.test", name: "Ana", subjects: ["everyone"] };

function setup(tokens: Record<string, string>) {
  let seen: unknown;
  const sessions: ConnectorSessions = {
    tokens: async () => tokens,
    consentUrl: (name) => `https://acme.forgeron.test/consent/${name}`,
  };
  const runtime = createRuntime({
    manifest,
    authenticate: () => ana,
    platform: {
      connectorSessions: sessions,
      connectorClient: (name, session) => ({ name, mode: session.mode, token: session.token }),
    },
    actions: {
      "mail.send": {
        input: z.object({}),
        run: async (ctx) => {
          const microsoft = ctx.connectors.microsoft as { token(): Promise<string> };
          seen = { keys: Object.keys(ctx.connectors), token: await microsoft.token() };
          return { ok: true };
        },
      },
    },
  });
  return { runtime, seen: () => seen };
}

const call = () => new Request("https://acme.forgeron.test/api/mail.send");

describe("delegated connectors on first use", () => {
  it("answers 428 with the consent link when the caller has not consented", async () => {
    const { runtime } = setup({});
    const response = await runtime.fetch(call());
    expect(response.status).toBe(428);
    const body = (await response.json()) as {
      error: { code: string; details: { consent: boolean; inputUrl: string; missing: unknown[] } };
    };
    expect(body.error.code).toBe("SECRET_REQUIRED");
    expect(body.error.details).toMatchObject({
      consent: true,
      inputUrl: "https://acme.forgeron.test/consent/microsoft",
    });
    expect(body.error.details.missing).toEqual([
      expect.objectContaining({ name: "microsoft", label: "microsoft-365 access" }),
    ]);
  });

  it("MCP 2025-11-25 elicits the consent link", async () => {
    const { runtime } = setup({});
    const answer = (await (
      await runtime.fetch(
        new Request("https://acme.forgeron.test/mcp", {
          method: "POST",
          headers: { "mcp-protocol-version": "2025-11-25" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "tools/call",
            params: { name: "mail_mail_send", arguments: {} },
          }),
        }),
      )
    ).json()) as { error?: { data: { elicitations: Array<{ url: string }> } } };
    expect(answer.error?.data.elicitations[0]?.url).toBe(
      "https://acme.forgeron.test/consent/microsoft",
    );
  });

  it("gives the action the caller's token for the delegated connector only", async () => {
    const { runtime, seen } = setup({ microsoft: "access-token-for-tests" });
    expect((await runtime.fetch(call())).status).toBe(200);
    expect(seen()).toEqual({ keys: ["microsoft"], token: "access-token-for-tests" });
  });
});
