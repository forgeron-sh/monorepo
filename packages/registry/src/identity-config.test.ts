import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { D1Database } from "@forgeron/hosting";
import {
  createIdentityConfig,
  createSecretBox,
  migratePlatform,
  type IdentityConfig,
} from "./index";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// A throwaway key made of zeros: it protects nothing and is not a secret.
const TEST_KEY = btoa(String.fromCharCode(...new Uint8Array(32)));

let memory: MemoryD1;
let config: IdentityConfig;

beforeEach(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  config = createIdentityConfig(d1, { secrets: await createSecretBox(TEST_KEY) });
});
afterEach(() => memory.close());

describe("identity provider", () => {
  it("keeps the client secret sealed and returns it only on request", async () => {
    await config.setIdentityProvider(
      "acme",
      {
        kind: "google",
        clientId: "id",
        clientSecret: "s3cret-for-tests",
        hostedDomain: "acme.test",
      },
      "admin-1",
    );
    const raw = await memory.prepare(`SELECT * FROM "identity_providers"`).all();
    expect(JSON.stringify(raw.results)).not.toContain("s3cret-for-tests");
    const listed = await config.getIdentityProvider("acme");
    expect(listed).toMatchObject({ kind: "google", hostedDomain: "acme.test", hasSecret: true });
    expect(JSON.stringify(listed)).not.toContain("s3cret");
    expect((await config.getIdentityProvider("acme", true))?.clientSecret).toBe("s3cret-for-tests");
  });

  it("keeps the previous secret when an update gives none, and deletes", async () => {
    await config.setIdentityProvider(
      "acme",
      { kind: "oidc", issuer: "https://i", clientId: "a", clientSecret: "one" },
      "x",
    );
    await config.setIdentityProvider(
      "acme",
      { kind: "oidc", issuer: "https://i", clientId: "b" },
      "y",
    );
    const got = await config.getIdentityProvider("acme", true);
    expect(got).toMatchObject({ clientId: "b", clientSecret: "one", updatedBy: "y" });
    expect(await config.deleteIdentityProvider("acme")).toBe(true);
    expect(await config.getIdentityProvider("acme")).toBeUndefined();
    expect(await config.deleteIdentityProvider("acme")).toBe(false);
  });

  it("is per workspace", async () => {
    await config.setIdentityProvider(
      "a",
      { kind: "oidc", issuer: "https://i", clientId: "a" },
      "x",
    );
    expect(await config.getIdentityProvider("b")).toBeUndefined();
  });
});

describe("connector clients", () => {
  const input = { authorizeUrl: "https://p/authorize", tokenUrl: "https://p/token", clientId: "c" };
  it("needs a secret at creation, keeps it afterwards and never lists it", async () => {
    expect(await config.setConnectorClient("acme", "microsoft-365", input, "x")).toBe(
      "SECRET_REQUIRED",
    );
    expect(
      await config.setConnectorClient(
        "acme",
        "microsoft-365",
        { ...input, clientSecret: "cs" },
        "x",
      ),
    ).toBe("created");
    expect(
      await config.setConnectorClient("acme", "microsoft-365", { ...input, clientId: "d" }, "x"),
    ).toBe("updated");
    expect(JSON.stringify(await config.listConnectorClients("acme"))).not.toContain('cs"');
    expect(await config.connectorClientsWithSecrets("acme")).toMatchObject([
      { connector: "microsoft-365", clientId: "d", clientSecret: "cs" },
    ]);
    expect(await config.deleteConnectorClient("acme", "microsoft-365")).toBe(true);
    expect(await config.listConnectorClients("acme")).toEqual([]);
  });
});
