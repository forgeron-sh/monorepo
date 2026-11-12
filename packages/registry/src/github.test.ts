import type { D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRegistry, createReseal, createSecretBox, migratePlatform } from "./index";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// The GitHub App of a workspace (D-123): its keys sealed, its installations, and the re-sealing.

const key = (byte: number) => btoa(String.fromCharCode(...new Uint8Array(32).fill(byte)));
const OLD = key(1);
const NEW = key(2);
const KEYS = {
  privateKey: "-----BEGIN RSA PRIVATE KEY-----\nnot-a-real-key\n-----END RSA PRIVATE KEY-----\n",
  webhookSecret: "test-webhook-secret",
  clientSecret: "test-client-secret",
};
const APP = {
  appId: 42,
  slug: "forgeron-acme",
  clientId: "Iv1.test",
  owner: "acme-sh",
  htmlUrl: "https://github.com/apps/forgeron-acme",
};

let memory: MemoryD1;
let d1: D1Database;
beforeEach(async () => {
  memory = await createMemoryD1();
  d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
});
afterEach(() => memory.close());

describe("a workspace's GitHub App", () => {
  it("is kept with its keys sealed, read without them, and forgotten with its installations", async () => {
    const registry = createRegistry(d1, { secrets: await createSecretBox(OLD) });
    expect(await registry.githubApp("acme")).toBeUndefined();
    const saved = await registry.saveGithubApp({
      workspace: "acme",
      app: APP,
      keys: KEYS,
      actor: "p-admin",
    });
    expect(saved).toMatchObject({ workspace: "acme", ...APP, createdBy: "p-admin" });
    expect(JSON.stringify(saved)).not.toContain("not-a-real-key");
    expect(await registry.githubAppKeys("acme")).toEqual(KEYS);
    // Sealed at rest: the key is not in the row.
    const row = (await d1.prepare(`SELECT * FROM "github_apps"`).all()).results?.[0];
    expect(JSON.stringify(row)).not.toContain("test-webhook-secret");
    // Another workspace has none.
    expect(await registry.githubApp("other")).toBeUndefined();
    await expect(registry.githubAppKeys("other")).rejects.toThrow("no GitHub App");

    await registry.addGithubInstallation({
      workspace: "acme",
      installationId: 7,
      account: "acme-sh",
      accountType: "Organization",
    });
    // Twice is once.
    await registry.addGithubInstallation({
      workspace: "acme",
      installationId: 7,
      account: "acme-sh",
      accountType: "Organization",
    });
    await registry.addGithubInstallation({
      workspace: "acme",
      installationId: 8,
      account: "someone",
      accountType: "User",
    });
    expect(
      (await registry.listGithubInstallations("acme")).map((i) => [i.installationId, i.account]),
    ).toEqual([
      [7, "acme-sh"],
      [8, "someone"],
    ]);
    await registry.removeGithubInstallation("acme", 8);
    expect(await registry.listGithubInstallations("acme")).toHaveLength(1);

    await registry.removeGithubApp({ workspace: "acme", actor: "p-admin" });
    expect(await registry.githubApp("acme")).toBeUndefined();
    expect(await registry.listGithubInstallations("acme")).toEqual([]);
    const audit = (
      await d1.prepare(`SELECT "subject", "detail" FROM "audit_log" ORDER BY "at"`).all()
    ).results as { subject: string; detail: string }[];
    expect(audit.map((a) => a.subject)).toEqual([
      "github-app:forgeron-acme",
      "github-app:forgeron-acme",
    ]);
    expect(JSON.stringify(audit)).not.toContain("test-client-secret");
  });

  it("replaces the app and forgets the old one's installations when another is saved", async () => {
    const registry = createRegistry(d1, { secrets: await createSecretBox(OLD) });
    await registry.saveGithubApp({ workspace: "acme", app: APP, keys: KEYS, actor: "p" });
    await registry.addGithubInstallation({
      workspace: "acme",
      installationId: 7,
      account: "acme-sh",
      accountType: "Organization",
    });
    await registry.saveGithubApp({
      workspace: "acme",
      app: { ...APP, appId: 43, slug: "forgeron-acme-2" },
      keys: { ...KEYS, webhookSecret: "second-secret" },
      actor: "p",
    });
    expect(await registry.githubApp("acme")).toMatchObject({ appId: 43 });
    expect((await registry.githubAppKeys("acme")).webhookSecret).toBe("second-secret");
    expect(await registry.listGithubInstallations("acme")).toEqual([]);
  });

  it("is sealed again under the current key (D-108)", async () => {
    const old = createRegistry(d1, { secrets: await createSecretBox(OLD) });
    await old.saveGithubApp({ workspace: "acme", app: APP, keys: KEYS, actor: "p" });
    await old.saveGithubApp({ workspace: "other", app: APP, keys: KEYS, actor: "p" });
    const reseal = createReseal(d1, await createSecretBox(NEW, [OLD]));
    expect(await reseal.resealSecrets("acme")).toEqual({ resealed: 1, current: 0, unreadable: 0 });
    const fresh = createRegistry(d1, { secrets: await createSecretBox(NEW) });
    expect(await fresh.githubAppKeys("acme")).toEqual(KEYS);
    // The other workspace is still under the old key.
    await expect(fresh.githubAppKeys("other")).rejects.toBeDefined();
  });
});
