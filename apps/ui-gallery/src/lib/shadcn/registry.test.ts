import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BASE_ITEM, THEME_ITEM } from "./build";
import { entries, fonts, registryFor, sources } from "./registry";

// Vitest hands `?raw` CSS and `?inline` fonts over empty: read them from the disk here.
const packages = new URL("../../../../../packages/", import.meta.url);
for (const path of sources.keys()) {
  if (path.endsWith(".css")) sources.set(path, readFileSync(new URL(path, packages), "utf8"));
}
for (const file of readdirSync(new URL("ui/tokens/fonts/", packages))) {
  fonts[file] = "data:font/otf;base64,AAAA";
}

describe("the shadcn registry of the gallery", () => {
  const registry = registryFor(new URL("https://ui.forgeron.sh"));

  it("has an item per entry, the shared one and the theme", () => {
    expect(registry.items.size).toBe(entries.length + 2);
    expect(registry.items.get(BASE_ITEM)?.files?.map((f) => f.target)).toEqual([
      "components/forgeron/cx.ts",
      "components/forgeron/forgeron.css",
    ]);
    expect(registry.items.get(THEME_ITEM)?.cssVars?.dark?.primary).toBe("#ff4f1f");
    expect(registry.index.items).toHaveLength(registry.items.size);
  });

  it("ships no import a user project cannot resolve, and no token of ours unprefixed", () => {
    for (const item of registry.items.values()) {
      for (const file of item.files ?? []) {
        expect(file.content, `${item.name}: ${file.target}`).not.toMatch(/["']@forgeron\//);
        expect(file.content, `${item.name}: ${file.target}`).not.toMatch(
          /var\(--(bg|ink|line|accent|danger|space-\d+)\)/,
        );
      }
    }
  });

  it("gives the button with what it imports, not the shared files", () => {
    const button = registry.items.get("button")!;
    expect(button.registryDependencies).toEqual(["https://ui.forgeron.sh/r/forgeron.json"]);
    const targets = button.files!.map((f) => f.target);
    expect(targets).toContain("components/forgeron/button.tsx");
    expect(targets).toContain("components/forgeron/led.tsx");
    expect(targets).not.toContain("components/forgeron/cx.ts");
  });
});
