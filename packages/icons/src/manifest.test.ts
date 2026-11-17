import { describe, expect, it } from "vitest";
import snapshotData from "../data/hugeicons-names.json";
import { manifest } from "./catalog";
import { generate, type NameSnapshot } from "./generator/core";
import { SAME_AS } from "./generator/same-as";
import * as icons from "./index";
import { hasDuotone } from "./render";
import type { IconDefinition } from "./types";

// The generated files against what the generator would write now: a drawn icon added without
// running `bun run generate`, or a hand edit of src/generated/, fails here.

const exported = Object.entries(icons).filter(
  (e): e is [string, IconDefinition] =>
    typeof e[1] === "object" && e[1] !== null && "implemented" in e[1],
);

describe("manifest and exports", () => {
  it("has one export per manifest entry, and one entry per export", () => {
    const byExport = new Map(exported);
    expect(byExport.size).toBe(manifest.length);
    for (const entry of manifest) {
      const icon = byExport.get(entry.export);
      expect(icon).toBeDefined();
      expect(icon?.name).toBe(entry.name);
      expect(icon?.implemented).toBe(entry.implemented);
    }
  });

  it("is what the generator writes from the snapshot and the drawn icons", () => {
    const drawn = exported
      .map(([, icon]) => icon)
      .filter((icon) => icon.implemented)
      .map((icon) => ({
        name: icon.name,
        style: icon.style,
        duo: hasDuotone(icon),
        grid: icon.grid,
        rows: icon.rows,
      }));
    const { manifest: expected } = generate({
      snapshot: snapshotData as NameSnapshot,
      drawn,
      sameAs: SAME_AS,
    });
    expect(manifest).toEqual(expected);
  });

  it("mirrors every visible Hugeicons name", () => {
    const snapshot = snapshotData as NameSnapshot;
    const names = new Set(manifest.map((e) => e.name));
    const hidden = new Set(snapshot.hidden);
    const visible = snapshot.uncategorized.filter((name) => !hidden.has(name));
    expect(visible.filter((name) => !names.has(name))).toEqual([]);
    for (const entry of manifest.filter((e) => e.source === "forgeron")) {
      expect(snapshot.uncategorized).not.toContain(entry.name);
    }
  });

  it("gives every entry a category, labels and a description", () => {
    for (const entry of manifest) {
      expect(entry.category).not.toBe("");
      expect(entry.labels.length).toBeGreaterThan(0);
      expect(entry.description).not.toBe("");
    }
  });
});
