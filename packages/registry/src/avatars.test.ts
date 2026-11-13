import type { D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createRegistry, migratePlatform, type Registry } from "./index";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// A 1x1 png.
const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
const JPEG =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACv/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==";

let memory: MemoryD1;
let registry: Registry;
let ada: string;

beforeAll(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1);
  ada = (
    await registry.addMember({
      workspace: "acme",
      subject: "ada",
      email: "ada@acme.test",
      name: "Ada",
      roles: [],
    })
  ).id;
});
afterAll(() => memory.close());

describe("avatars (D-133)", () => {
  it("start empty, then take the provider's picture", async () => {
    expect(await registry.readAvatar("acme", ada)).toBeUndefined();
    expect((await registry.findMember("acme", ada))?.avatar).toBeUndefined();
    await registry.setProviderAvatar("acme", ada, {
      url: "https://idp.test/ada.png",
      dataUrl: PNG,
    });
    const found = await registry.readAvatar("acme", ada);
    expect(found?.contentType).toBe("image/png");
    expect(found?.bytes.length).toBeGreaterThan(10);
    expect((await registry.findMember("acme", ada))?.avatar?.source).toBe("provider");
    expect(await registry.providerAvatarUrl("acme", ada)).toBe("https://idp.test/ada.png");
  });

  it("let the person's own picture win, and give it back to the provider's", async () => {
    const before = (await registry.findMember("acme", ada))?.avatar?.version;
    await registry.setCustomAvatar("acme", ada, JPEG, ada);
    const mine = await registry.findMember("acme", ada);
    expect(mine?.avatar?.source).toBe("custom");
    expect(mine?.avatar?.version).not.toBe(before);
    expect((await registry.readAvatar("acme", ada))?.contentType).toBe("image/jpeg");
    await registry.setCustomAvatar("acme", ada, null, ada);
    expect((await registry.findMember("acme", ada))?.avatar?.source).toBe("provider");
  });

  it("refuse anything that is not a small png, jpeg or webp", async () => {
    for (const bad of [
      "https://evil.test/x.png",
      "data:text/html;base64,PGI+",
      "data:image/svg+xml;base64,PHN2Zz4=",
      `data:image/png;base64,${"A".repeat(90_000)}`,
    ]) {
      await expect(registry.setCustomAvatar("acme", ada, bad, ada)).rejects.toMatchObject({
        code: "INVALID",
      });
    }
    await expect(registry.setCustomAvatar("acme", "ghost", PNG, ada)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
