import {
  createConsent,
  createRegistry,
  createSecretBox,
  migratePlatform,
  type Consent,
  type Registry,
} from "@forgeron/registry";
import type { D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleConnections } from "../console-api/connections";
import { handleConsent } from "./consent";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// A throwaway key made of zeros: it protects nothing and is not a secret.
const KEY = btoa(String.fromCharCode(...new Uint8Array(32)));

let memory: MemoryD1;
let registry: Registry;
let consent: Consent;
let person: { id: string } | undefined;
let admin: { admin: boolean } | undefined;

const connectors = {
  microsoft: { type: "microsoft-365", mode: "delegated", scopes: ["Mail.Send"], why: "x" },
  odoo: { type: "odoo", mode: "application", scopes: [], why: "x" },
};

beforeEach(async () => {
  person = { id: "ada@example.test" };
  admin = { admin: true };
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  const box = await createSecretBox(KEY);
  registry = createRegistry(d1, { secrets: box });
  const tool = await registry.createTool({ workspace: "acme", name: "mail" });
  const build = await registry.recordBuild(tool.id, {
    fingerprint: "fp1",
    manifest: { resources: { connectors } },
  });
  await registry.publishVersion(tool.id, build.id, "1.0.0");
  // A simulated identity provider.
  consent = createConsent({
    registry,
    box,
    providers: {
      "microsoft-365": {
        authorizeUrl: "https://idp.example.test/authorize",
        tokenUrl: "https://idp.example.test/token",
        clientId: "client-id",
        clientSecret: "client-secret-for-tests",
        redirectUri: "https://acme.forgeron.test/api/consent/callback",
      },
    },
    fetch: async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        access_token: "access-1",
        refresh_token: "refresh-1",
        expires_in: 3600,
      }),
    }),
  });
});
afterEach(() => memory.close());

const base = "/api/tools/mail/environments/production";
const consentCall = (path: string) =>
  handleConsent(new Request(`https://acme.forgeron.test${path}`), {
    registry,
    consent,
    workspace: "acme",
    caller: async () => person,
  });
const adminCall = (method: string, path: string) =>
  handleConnections(new Request(`https://acme.forgeron.test${path}`, { method }), {
    registry,
    workspace: "acme",
    caller: async () => admin,
  });

async function consentFlow() {
  const start = await consentCall(`${base}/consent/microsoft`);
  const state = new URL(start!.headers.get("location")!).searchParams.get("state")!;
  return consentCall(`/api/consent/callback?state=${encodeURIComponent(state)}&code=code-ok`);
}

describe("consent routes", () => {
  it("sends the person to the provider with the scopes the tool declared", async () => {
    const response = await consentCall(`${base}/consent/microsoft`);
    expect(response?.status).toBe(302);
    const location = new URL(response!.headers.get("location")!);
    expect(location.origin).toBe("https://idp.example.test");
    expect(location.searchParams.get("scope")).toBe("Mail.Send");
  });

  it("keeps the tokens when the person comes back, and the admin sees only who", async () => {
    const done = await consentFlow();
    expect(done?.status).toBe(200);
    expect(await done!.json()).toEqual({ connected: true, connector: "microsoft-365" });
    const listed = await adminCall("GET", `${base}/connections`);
    const text = await listed!.text();
    expect(JSON.parse(text).connections).toMatchObject([
      { userId: "ada@example.test", connector: "microsoft-365", scopes: ["Mail.Send"] },
    ]);
    expect(text).not.toContain("access-1");
  });

  it("refuses a callback from another person than the one who started", async () => {
    const start = await consentCall(`${base}/consent/microsoft`);
    const state = new URL(start!.headers.get("location")!).searchParams.get("state")!;
    person = { id: "grace@example.test" };
    const response = await consentCall(
      `/api/consent/callback?state=${encodeURIComponent(state)}&code=code-ok`,
    );
    expect(response?.status).toBe(400);
    expect(
      await registry.listConnections((await registry.findTool("acme", "mail"))!.id, "production"),
    ).toEqual([]);
  });

  it("needs a signed-in person, a declared delegated connector, and ignores other routes", async () => {
    expect((await consentCall(`${base}/consent/odoo`))?.status).toBe(400);
    expect((await consentCall(`${base}/consent/slack`))?.status).toBe(404);
    expect(
      (await consentCall(`/api/tools/nope/environments/production/consent/microsoft`))?.status,
    ).toBe(404);
    expect((await consentCall("/api/consent/callback"))?.status).toBe(400);
    expect(await consentCall("/api/other")).toBeUndefined();
    person = undefined;
    expect((await consentCall(`${base}/consent/microsoft`))?.status).toBe(401);
  });
});

describe("consent audit", () => {
  const lines = async () =>
    (await registry.listAudit((await registry.findTool("acme", "mail"))!.id, { kind: "access" }))
      .map((l) => ({ actor: l.actor, subject: l.subject, detail: l.detail }))
      .reverse();

  it("writes one line when a person gives their consent and one when they withdraw it", async () => {
    await consentFlow();
    expect(await lines()).toHaveLength(1);
    const withdraw = await handleConsent(
      new Request(`https://acme.forgeron.test${base}/consent/microsoft`, { method: "DELETE" }),
      { registry, consent, workspace: "acme", caller: async () => person },
    );
    expect(withdraw?.status).toBe(204);
    const written = await lines();
    expect(written).toEqual([
      {
        actor: "ada@example.test",
        subject: "connector-consent:microsoft-365:grant",
        detail: { environment: "production" },
      },
      {
        actor: "ada@example.test",
        subject: "connector-consent:microsoft-365:withdraw",
        detail: { environment: "production", connector: "microsoft" },
      },
    ]);
    expect(JSON.stringify(written)).not.toMatch(/access-1|refresh-1/);
  });

  it("writes nothing for a withdrawal that finds no consent, and never blocks on the audit", async () => {
    const response = await handleConsent(
      new Request(`https://acme.forgeron.test${base}/consent/microsoft`, { method: "DELETE" }),
      { registry, consent, workspace: "acme", caller: async () => person },
    );
    expect(response?.status).toBe(404);
    expect(await lines()).toEqual([]);
    const start = await consentCall(`${base}/consent/microsoft`);
    const state = new URL(start!.headers.get("location")!).searchParams.get("state")!;
    const done = await handleConsent(
      new Request(
        `https://acme.forgeron.test/api/consent/callback?state=${encodeURIComponent(state)}&code=code-ok`,
      ),
      {
        registry,
        consent,
        workspace: "acme",
        caller: async () => person,
        audit: async () => Promise.reject(new Error("audit is down")),
      },
    );
    expect(done?.status).toBe(200);
  });
});

describe("connections routes", () => {
  it("lets the admin revoke a person's consent, once", async () => {
    await consentFlow();
    const path = `${base}/connections/${encodeURIComponent("ada@example.test")}/microsoft-365`;
    expect((await adminCall("DELETE", path))?.status).toBe(204);
    expect((await adminCall("DELETE", path))?.status).toBe(404);
    const listed = await adminCall("GET", `${base}/connections`);
    expect((await listed!.json()) as unknown).toEqual({ connections: [] });
  });

  it("is for admins only", async () => {
    admin = { admin: false };
    expect((await adminCall("GET", `${base}/connections`))?.status).toBe(403);
    admin = undefined;
    expect((await adminCall("GET", `${base}/connections`))?.status).toBe(401);
    expect(await adminCall("GET", "/api/other")).toBeUndefined();
  });
});
