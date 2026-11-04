import type { D1Database } from "@forgeron/hosting";
import { migratePlatform } from "@forgeron/registry";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createGateway, type GatewayEnv } from "../gateway";

// The routes of the CLI on the Hono app (D-075): where they answer and where they do not. What each
// one does is covered by the handlers' own tests, which go through the gateway.

let memory: MemoryD1;
let env: GatewayEnv;
beforeAll(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  env = { DB: d1, BASE_DOMAIN: "forgeron.app", AUTH_SECRET: "test-secret-not-a-real-one" };
});
afterAll(() => memory.close());

const call = (path: string, init?: RequestInit, withSecret = true) =>
  createGateway(withSecret ? env : { ...env, AUTH_SECRET: undefined as unknown as string })(
    new Request(`https://acme.forgeron.app${path}`, init),
  );

describe("the routes outside /console-api", () => {
  it.each([
    ["GET", "/whoami"],
    ["POST", "/deploy-tokens"],
    ["POST", "/auth/token"],
    ["POST", "/auth/token/revoke"],
  ])("%s %s asks who is calling, in the CLI's error shape", async (method, path) => {
    const response = await call(path, {
      method,
      headers: { "content-type": "application/json" },
      body: method === "GET" ? undefined : "{}",
    });
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: { code: "UNAUTHENTICATED" } });
  });

  it("answers a method it does not take with the handler's 405", async () => {
    const response = await call("/deploy-tokens", { method: "GET" });
    expect(response.status).toBe(405);
  });

  it("does not answer on /console-api: those paths are not the console's", async () => {
    for (const path of ["/console-api/whoami", "/console-api/deploy", "/console-api/auth/token"]) {
      expect((await call(path)).status).toBe(404);
    }
  });

  it("fails closed without a signing secret", async () => {
    expect((await call("/whoami", undefined, false)).status).not.toBe(200);
  });
});
