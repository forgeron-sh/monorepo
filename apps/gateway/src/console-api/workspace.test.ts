import { createRegistry, migratePlatform, type Registry } from "@forgeron/registry";
import type { D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SignIn } from "@forgeron/platform-contract";
import { platformCaller } from "../platform/test-app";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

let memory: MemoryD1;
let registry: Registry;
let roles: string[] | undefined;
let toolId: string;

const person = () =>
  roles
    ? {
        id: "p1",
        email: "ada@acme.test",
        name: "Ada",
        roles,
        admin: roles.includes("admin"),
        developer: roles.includes("developer"),
      }
    : undefined;
const signIn = async (): Promise<SignIn> => ({
  email: { enabled: true, mail: "console" },
  oidc: { enabled: false, configured: false },
  saml: { enabled: false, configured: false },
});
const read = async (response: Response | undefined) => JSON.parse(await response!.text());
const req = (path: string, init?: RequestInit) =>
  new Request(`https://acme.forgeron.test${path}`, init);
const workspace = (path = "/api/workspace", method = "GET") =>
  platformCaller({ registry, signIn, who: person })(req(path, { method }));
const approvals = (path: string, init?: RequestInit) =>
  platformCaller({
    registry,
    who: () => (roles ? { id: "p1", roles, admin: roles.includes("admin") } : undefined),
  })(req(path, init));
const audit = (path = "/api/audit", method = "GET") =>
  platformCaller({
    registry,
    who: () => (roles ? { roles, admin: roles.includes("admin") } : undefined),
  })(req(path, { method }));

beforeEach(async () => {
  roles = ["admin"];
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1);
  toolId = (await registry.createTool({ workspace: "acme", name: "crm" })).id;
});
afterEach(() => memory.close());

describe("workspace API", () => {
  it("starts with nothing done, then counts what exists", async () => {
    const empty = await read(await workspace());
    expect(empty).toMatchObject({
      workspace: "acme",
      endpoint: "https://acme.forgeron.test",
      person: { email: "ada@acme.test", admin: true },
      setup: { tools: 1, deployed: 0, called: false, invitations: 0 },
      signIn: { email: { mail: "console" } },
      install: { baseDomain: "forgeron.test" },
    });

    const build = await registry.recordBuild(toolId, {
      fingerprint: "fp",
      manifest: { name: "crm" },
    });
    const version = await registry.publishVersion(toolId, build.id, "1.0.0");
    const environment = await registry.ensureEnvironment(toolId, "preview", "feature");
    await registry.activate(environment.id, version.id, { actor: "p1" });
    expect((await read(await workspace())).setup.deployed).toBe(1);
    await registry.recordActionCall({
      toolId,
      actor: "p1",
      interface: "mcp",
      action: "crm.contacts.list",
      result: "ok",
    });
    const done = await read(await workspace());
    expect(done.setup.called).toBe(true);
  });

  it("keeps sign-in and install details for admins", async () => {
    roles = ["developer"];
    const body = await read(await workspace());
    expect(body.person.admin).toBe(false);
    expect(body.signIn).toBeUndefined();
    expect(body.install).toBeUndefined();
  });

  it("refuses anonymous callers and other methods, ignores other routes", async () => {
    roles = undefined;
    expect((await workspace())?.status).toBe(401);
    roles = ["admin"];
    expect((await workspace("/api/workspace", "POST"))?.status).toBe(405);
    expect(await workspace("/api/other")).toBeUndefined();
  });
});

describe("approvals API", () => {
  let approvalId: string;
  beforeEach(async () => {
    const build = await registry.recordBuild(toolId, {
      fingerprint: "fp",
      manifest: { name: "crm" },
    });
    const version = await registry.publishVersion(toolId, build.id, "1.1.0");
    approvalId = (
      await registry.requestApproval(version.id, {
        resource: "resources.network",
        kind: "resource.added",
      })
    ).id;
  });

  it("lists the pending versions of the workspace's tools", async () => {
    const body = await read(await approvals("/api/approvals"));
    expect(body.versions).toEqual([
      {
        tool: "crm",
        id: expect.any(String),
        version: "1.1.0",
        approvals: [{ id: approvalId, resource: "resources.network", kind: "resource.added" }],
      },
    ]);
  });

  it("decides once", async () => {
    const decide = (decision: string) =>
      approvals(`/api/approvals/${approvalId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision }),
      });
    expect((await decide("maybe"))?.status).toBe(400);
    expect((await decide("approved"))?.status).toBe(200);
    expect((await decide("rejected"))?.status).toBe(409);
    expect((await read(await approvals("/api/approvals"))).versions).toEqual([]);
  });

  it("is for admins and answers 404 to an unknown request", async () => {
    expect(
      (
        await approvals("/api/approvals/nope", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ decision: "approved" }),
        })
      )?.status,
    ).toBe(404);
    roles = ["developer"];
    expect((await approvals("/api/approvals"))?.status).toBe(403);
    roles = undefined;
    expect((await approvals("/api/approvals"))?.status).toBe(401);
    roles = ["admin"];
    expect((await approvals("/api/approvals", { method: "DELETE" }))?.status).toBe(405);
  });
});

describe("audit API", () => {
  it("lists the latest lines newest first, with the tool name", async () => {
    await registry.recordActionCall({
      toolId,
      actor: "p1",
      interface: "mcp",
      action: "crm.contacts.list",
      result: "ok",
    });
    await registry.recordActionCall({
      toolId,
      actor: "p1",
      interface: "api",
      action: "crm.contacts.update",
      result: "ok",
    });
    const body = await read(await audit("/api/audit?limit=1"));
    expect(body.entries).toHaveLength(1);
    expect(body.entries[0]).toMatchObject({ tool: "crm", subject: "crm.contacts.update" });
    expect(body.entries[0].detail).toBeUndefined();
  });

  it("is for admins", async () => {
    roles = ["developer"];
    expect((await audit())?.status).toBe(403);
    roles = undefined;
    expect((await audit())?.status).toBe(401);
    roles = ["admin"];
    expect((await audit("/api/audit", "POST"))?.status).toBe(405);
  });
});
