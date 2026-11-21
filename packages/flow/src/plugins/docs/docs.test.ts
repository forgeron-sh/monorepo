import { describe, expect, it } from "vitest";
import { parseFlow } from "../../core/serialize";
import { fullCorePlugins } from "../index";
import { flowPluginDocs } from "./index";

describe("the plugin docs", () => {
  it("document every bundled plugin once, with the id of its core half", () => {
    const ids = flowPluginDocs.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual(fullCorePlugins.map((p) => p.id).sort());
    for (const doc of flowPluginDocs) {
      const plugin = fullCorePlugins.find((p) => p.id === doc.id)!;
      expect(doc.name).toBe(plugin.name);
      expect(doc.requires ?? []).toEqual(plugin.requires ?? []);
      expect(doc.summary.length).toBeGreaterThan(30);
      expect(doc.usage.length).toBeGreaterThan(20);
    }
  });

  it("carry a JSON sample that the reader accepts", () => {
    for (const doc of flowPluginDocs) {
      expect(doc.json).toBeDefined();
      const graph = parseFlow(doc.json!);
      expect(graph.nodes.length).toBeGreaterThan(0);
    }
  });
});
