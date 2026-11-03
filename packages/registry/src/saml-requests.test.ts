import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { D1Database } from "@forgeron/hosting";
import { createIdentityConfig, createSamlRequests, migratePlatform } from "./index";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const now = new Date("2026-11-03T10:00:00Z");
const later = (seconds: number) => new Date(now.getTime() + seconds * 1000);

let memory: MemoryD1;
let d1: D1Database;
beforeEach(async () => {
  memory = await createMemoryD1();
  d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
});
afterEach(() => memory.close());

describe("SAML request and assertion ids", () => {
  it("lets a request id be used once, in its workspace, before it expires", async () => {
    const saml = createSamlRequests(d1);
    await saml.open("acme", "_r1", later(600), now);
    expect(await saml.take("other", "_r1", now)).toBe(false);
    expect(await saml.take("acme", "_r1", later(601))).toBe(false); // expired
    await saml.open("acme", "_r2", later(600), now);
    expect(await saml.take("acme", "_r2", later(10))).toBe(true);
    expect(await saml.take("acme", "_r2", later(10))).toBe(false); // used
    expect(await saml.take("acme", "_never", now)).toBe(false);
  });

  it("lets only one of two simultaneous answers win", async () => {
    const saml = createSamlRequests(d1);
    await saml.open("acme", "_r1", later(600), now);
    const results = await Promise.all([
      saml.take("acme", "_r1", now),
      saml.take("acme", "_r1", now),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
  });

  it("accepts an assertion id once while it is remembered, and again after it has lapsed", async () => {
    const saml = createSamlRequests(d1);
    expect(await saml.remember("acme", "_a1", later(300), now)).toBe(true);
    expect(await saml.remember("acme", "_a1", later(300), later(10))).toBe(false); // replay
    expect(await saml.remember("other", "_a1", later(300), now)).toBe(true);
    expect(await saml.remember("acme", "_a1", later(900), later(301))).toBe(true);
  });

  it("does not mix a request id with an assertion id", async () => {
    const saml = createSamlRequests(d1);
    expect(await saml.remember("acme", "_x", later(300), now)).toBe(true);
    expect(await saml.take("acme", "_x", now)).toBe(false);
  });

  it("purges what has expired when a sign-in starts", async () => {
    const saml = createSamlRequests(d1);
    await saml.open("acme", "_old", later(10), now);
    await saml.open("acme", "_new", later(900), later(100));
    const rows = (await memory.prepare(`SELECT "id" FROM "saml_requests"`).all()).results ?? [];
    expect(rows.map((r) => (r as { id: string }).id)).toEqual(["_new"]);
  });
});

describe("the SAML provider", () => {
  it("is saved with its certificates and attribute mapping, and replaces an OIDC provider", async () => {
    const config = createIdentityConfig(d1, { now: () => now });
    await config.setIdentityProvider(
      "acme",
      { kind: "oidc", issuer: "https://i.test", clientId: "c" },
      "a1",
    );
    await config.setSamlProvider(
      "acme",
      {
        idpEntityId: "https://idp.test",
        ssoUrl: "https://idp.test/sso",
        certificates: ["CERT"],
        emailAttribute: "mail",
        groupRoles: { devs: "developer" },
      },
      "a1",
    );
    expect(await config.getIdentityProvider("acme")).toBeUndefined();
    expect(await config.getSamlProvider("acme")).toEqual({
      idpEntityId: "https://idp.test",
      ssoUrl: "https://idp.test/sso",
      certificates: ["CERT"],
      emailAttribute: "mail",
      groupRoles: { devs: "developer" },
      updatedBy: "a1",
      updatedAt: now.toISOString(),
    });
    // And the other way round.
    await config.setIdentityProvider(
      "acme",
      { kind: "oidc", issuer: "https://i.test", clientId: "c" },
      "a1",
    );
    expect(await config.getSamlProvider("acme")).toBeUndefined();
    await config.setSamlProvider(
      "acme",
      { idpEntityId: "i", ssoUrl: "https://s", certificates: ["C"] },
      "a1",
    );
    expect(await config.deleteIdentityProvider("acme")).toBe(true);
    expect(await config.getSamlProvider("acme")).toBeUndefined();
    expect(await config.deleteIdentityProvider("acme")).toBe(false);
  });
});
