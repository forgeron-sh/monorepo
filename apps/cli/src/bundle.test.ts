import { createHash } from "node:crypto";
import { cp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { run } from "./cli";
import type { Io } from "./io";

const fixtures = fileURLToPath(new URL("../fixtures", import.meta.url));
const dirs: string[] = [];
afterEach(async () => {
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

/** A copy of the greeter tool inside the repository, so that `@forgeron/sdk` resolves. */
async function greeter() {
  const dir = join(fixtures, `.work-bundle-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  dirs.push(dir);
  await cp(join(fixtures, "greeter"), dir, {
    recursive: true,
    filter: (s) => !s.includes(".forgeron"),
  });
  const logs: string[] = [];
  const errors: string[] = [];
  const io: Io = {
    cwd: dir,
    log: (m) => void logs.push(m),
    error: (m) => void errors.push(m),
    exec: async () => 0,
    stopped: new Promise(() => {}),
  };
  return { dir, io, logs, errors };
}

describe("forgeron bundle", () => {
  it("writes the build as one file and prints its SHA-256", async () => {
    const { dir, io, logs, errors } = await greeter();
    expect(await run(["bundle", "--out", "dist"], io)).toBe(0);
    expect(errors).toEqual([]);
    const manifest = JSON.parse(await readFile(join(dir, ".forgeron/build/manifest.json"), "utf8"));
    const file = join(dir, "dist", `${manifest.name}-${manifest.version}.forgeron.json`);
    const text = await readFile(file, "utf8");
    const bundle = JSON.parse(text);
    expect(bundle).toMatchObject({
      format: "forgeron.bundle/1",
      name: manifest.name,
      version: manifest.version,
      build: { manifest, worker: expect.any(String), fingerprint: expect.any(String) },
    });
    expect(logs).toContain(`sha256 ${createHash("sha256").update(text).digest("hex")}`);
  });

  it("refuses an argument it does not know", async () => {
    const { io } = await greeter();
    await expect(run(["bundle", "extra"], io)).resolves.not.toBe(0);
  });
});
