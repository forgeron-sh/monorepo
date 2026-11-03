import { cp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { addChange, buildTool, bumpVersion, checkChanges, ChangelogError, release } from "./index";
import { parseChange } from "./changelog";

const fixtures = fileURLToPath(new URL("../fixtures", import.meta.url));
const dirs: string[] = [];
afterEach(async () => {
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

// A copy of the hello tool (version 1.4.0), inside the repository so that its imports resolve.
async function tool(name: string) {
  const dir = join(fixtures, `.work-${name}-${Date.now()}`);
  dirs.push(dir);
  await cp(join(fixtures, "hello"), dir, {
    recursive: true,
    filter: (src) => !src.includes(".forgeron"),
  });
  return dir;
}
const newAction = (dir: string, name: string) =>
  writeFile(
    join(dir, "actions", `${name}.ts`),
    `import { action, z } from "@forgeron/sdk";\nexport default action({ description: "New.", access: "read", input: z.object({}), run: () => ({}) });\n`,
  );
const day = new Date("2026-11-03T10:00:00Z");

describe("changes/", () => {
  it("writes one file per change, named by day and description", async () => {
    const dir = await tool("change-add");
    const file = await addChange(
      dir,
      { type: "added", bump: "minor", description: "CSV export of leads (deals.export)" },
      day,
    );
    expect(file).toBe("changes/2026-11-03-csv-export-of-leads-deals-export.md");
    expect(await readFile(join(dir, file), "utf8")).toBe(
      "---\ntype: added\nbump: minor\n---\n\nCSV export of leads (deals.export)\n",
    );
    // The same description the same day does not overwrite the first.
    const second = await addChange(
      dir,
      { type: "added", bump: "minor", description: "CSV export of leads (deals.export)" },
      day,
    );
    expect(second).toBe("changes/2026-11-03-csv-export-of-leads-deals-export-2.md");
  });

  it("refuses an empty description, an unknown type and an unknown impact", async () => {
    const dir = await tool("change-bad");
    await expect(
      addChange(dir, { type: "added", bump: "minor", description: "  " }),
    ).rejects.toThrow("needs a description");
    expect(() => parseChange("changes/a.md", "---\ntype: fixd\nbump: patch\n---\n\nx")).toThrow(
      'type "fixd"',
    );
    expect(() => parseChange("changes/a.md", "---\ntype: fixed\nbump: tiny\n---\n\nx")).toThrow(
      'bump "tiny"',
    );
    expect(() => parseChange("changes/a.md", "no front matter")).toThrow(ChangelogError);
  });
});

describe("bumpVersion", () => {
  it("moves the part the impact names, and resets the ones after it", () => {
    expect(bumpVersion("1.4.2", "patch")).toBe("1.4.3");
    expect(bumpVersion("1.4.2", "minor")).toBe("1.5.0");
    expect(bumpVersion("1.4.2", "major")).toBe("2.0.0");
    expect(() => bumpVersion("1.5.0-preview.x.1", "patch")).toThrow("x.y.z");
  });
});

describe("forgeron release, then forgeron change check", () => {
  it("releases, writes the changelog, and compares later manifests with that release", async () => {
    const dir = await tool("release");
    await expect(release(dir, day)).rejects.toThrow("nothing to release");

    await addChange(dir, { type: "fixed", bump: "patch", description: "Ping is faster." }, day);
    await addChange(dir, { type: "added", bump: "minor", description: "A new greeting." }, day);
    const result = await release(dir, day);
    expect(result.version).toBe("1.5.0");
    expect(result.name).toBe("hello");

    expect(JSON.parse(await readFile(join(dir, "package.json"), "utf8")).version).toBe("1.5.0");
    expect(await readdir(join(dir, "changes"))).toEqual([]);
    const changelog = await readFile(join(dir, "CHANGELOG.md"), "utf8");
    expect(changelog).toContain("## 1.5.0 — 2026-11-03");
    expect(changelog).toContain("### Added\n\n- A new greeting.");
    expect(changelog).toContain("### Fixed\n\n- Ping is faster.");
    expect(changelog).toContain("### Technical");

    // The build publishes what the release said, structured.
    const built = await buildTool(dir);
    const published = JSON.parse(await readFile(join(built.outDir, "changelog.json"), "utf8"));
    expect(published).toMatchObject({ version: "1.5.0", declared: "minor", detected: "none" });
    expect(published.entries).toHaveLength(2);

    // Nothing changed since: nothing to declare.
    expect(await checkChanges(dir)).toMatchObject({ ok: true, detected: "none" });
  }, 120_000);

  it("fails when the manifest changed and changes/ is empty, or declares less than detected", async () => {
    const dir = await tool("check");
    await addChange(dir, { type: "added", bump: "minor", description: "First." }, day);
    await release(dir, day);

    await newAction(dir, "extra");
    const empty = await checkChanges(dir);
    expect(empty.ok).toBe(false);
    expect(empty.detected).toBe("minor");
    expect(empty.problems[0]).toContain("changes/ is empty");

    await addChange(dir, { type: "fixed", bump: "patch", description: "Typo." }, day);
    const low = await checkChanges(dir);
    expect(low.ok).toBe(false);
    expect(low.problems[0]).toContain(
      "declared impact (patch) is lower than the detected one (minor)",
    );
    await expect(release(dir, day)).rejects.toThrow("lower than the detected");

    await addChange(dir, { type: "added", bump: "minor", description: "Extra action." }, day);
    expect(await checkChanges(dir)).toMatchObject({
      ok: true,
      declared: "minor",
      detected: "minor",
    });
    const second = await release(dir, day);
    expect(second.version).toBe("1.6.0");
    expect(await readFile(join(dir, "CHANGELOG.md"), "utf8")).toMatch(
      /## 1\.6\.0[\s\S]*Actions added: extra[\s\S]*## 1\.5\.0/,
    );
  }, 180_000);

  it("has no baseline before the first release: nothing is detected", async () => {
    const dir = await tool("first");
    expect(await checkChanges(dir)).toMatchObject({ ok: true, detected: "none" });
  }, 60_000);
});
