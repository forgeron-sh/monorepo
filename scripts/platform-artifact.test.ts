import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { platformMigrations } from "../packages/registry/src/migrations";
import { ARTIFACT_FILE, CHECKSUM_FILE, writePlatformArtifact } from "./platform-artifact";

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "forgeron-artifact-"));
  await mkdir(join(dir, "console", "assets"), { recursive: true });
  await mkdir(join(dir, "console", ".vite"), { recursive: true });
  await writeFile(join(dir, "worker.js"), "export default {};");
  await writeFile(join(dir, "console", "index.html"), "<html></html>");
  await writeFile(join(dir, "console", "assets", "app.js"), "console.log(1)");
  await writeFile(join(dir, "console", ".vite", "manifest.json"), "{}");
});
afterEach(() => rm(dir, { recursive: true, force: true }));

const options = () => ({
  worker: join(dir, "worker.js"),
  console: join(dir, "console"),
  out: join(dir, "out"),
  version: "1.2.3",
  commit: "abc123",
});

describe("platform artifact", () => {
  it("writes the JSON (format 1) and the checksum of that file", async () => {
    await writePlatformArtifact(options());
    const text = await readFile(join(dir, "out", ARTIFACT_FILE), "utf8");
    const artifact = JSON.parse(text);
    expect(Object.keys(artifact).sort()).toEqual(
      ["assets", "commit", "format", "migrations", "version", "worker"].sort(),
    );
    expect(artifact).toMatchObject({ format: 1, version: "1.2.3", commit: "abc123" });
    expect(Buffer.from(artifact.worker, "base64").toString()).toBe("export default {};");
    expect(artifact.assets.map((a: { path: string }) => a.path)).toEqual([
      "/assets/app.js",
      "/index.html",
    ]);
    expect(artifact.assets[1]).toEqual({
      path: "/index.html",
      hash: createHash("sha256").update("<html></html>").digest("hex").slice(0, 32),
      size: 13,
      base64: Buffer.from("<html></html>").toString("base64"),
      type: "text/html",
    });
    expect(artifact.migrations).toEqual(JSON.parse(JSON.stringify(platformMigrations)));
    const sum = await readFile(join(dir, "out", CHECKSUM_FILE), "utf8");
    expect(sum).toBe(`${createHash("sha256").update(text).digest("hex")}  ${ARTIFACT_FILE}\n`);
  });

  it("refuses an artifact over the limit and writes nothing", async () => {
    await expect(writePlatformArtifact({ ...options(), maxBytes: 100 })).rejects.toThrow(
      /over the 100 bytes/,
    );
    await expect(readFile(join(dir, "out", ARTIFACT_FILE))).rejects.toThrow(/ENOENT/);
  });
});
