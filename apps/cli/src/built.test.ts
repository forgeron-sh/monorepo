import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { readBuild } from "./built";

let dir: string | undefined;
afterEach(async () => {
  if (dir) await rm(dir, { recursive: true, force: true });
  dir = undefined;
});

const built = async (withViews: boolean) => {
  dir = await mkdtemp(join(tmpdir(), "forgeron-built-"));
  await writeFile(join(dir, "worker.js"), "export default {}");
  await writeFile(join(dir, "manifest.json"), JSON.stringify({ name: "notes" }));
  if (withViews) {
    await mkdir(join(dir, "views", "chunks"), { recursive: true });
    await writeFile(join(dir, "views", "notes.js"), "export default 1");
    await writeFile(join(dir, "views", "chunks", "a-1.js"), "export const a = 1");
    await writeFile(join(dir, "views", "notes.js.map"), "{}");
  }
  return dir;
};

describe("readBuild and the views (D-134)", () => {
  it("carries the built views, and their shared chunks, with the build", async () => {
    const build = await readBuild(await built(true), "fp");
    expect(Object.keys(build.views ?? {}).sort()).toEqual([
      "views/chunks/a-1.js",
      "views/notes.js",
    ]);
    expect(build.views?.["views/notes.js"]).toBe("export default 1");
  });

  it("has none for a tool without a view", async () => {
    expect((await readBuild(await built(false), "fp")).views).toBeUndefined();
  });
});
