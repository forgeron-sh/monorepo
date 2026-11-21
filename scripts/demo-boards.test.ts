// The demo documents in packages/libraries/boards/: they parse with the editors' readers, hold
// what the demos promise, and are what `bun scripts/demo-boards.ts` writes today.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseBoard, type DrawItem } from "../packages/draw/src/index";
import {
  checkConnection,
  groupBounds,
  indexGraph,
  parseFlow,
  planRun,
  type FlowGraph,
} from "../packages/flow/src/index";
import { ORDER_TO_CASH_FILE, WORKSHOP_FILE } from "./demo-boards";
import { demoOutcome, orderToCash, type DemoStep } from "./demo/order-to-cash";
import { q1Workshop } from "./demo/workshop";

describe("q1-workshop.draw.json", () => {
  const json = readFileSync(WORKSHOP_FILE, "utf8");
  const { items } = parseBoard(json);
  const byId = new Map(items.map((i) => [i.id, i] as const));

  it("is a large board of every kind, each item in a frame", () => {
    expect(items.length).toBeGreaterThanOrEqual(2500);
    const kinds = new Set(items.map((i) => i.kind));
    for (const k of [
      "frame",
      "sticky",
      "text",
      "rectangle",
      "ellipse",
      "diamond",
      "arrow",
      "pen",
      "image",
    ])
      expect(kinds).toContain(k);
    const frames = items.filter((i) => i.kind === "frame");
    expect(frames.length).toBeGreaterThanOrEqual(10);
    const outside = items.filter((item) => {
      if (item.data.type === "frame") return false;
      const frame = byId.get(item.data.frame ?? "");
      return frame?.kind !== "frame" || item.z <= frame.z;
    });
    expect(outside.map((i) => i.id)).toEqual([]);
  });

  it("binds its arrows to items that exist", () => {
    const arrows = items.filter((i) => i.data.type === "arrow");
    expect(arrows.length).toBeGreaterThan(50);
    const binds = arrows.flatMap((a) =>
      a.data.type === "arrow" ? [a.data.start.bind, a.data.end.bind].filter(Boolean) : [],
    );
    expect(binds.length).toBeGreaterThan(100);
    const targets = new Set(binds.map((id) => byId.get(id!)?.kind));
    for (const k of ["arrow", "frame", undefined]) expect(targets).not.toContain(k);
  });

  it("is what the generator writes", () => {
    // Its text and its order, not every float: Bun and Node round trigonometry and deflate a
    // PNG differently, and the generator runs on Bun.
    const shape = (list: ReadonlyArray<DrawItem>) =>
      list.map((i) => {
        const d = i.data as { text?: string; name?: string; frame?: string };
        return [i.id, i.kind, i.z, d.frame ?? "", d.text ?? d.name ?? ""];
      });
    expect(shape(items)).toEqual(shape(q1Workshop().items));
  });
});

describe("order-to-cash.flow.json", () => {
  const json = readFileSync(ORDER_TO_CASH_FILE, "utf8");
  const graph = parseFlow<DemoStep>(json);

  it("is a large grouped flow whose every edge keeps the connection rules", () => {
    expect(graph.nodes.length).toBeGreaterThanOrEqual(300);
    expect(graph.groups.length).toBeGreaterThanOrEqual(10);
    const refused = graph.edges.flatMap((e) => {
      const without: FlowGraph<DemoStep> = { ...graph, edges: graph.edges.filter((x) => x !== e) };
      const error = checkConnection(without, e.from, e.to);
      return error ? [`${e.id}: ${error}`] : [];
    });
    expect(refused).toEqual([]);
  });

  it("runs mostly green, with skipped branches, a handled failure, its retry and one error", () => {
    const run = planRun(graph, demoOutcome).at(-1)!;
    const count = (s: string) => graph.nodes.filter((n) => run.nodes[n.id] === s).length;
    expect(count("error")).toBe(1);
    expect(count("handled")).toBe(1);
    expect(count("success")).toBeGreaterThan(count("skipped"));
    const byTitle = (title: string) => graph.nodes.find((n) => n.data.title === title)!;
    expect(run.nodes[byTitle("Submit to SDI").id]).toBe("handled");
    expect(run.nodes[byTitle("Retry: submit to SDI").id]).toBe("success");
  });

  it("keeps each group together: no two frames overlap", () => {
    const index = indexGraph(graph);
    const frames = graph.groups.map((g) => ({ id: g.id, b: groupBounds(index, g.nodes)! }));
    const clashes = frames.flatMap((f, i) =>
      frames
        .slice(i + 1)
        .filter(
          ({ b }) =>
            f.b.x < b.x + b.w && b.x < f.b.x + f.b.w && f.b.y < b.y + b.h && b.y < f.b.y + f.b.h,
        )
        .map((o) => `${f.id} × ${o.id}`),
    );
    expect(clashes).toEqual([]);
  });

  it("is what the generator writes", () => {
    expect(JSON.parse(json)).toEqual(JSON.parse(orderToCash().json));
  });
});
