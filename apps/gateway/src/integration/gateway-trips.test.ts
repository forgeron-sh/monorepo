import type { D1Database } from "@forgeron/hosting";
import { createRegistry, migratePlatform } from "@forgeron/registry";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createGateway, type GatewayEnv } from "../gateway";
import { ISSUER, simulatedProvider } from "../simulated-idp";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// What a call to a tool costs in trips to the platform's D1, read in its `Server-Timing` (D-146): the reads a
// call starts together go in one batch, and a Worker that already read the registry checks it with one small
// read sent with the person's secrets.

const now = new Date("2026-11-03T10:00:00Z");
let memory: MemoryD1;

const manifest = {
  name: "notes",
  version: "1.0.0",
  profiles: { member: { grants: ["read", "write"], default: true } },
  actions: { "notes.list": { access: "read" } },
  resources: { directory: { why: "Names", members: true, avatars: true, teams: true } },
};

const env = (): GatewayEnv => ({
  DB: memory as unknown as D1Database,
  BASE_DOMAIN: "forgeron.app",
  AUTH_SECRET: "test-secret-not-a-real-one",
  OIDC_ISSUER: ISSUER,
  OIDC_CLIENT_ID: "forgeron",
  ADMIN_EMAIL: "ely@acme.fr",
  MEMBER_EMAIL_DOMAINS: "acme.fr",
  DISPATCHER: { get: () => ({ fetch: () => Response.json([]) }) },
});

beforeAll(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  const registry = createRegistry(d1);
  const tool = await registry.createTool({ workspace: "acme", name: "notes" });
  const built = await registry.recordBuild(tool.id, {
    fingerprint: "fp",
    manifest,
    worker: "export default {}",
  });
  const version = await registry.publishVersion(tool.id, built.id, "1.0.0");
  const production = await registry.ensureEnvironment(tool.id, "production");
  await registry.activate(production.id, version.id, { actor: "test" });
});
afterAll(() => memory.close());

const at = (path: string, init: RequestInit = {}) =>
  new Request(`https://acme.forgeron.app${path}`, init);
const cookiesOf = (r: Response) =>
  r.headers
    .getSetCookie()
    .map((c) => c.split(";")[0]!)
    .filter((c) => !c.endsWith("="))
    .join("; ");

async function signIn(): Promise<string> {
  const idp = await simulatedProvider("ely@acme.fr", now);
  const gateway = createGateway(env(), { now: () => now, fetch: idp.fetcher });
  const login = await gateway(at("/auth/login"));
  const callback = await gateway(
    at(`/auth/callback${idp.signIn(login.headers.get("location")!)}`, {
      headers: { cookie: cookiesOf(login) },
    }),
  );
  return cookiesOf(callback);
}

/** The trips and statements a call cost, as its `Server-Timing` tells them. */
const tripsOf = (response: Response) => {
  const d1 = /d1;dur=[\d.]+;desc="(\d+) trips, (\d+) statements/.exec(
    response.headers.get("server-timing") ?? "",
  );
  return { trips: Number(d1?.[1] ?? 0), statements: Number(d1?.[2] ?? 0) };
};

describe("the trips of a call to a tool (D-146)", () => {
  it("costs a few trips on a cold Worker, and one once it has read the registry", async () => {
    const cookie = await signIn();
    // The seat and the usage are counted after the answer, as on a real install (D-143).
    const later: Promise<unknown>[] = [];
    const gateway = createGateway(env(), { now: () => now, defer: (work) => later.push(work) });
    const call = () =>
      gateway(
        at("/t/notes/api/notes.list", {
          method: "POST",
          body: "{}",
          headers: { cookie, "content-type": "application/json" },
        }),
      );
    const cold = await call();
    expect(cold.status).toBe(200);
    const first = tripsOf(cold);
    // Without the batches, each statement was its own trip: here the person and the tool are read in one, then
    // everything the forwarding needs in another. The seat and the usage, written after the answer, are not told.
    expect(first.statements).toBeGreaterThan(15);
    // The person's reads wait for the check of their cookie (crypto): when it ends after the tool's reads left,
    // they go in a batch of their own, side by side with it, not after it.
    expect(first.trips).toBeGreaterThanOrEqual(2);
    expect(first.trips).toBeLessThanOrEqual(3);
    await Promise.all(later);
    const warm = tripsOf(await call());
    // The person's secrets, never kept; the rest is in the memory, checked less than a second ago.
    expect(warm).toEqual({ trips: 1, statements: 1 });
    await Promise.all(later);
  });
});
