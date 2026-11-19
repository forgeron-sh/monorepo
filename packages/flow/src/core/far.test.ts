import { describe, expect, it } from "vitest";
import { farEdges, farNode, flattenPath } from "./far";
import { edgePath } from "./geometry";
import { emptyGraph, indexGraph, type FlowGraph, type FlowNode } from "./model";

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
});
