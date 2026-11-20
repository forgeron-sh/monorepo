import { describe, expect, it } from "vitest";
import { emptyGraph, indexGraph, type FlowGraph, type FlowNode } from "../../core/model";
import { edgePath } from "../edges";
import {
  edgeAt,
  farEdgeGroups,
  farEdges,
  farGroups,
  farNode,
  flattenPath,
  groupFrames,
  groupLabelAt,
} from "./far-view";

const node = (id: string, x: number, y: number): FlowNode<null> => ({
  id,
  type: "step",
  position: { x, y },
  size: { w: 240, h: 80 },
  inputs: [{ id: "in" }],
  outputs: [{ id: "out" }],
  data: null,
});

describe("the far view of a flow", () => {
  it("flattens an edge's path: its ends where the path has them", () => {
    const bezier = flattenPath(edgePath({ x: 0, y: 0 }, { x: 200, y: 100 }).d, 8);
    expect(bezier.slice(0, 2)).toEqual([0, 0]);
    expect(bezier.slice(-2)).toEqual([194, 100]);
    expect(bezier.length).toBe(2 + 8 * 2);
    expect(flattenPath(edgePath({ x: 0, y: 0 }, { x: 200, y: 100 }, "orthogonal").d)).toEqual([
      0, 0, 97, 0, 97, 100, 194, 100,
    ]);
  });

  it("draws a node as a box with its name, an edge as a line and its head, in run colours", () => {
    expect(farNode(node("a", 0, 0), "error", "Step a", false)).toMatchObject([
      { type: "rect", stroke: "--danger", strokeWidth: 2, fill: "--bg" },
      { type: "text", text: "Step a", size: 26, maxWidth: 208 },
    ]);
    expect(farNode(node("a", 0, 0), "idle", "a", true)[0]).toMatchObject({ stroke: "--accent" });
    // A failure that was handled: the failure's colour, and a mark in the corner.
    expect(farNode(node("a", 0, 0), "handled", "Step a", false)).toMatchObject([
      { type: "rect", stroke: "--danger" },
      { type: "text", maxWidth: 188 },
      { type: "rect", x: 220, y: 0, w: 20, h: 20, fill: "--danger" },
    ]);
    const g: FlowGraph<null> = {
      ...emptyGraph<null>(),
      nodes: [node("a", 0, 0), node("b", 400, 0)],
      edges: [{ id: "e", from: { node: "a", port: "out" }, to: { node: "b", port: "in" } }],
    };
    const prims = farEdges(indexGraph(g), g.edges, "bezier", undefined, new Set(["e"]));
    expect(prims.map((p) => p.type)).toEqual(["line", "triangle"]);
    expect(prims[0]).toMatchObject({ color: "--accent", width: 2 });
    expect(farEdges(indexGraph(g), g.edges, "bezier", undefined, new Set())[0]).toMatchObject({
      color: "--line-strong",
      width: 1.5,
    });
  });

  const pair: FlowGraph<null> = {
    ...emptyGraph<null>(),
    nodes: [node("a", 0, 0), node("b", 400, 0)],
    edges: [{ id: "e", from: { node: "a", port: "out" }, to: { node: "b", port: "in" } }],
  };

  it("draws a node's ports and its dashed border when skipped, from far", () => {
    const prims = farNode(node("a", 0, 0), "skipped", "a", false, {
      farZoom: 0.4,
      portColor: (t) => (t === "x" ? "--accent" : undefined),
    });
    expect(prims[0]).toMatchObject({ dash: [6, 6] });
    // The input on the left, the output on the right, 5 units out, halfway down.
    expect(prims.slice(2)).toMatchObject([
      { type: "rect", x: -5, y: 35, w: 9, h: 9, crisp: true },
      { type: "rect", x: 236, y: 35, w: 9, h: 9 },
    ]);
  });

  it("gives each edge its own group, its dashes, marching dashes and arrowhead by state", () => {
    const run = { nodes: {}, edges: { e: "running" as const } };
    const [e] = farEdgeGroups(indexGraph(pair), pair.edges, "bezier", run);
    expect(e!.group.key).toBe("e");
    expect(e!.group.prims.map((p) => p.type)).toEqual(["line", "line", "triangle"]);
    expect(e!.group.prims[1]).toMatchObject({ dash: [4, 8], march: 20, color: "--accent" });
    // A curve meets end to end at its joints; its ends are butt.
    expect(e!.group.prims[0]).toMatchObject({ cap: "butt", joins: "butt" });
    const skipped = farEdgeGroups(indexGraph(pair), pair.edges, "bezier", {
      nodes: {},
      edges: { e: "skipped" },
    });
    expect(skipped[0]!.group.prims[0]).toMatchObject({ dash: [3, 4], color: "--line" });
    // Under the pointer it is drawn as selected; without the arrows plugin, no head.
    const hot = farEdgeGroups(indexGraph(pair), pair.edges, "bezier", undefined, {
      hover: "e",
      arrows: false,
    });
    expect(hot[0]!.group.prims).toMatchObject([{ color: "--accent", width: 2 }]);
    // The same path and look: the same shapes, so the canvas packs nothing again.
    const cache = new Map();
    const one = farEdgeGroups(indexGraph(pair), pair.edges, "bezier", undefined, {}, cache);
    const two = farEdgeGroups(indexGraph(pair), pair.edges, "bezier", undefined, {}, cache);
    expect(two[0]!.group).toBe(one[0]!.group);
  });

  it("finds the edge under a point within reach, and a group's label", () => {
    const edges = farEdgeGroups(indexGraph(pair), pair.edges, "bezier", undefined);
    // From (240, 40) to (394, 40): a level line.
    expect(edgeAt(edges, { x: 300, y: 44 }, 6)?.id).toBe("e");
    expect(edgeAt(edges, { x: 300, y: 60 }, 6)).toBeNull();
    const g = { ...pair, groups: [{ id: "g", label: "Billing", nodes: ["a"] }] };
    const frames = groupFrames(indexGraph(g), g.groups, () => ({ x: -20, y: -40, w: 280, h: 140 }));
    expect(frames[0]!.label).toEqual({ x: -20, y: -40, w: 65, h: 20 });
    expect(groupLabelAt(frames, { x: 0, y: -30 })?.id).toBe("g");
    expect(groupLabelAt(frames, { x: 100, y: -30 })).toBeNull();
    const [frame] = farGroups(frames, "g");
    expect(frame!.key).toBe("group:g");
    expect(frame!.prims).toMatchObject([
      { type: "rect", x: -20.5, y: -40.5, w: 281, h: 141, dash: [4, 3] },
      { type: "rect", stroke: "--accent" },
      { type: "text", text: "Billing", font: "mono", size: 11, baseline: true },
    ]);
  });

  it("flattens a long curve finely enough to stay smooth at 200 %", () => {
    const d = edgePath({ x: 0, y: 0 }, { x: 800, y: 400 }).d;
    expect(flattenPath(d).length / 2 - 1).toBe(48);
    expect(flattenPath(d, 8).length).toBe(2 + 8 * 2);
  });
});
