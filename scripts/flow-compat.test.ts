// What the plugin refactor of @forgeron/flow (D-155) promised not to change, checked against the
// repository's own files: the flow JSON of today's boards reads and writes as it did (hashes
// recorded with the code before the plugins), and every subpath the plugin docs name is one the
// package exports. These read files, so they live here and not in the package (which has no Node
// types).
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvasStore } from "../packages/canvas/src/index";
import {
  createFlowController,
  emptyGraph,
  flowKinds,
  graphToItems,
  parseFlow,
  serializeFlow,
  type FlowItemData,
} from "../packages/flow/src/index";
import {
  fullCorePlugins,
  minimalCorePlugins,
  typedCorePlugins,
} from "../packages/flow/src/plugins/index";
import { flowPluginDocs } from "../packages/flow/src/plugins/docs/index";
import { describe, expect, it } from "vitest";

const pkgDir = join(dirname(fileURLToPath(import.meta.url)), "..", "packages");
const sha = (text: string) => createHash("sha256").update(text).digest("hex").slice(0, 16);

describe("flow JSON written before the plugins", () => {
  const text = readFileSync(join(pkgDir, "libraries", "boards", "order-to-cash.flow.json"), "utf8");

  it("reads and writes the order-to-cash board as it did", () => {
    const parsed = parseFlow(text);
    expect(parsed.nodes.length).toBeGreaterThan(20);
    const once = serializeFlow(parsed);
    expect(sha(once)).toBe("6bcd7f8321d27c7e");
    expect(serializeFlow(parseFlow(once))).toBe(once);
    expect(Object.keys(JSON.parse(once))).toEqual(["version", "nodes", "edges", "groups"]);
  });

  it("comes out of a controller the same, whatever the plugins", () => {
    // The items write edges by their source node, as they always did.
    for (const plugins of [fullCorePlugins, minimalCorePlugins, typedCorePlugins, []]) {
      const store = createCanvasStore<FlowItemData<unknown>>({
        items: graphToItems(emptyGraph()),
        kinds: flowKinds(),
      });
      const flow = createFlowController(store, { plugins });
      flow.load(serializeFlow(parseFlow(text)));
      expect(sha(flow.toJSON())).toBe("236a7736c6020f5f");
    }
  });
});

describe("the package exports", () => {
  const pkg = JSON.parse(readFileSync(join(pkgDir, "flow", "package.json"), "utf8")) as {
    exports: Record<string, string>;
  };

  it("hold every subpath the plugin docs name, core and editor", () => {
    for (const doc of flowPluginDocs) {
      for (const path of [doc.core, doc.editor]) {
        expect(path.startsWith("@forgeron/flow/")).toBe(true);
        const target = pkg.exports[`./${path.slice("@forgeron/flow/".length)}`];
        expect(target).toMatch(/^\.\/src\/.*\.tsx?$/);
        readFileSync(join(pkgDir, "flow", target!), "utf8");
      }
    }
  });

  it("keep `.`, `./react` and `./styles.css`, and add the plugin entry points", () => {
    for (const key of [".", "./react", "./styles.css", "./plugins", "./plugins/editor"]) {
      expect(pkg.exports[key]).toBeDefined();
    }
  });
});
