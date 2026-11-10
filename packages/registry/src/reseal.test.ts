import type { D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createIdentityConfig,
  createRegistry,
  createReseal,
  createSecretBox,
  migratePlatform,
} from "./index";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// Re-sealing (D-108): what the platform keeps sealed moves under the current key, one workspace at a
// time, so that the previous key can be dropped.

const key = (byte: number) => btoa(String.fromCharCode(...new Uint8Array(32).fill(byte)));
const OLD = key(1);
const NEW = key(2);
let memory: MemoryD1;
let d1: D1Database;
beforeEach(async () => {
  memory = await createMemoryD1();
  d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
});
afterEach(() => memory.close());

/** Everything the platform seals, for two workspaces, under the old key. */
async function seed() {
  const box = await createSecretBox(OLD);
  const registry = createRegistry(d1, { secrets: box });
  const config = createIdentityConfig(d1, { secrets: box });
  const out: Record<string, { toolId: string }> = {};
  for (const workspace of ["acme", "other"]) {
    const tool = await registry.createTool({ workspace, name: "odoo" });
    out[workspace] = { toolId: tool.id };
    await registry.setSecret(tool.id, "production", "API_KEY", `${workspace}-tool-value`);
    await registry.setUserSecret({
      toolId: tool.id,
      person: "p1",
      name: "PERSON_KEY",
      value: `${workspace}-person-value`,
    });
    await registry.saveConnection({
      toolId: tool.id,
      environment: "production",
      userId: "p1",
      connector: "graph",
      scopes: ["mail"],
      tokens: { accessToken: `${workspace}-access`, refreshToken: `${workspace}-refresh` },
    });
    await config.setIdentityProvider(
      workspace,
      {
        kind: "oidc",
        issuer: "https://idp.test",
        clientId: "c1",
        clientSecret: `${workspace}-idp`,
      },
      "admin",
    );
    await config.setConnectorClient(
      workspace,
      "graph",
      {
        authorizeUrl: "https://idp.test/a",
        tokenUrl: "https://idp.test/t",
        clientId: "c2",
        clientSecret: `${workspace}-client`,
      },
      "admin",
    );
  }
  return out;
}

const readAll = async (secrets: string, workspace: string, toolId: string) => {
  const box = await createSecretBox(secrets);
  const registry = createRegistry(d1, { secrets: box });
  const config = createIdentityConfig(d1, { secrets: box });
  return {
    tool: await registry.readSecrets(toolId, "production"),
    person: await registry.readUserSecrets(toolId, "p1"),
    connection: await registry.readConnection({
      toolId,
      environment: "production",
      userId: "p1",
      connector: "graph",
    }),
    provider: (await config.getIdentityProvider(workspace, true))?.clientSecret,
    client: (await config.connectorClientsWithSecrets(workspace))[0]?.clientSecret,
  };
};

describe("sealing everything again under the current key", () => {
  it("moves one workspace's values to the new key and leaves the other's under the old one", async () => {
    const ids = await seed();
    const reseal = createReseal(d1, await createSecretBox(NEW, [OLD]));
    expect(await reseal.resealSecrets("acme")).toEqual({ resealed: 5, current: 0, unreadable: 0 });

    // The new key alone opens all of acme's values.
    const acme = await readAll(NEW, "acme", ids.acme!.toolId);
    expect(acme).toMatchObject({
      tool: { API_KEY: "acme-tool-value" },
      person: { PERSON_KEY: "acme-person-value" },
      connection: { accessToken: "acme-access", refreshToken: "acme-refresh" },
      provider: "acme-idp",
      client: "acme-client",
    });
    // The other workspace was not touched: the new key alone does not open it, the old one does.
    await expect(readAll(NEW, "other", ids.other!.toolId)).rejects.toMatchObject({
      name: "OperationError",
    });
    expect((await readAll(OLD, "other", ids.other!.toolId)).person).toEqual({
      PERSON_KEY: "other-person-value",
    });
  });

  it("is idempotent, and every version of a person's secret is sealed again", async () => {
    const ids = await seed();
    const old = createRegistry(d1, { secrets: await createSecretBox(OLD) });
    // A second version, and a pinned earlier one.
    await old.setUserSecret({
      toolId: ids.acme!.toolId,
      person: "p1",
      name: "PERSON_KEY",
      value: "acme-person-second",
    });
    const reseal = createReseal(d1, await createSecretBox(NEW, [OLD]));
    expect(await reseal.resealSecrets("acme")).toEqual({ resealed: 6, current: 0, unreadable: 0 });
    expect(await reseal.resealSecrets("acme")).toEqual({ resealed: 0, current: 6, unreadable: 0 });
    const fresh = createRegistry(d1, { secrets: await createSecretBox(NEW) });
    expect(await fresh.readUserSecrets(ids.acme!.toolId, "p1")).toEqual({
      PERSON_KEY: "acme-person-second",
    });
    const listed = await fresh.listPersonSecrets("acme", "p1");
    expect(await fresh.readPersonSecret("acme", "p1", listed[0]!.id, 1)).toBe("acme-person-value");
  });

  it("counts a value no key opens and leaves it as it is", async () => {
    await seed();
    // The previous key was dropped before re-sealing: nothing opens the values.
    const reseal = createReseal(d1, await createSecretBox(NEW));
    expect(await reseal.resealSecrets("acme")).toEqual({ resealed: 0, current: 0, unreadable: 5 });
    // With the previous key back, they are still there to be re-sealed.
    expect(await createReseal(d1, await createSecretBox(NEW, [OLD])).resealSecrets("acme")).toEqual(
      { resealed: 5, current: 0, unreadable: 0 },
    );
  });
});
