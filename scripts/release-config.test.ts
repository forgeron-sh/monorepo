import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

// The shape of `release-please-config.json` that lets the platform's own release be tagged (D-140).
// release-please takes a release PR whose body has one section and no component as a standalone
// release, and compares the component of its branch (none) with the one configured for the path: with
// `"component": "platform"` on the root they differ, nothing is tagged, `v<version>` and the platform
// artifact never exist, and every later release PR is refused. The root's tag is `v<version>` (the
// deploy action of a tool's repository is referenced by it), so it has no component at all.

const config = JSON.parse(
  await readFile(new URL("../release-please-config.json", import.meta.url), "utf8"),
) as {
  packages: Record<
    string,
    { component?: string; "package-name"?: string; "include-component-in-tag"?: boolean }
  >;
  plugins: Array<{ type: string; components?: string[] }>;
};

describe("release-please-config.json", () => {
  const root = config.packages["."]!;

  it("gives the root no component, so that its release is tagged v<version>", () => {
    expect(root.component).toBeUndefined();
    expect(root["package-name"]).toBe("");
    expect(root["include-component-in-tag"]).toBe(false);
  });

  it("gives every other path a component, and lists them in the linked versions", () => {
    const others = Object.entries(config.packages).filter(([path]) => path !== ".");
    expect(others.filter(([, entry]) => !entry.component).map(([path]) => path)).toEqual([]);
    const linked = config.plugins.find((p) => p.type === "linked-versions")!;
    expect([...(linked.components ?? [])].sort()).toEqual(
      others.map(([, entry]) => entry.component!).sort(),
    );
  });
});
