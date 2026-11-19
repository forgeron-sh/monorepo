// The core is framework-free. dependency-cruiser does not follow third-party packages (they are
// excluded from its graph), so the half of the rule about React, Tiptap, ProseMirror and Yjs is
// checked here, on the import specifiers themselves.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const src = join(dirname(fileURLToPath(import.meta.url)), "..", "packages", "richtext", "src");

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(dir, e.name)) : e.name.endsWith(".ts") ? [join(dir, e.name)] : [],
  );
}

const specifiers = (file: string) =>
  [...readFileSync(file, "utf8").matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)].map(
    (m) => m[1] as string,
  );

describe("the core of richtext", () => {
  const core = [...files(join(src, "core")), join(src, "index.ts")].filter(
    (f) => !f.endsWith(".test.ts"),
  );

  it("imports nothing but its own files", () => {
    expect(core.length).toBeGreaterThan(4);
    const offenders = core.flatMap((file) =>
      specifiers(file)
        .filter((spec) => !(spec.startsWith(".") && !/\/(react|tiptap|collab)\//.test(spec)))
        .map((spec) => `${file}: ${spec}`),
    );
    expect(offenders).toEqual([]);
  });
});
