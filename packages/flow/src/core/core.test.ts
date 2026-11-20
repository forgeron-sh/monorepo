import { createCanvasStore } from "@forgeron/canvas";
import { describe, expect, it } from "vitest";
import { createFlowController, type FlowStore } from "./controller";
import { generateFlowGraph } from "./generate";
import { groupBounds } from "../plugins/groups";
import { edgePath } from "../plugins/edges";
import { edgeBounds, portPoint } from "./geometry";
import {
  canConnect,
  checkConnection,
  connect,
  extractSubgraph,
  insertOnEdge,
  pasteSubgraph,
  reconnect,
  removeNodes,
  topologicalOrder,
} from "./graph";
import {
  flowKinds,
  graphToItems,
  itemsToGraph,
  itemsToGraphAfter,
  type FlowItemData,
} from "./items";
import { applyLayout, layoutGraph } from "../plugins/layout";
import { emptyGraph, indexGraph, type FlowGraph, type FlowNode } from "./model";
import { planRun } from "../plugins/run";
import { FlowFormatError, parseFlow, serializeFlow } from "./serialize";

type Data = { title: string };

const node = (
  id: string,
  inputs: Array<string | { id: string; type?: string; multiple?: boolean }> = ["in"],
  outputs: Array<string | { id: string; type?: string; multiple?: boolean }> = ["out"],
  x = 0,
  y = 0,
): FlowNode<Data> => ({
  id,
  type: "step",
  position: { x, y },
  size: { w: 240, h: 80 },
  inputs: inputs.map((p) => (typeof p === "string" ? { id: p } : p)),
  outputs: outputs.map((p) => (typeof p === "string" ? { id: p } : p)),
  data: { title: id },
});

const graphOf = (
  nodes: FlowNode<Data>[],
  edges: Array<[string, string, string?, string?]> = [],
) => {
  const g: FlowGraph<Data> = { ...emptyGraph<Data>(), nodes };
  return {
    ...g,
    edges: edges.map(([a, b, op = "out", ip = "in"], i) => ({
      id: `e${i}`,
      from: { node: a, port: op },
      to: { node: b, port: ip },
    })),
  };
};

const ref = (node: string, port: string) => ({ node, port });

describe("connection rules", () => {
  const g = graphOf(
    [
      node("t", [], ["out"]),
      node("a"),
      node("b", [{ id: "in", type: "boolean" }]),
      node("m", [{ id: "in", multiple: true }]),
      node("x", ["in"], [{ id: "out", type: "items" }]),
    ],
    [["t", "a"]],
  );

  it("joins an output to a free input", () => {
    const r = connect(g, ref("a", "out"), ref("m", "in"));
    expect(r.ok && r.graph.edges.at(-1)).toMatchObject({
      from: ref("a", "out"),
      to: ref("m", "in"),
    });
  });

  it("says why it refuses", () => {
    expect(checkConnection(g, ref("a", "out"), ref("a", "in"))).toBe("same-node");
    expect(checkConnection(g, ref("a", "nope"), ref("m", "in"))).toBe("missing-port");
    expect(checkConnection(g, ref("a", "out"), ref("zz", "in"))).toBe("missing-node");
    expect(checkConnection(g, ref("x", "out"), ref("b", "in"))).toBe("type");
    expect(checkConnection(g, ref("t", "out"), ref("a", "in"))).toBe("duplicate");
    expect(checkConnection(g, ref("m", "out"), ref("a", "in"))).toBe("occupied");
  });

  it("lets `any` meet every type and a merge take several edges", () => {
    expect(canConnect(g, ref("a", "out"), ref("b", "in"))).toBe(true);
    const once = connect(g, ref("a", "out"), ref("m", "in"));
    expect(once.ok && canConnect(once.graph, ref("t", "out"), ref("m", "in"))).toBe(true);
  });

  it("forbids cycles by default and allows them when asked", () => {
    const chain = graphOf(
      [node("a"), node("b"), node("c")],
      [
        ["a", "b"],
        ["b", "c"],
      ],
    );
    const multi = {
      ...chain,
      nodes: chain.nodes.map((n) => ({ ...n, inputs: [{ id: "in", multiple: true }] })),
    };
    expect(checkConnection(multi, ref("c", "out"), ref("a", "in"))).toBe("cycle");
    expect(checkConnection(multi, ref("c", "out"), ref("a", "in"), { cycles: "allow" })).toBeNull();
  });

  it("takes a custom type rule", () => {
    const compatible = (a: string, b: string) => a === "items" && b === "boolean";
    expect(canConnect(g, ref("x", "out"), ref("b", "in"), { compatible })).toBe(true);
  });

  it("reconnects an edge without counting it against itself", () => {
    const two = graphOf([node("t", [], ["out"]), node("a"), node("b")], [["t", "a"]]);
    const r = reconnect(two, "e0", "to", ref("b", "in"));
    expect(r.ok && r.graph.edges).toEqual([
      { id: "e0", from: ref("t", "out"), to: ref("b", "in") },
    ]);
  });

  it("inserts a node on an edge", () => {
    const two = graphOf([node("a"), node("b")], [["a", "b"]]);
    const r = insertOnEdge(two, "e0", node("n"));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.graph.edges.map((e) => `${e.from.node}>${e.to.node}`)).toEqual(["a>n", "n>b"]);
    expect(r.graph.edges[0]!.id).toBe("e0");
  });

  it("removes a node with its edges and its place in a group", () => {
    const three = {
      ...graphOf(
        [node("a"), node("b"), node("c")],
        [
          ["a", "b"],
          ["b", "c"],
        ],
      ),
      groups: [{ id: "g", label: "G", nodes: ["b"] }],
    };
    const r = removeNodes(three, ["b"]);
    expect(r.edges).toEqual([]);
    expect(r.groups).toEqual([]);
  });

  it("copies a subgraph and pastes it under new ids", () => {
    const three = graphOf(
      [node("a"), node("b"), node("c")],
      [
        ["a", "b"],
        ["b", "c"],
      ],
    );
    const part = extractSubgraph(three, ["b", "c"]);
    expect(part.edges).toHaveLength(1);
    const { graph, ids } = pasteSubgraph(three, part, { x: 20, y: 20 });
    expect(graph.nodes).toHaveLength(5);
    const copied = graph.edges.at(-1)!;
    expect(copied.from.node).toBe(ids.get("b"));
    expect(copied.to.node).toBe(ids.get("c"));
    expect(graph.nodes.at(-1)!.position).toEqual({ x: 20, y: 20 });
  });

  it("orders nodes so every edge goes forward", () => {
    const g2 = graphOf(
      [node("c"), node("a"), node("b")],
      [
        ["a", "b"],
        ["b", "c"],
      ],
    );
    expect(topologicalOrder(g2)).toEqual(["a", "b", "c"]);
  });
});

describe("geometry", () => {
  it("puts inputs on the left and outputs on the right, spread down the side", () => {
    const n = node("n", ["in"], ["true", "false"], 100, 200);
    expect(portPoint(n, "in", "in")).toEqual({ x: 100, y: 240 });
    expect(portPoint(n, "out", "true")).toEqual({ x: 340, y: 227 });
    expect(portPoint(n, "out", "false")).toEqual({ x: 340, y: 253 });
  });

  it("draws orthogonal edges with square corners and loops back edges under the nodes", () => {
    expect(edgePath({ x: 0, y: 0 }, { x: 200, y: 40 }, "orthogonal").d).toBe("M0 0H97V40H194");
    const back = edgePath({ x: 300, y: 40 }, { x: 0, y: 40 }, "orthogonal", [
      { x: 60, y: 0, w: 240, h: 80 },
      { x: 0, y: 0, w: 240, h: 80 },
    ]);
    expect(back.d).toBe("M300 40H320V100H-26V40H-6");
  });
});

describe("edge bounds", () => {
  it("holds a bezier's control points, an orthogonal loop and the arrowhead", () => {
    const back = edgePath({ x: 300, y: 40 }, { x: 0, y: 40 });
    // A backward curve bulges right of its start and left of its end, to its control points.
    expect(edgeBounds(back)).toEqual({ x: -159, y: 34, w: 612, h: 12 });
    const loop = edgePath({ x: 300, y: 40 }, { x: 0, y: 40 }, "orthogonal");
    const b = edgeBounds(loop);
    expect(b.y + b.h).toBe(100);
    expect(b.x).toBe(-26);
    expect(b.x + b.w).toBe(320);
  });
});

describe("auto-layout", () => {
  const flow = graphOf(
    [
      node("trigger", [], ["out"]),
      node("fetch"),
      node("if", ["in"], ["true", "false"]),
      node("notify"),
      node("task"),
      node("mail"),
      node("end", [{ id: "in", multiple: true }]),
    ],
    [
      ["trigger", "fetch"],
      ["fetch", "if"],
      ["if", "notify", "true"],
      ["notify", "task"],
      ["if", "mail", "false"],
      ["task", "end"],
      ["mail", "end"],
    ],
  );

  it("lays a flow out left to right, in layers, on the grid", () => {
    const r = layoutGraph(flow);
    expect(r.layers).toEqual([
      ["trigger"],
      ["fetch"],
      ["if"],
      ["notify", "mail"],
      ["task"],
      ["end"],
    ]);
    const p = (id: string) => r.positions.get(id)!;
    expect(p("fetch").x).toBeGreaterThan(p("trigger").x);
    // The true branch above the false one.
    expect(p("notify").y).toBeLessThan(p("mail").y);
    for (const q of r.positions.values()) {
      expect(q.x % 20).toBe(0);
      expect(q.y % 20).toBe(0);
    }
    expect(r.crossings).toBe(0);
  });

  it("is deterministic", () => {
    const g = generateFlowGraph({ nodes: 120, edges: 170, seed: 7 });
    const a = layoutGraph(g);
    const b = layoutGraph(structuredClone(g));
    expect([...a.positions]).toEqual([...b.positions]);
  });

  it("never overlaps two nodes, on 500 nodes and 700 edges", () => {
    const g = generateFlowGraph({ nodes: 500, edges: 700, seed: 3 });
    expect(g.edges).toHaveLength(700);
    const laid = applyLayout(g, layoutGraph(g));
    const boxes = laid.nodes.map((n) => ({ ...n.position, ...n.size }));
    let overlaps = 0;
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i]!;
        const b = boxes[j]!;
        if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) overlaps++;
      }
    }
    expect(overlaps).toBe(0);
  });

  /** Frames that overlap, and nodes inside a frame they are not in, after a layout. */
  const frameClashes = <D>(g: FlowGraph<D>) => {
    const laid = applyLayout(g, layoutGraph(g));
    const index = indexGraph(laid);
    const frames = laid.groups.map((group) => ({ group, b: groupBounds(index, group.nodes)! }));
    const hit = (a: { x: number; y: number; w: number; h: number }, b: typeof a) =>
      a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    const clashes: string[] = [];
    for (let i = 0; i < frames.length; i++) {
      for (let j = i + 1; j < frames.length; j++) {
        if (hit(frames[i]!.b, frames[j]!.b))
          clashes.push(`${frames[i]!.group.id} × ${frames[j]!.group.id}`);
      }
      const own = new Set(frames[i]!.group.nodes);
      for (const n of laid.nodes) {
        if (!own.has(n.id) && hit(frames[i]!.b, { ...n.position, ...n.size }))
          clashes.push(`${n.id} in ${frames[i]!.group.id}`);
      }
    }
    return clashes;
  };

  it("keeps each group together: no two frames overlap, no node in another's frame", () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const g = generateFlowGraph({ nodes: 200, edges: 280, seed });
      // Groups of runs of nodes, as a person makes them, and groups picked at random.
      const runs = Array.from({ length: 8 }, (_, k) => ({
        id: `run-${k}`,
        label: `Run ${k}`,
        nodes: g.nodes.slice(k * 20 + seed, k * 20 + seed + 12).map((n) => n.id),
      }));
      expect(frameClashes({ ...g, groups: runs })).toEqual([]);
      let state = seed * 7919;
      const rand = () => (state = (state * 48271) % 2147483647) / 2147483647;
      const picked: FlowGraph["groups"] = Array.from({ length: 6 }, (_, k) => ({
        id: `pick-${k}`,
        label: `Pick ${k}`,
        nodes: [],
      }));
      for (const n of g.nodes) {
        const k = Math.floor(rand() * 10);
        if (k < 6) picked[k]!.nodes.push(n.id);
      }
      expect(frameClashes({ ...g, groups: picked })).toEqual([]);
    }
  });

  it("lays groups out deterministically, on the grid, nodes apart", () => {
    const g = generateFlowGraph({ nodes: 120, edges: 170, seed: 9 });
    const grouped = {
      ...g,
      groups: [0, 1, 2].map((k) => ({
        id: `g${k}`,
        label: `G${k}`,
        nodes: g.nodes.slice(k * 30, k * 30 + 25).map((n) => n.id),
      })),
    };
    const a = layoutGraph(grouped);
    expect([...a.positions]).toEqual([...layoutGraph(structuredClone(grouped)).positions]);
    for (const q of a.positions.values()) {
      expect(q.x % 20).toBe(0);
      expect(q.y % 20).toBe(0);
    }
    expect(a.layers.flat().sort()).toEqual(g.nodes.map((n) => n.id).sort());
  });

  it("breaks cycles instead of failing on them", () => {
    const loop = graphOf(
      [node("a"), node("b"), node("c")],
      [
        ["a", "b"],
        ["b", "c"],
        ["c", "a"],
      ],
    );
    const r = layoutGraph(loop);
    expect(r.reversed).toEqual(["e2"]);
    expect(r.layers).toEqual([["a"], ["b"], ["c"]]);
  });
});

describe("run state", () => {
  const flow = graphOf(
    [
      node("t", [], ["out"]),
      node("if", ["in"], ["true", "false"]),
      node("yes"),
      node("no"),
      node("after"),
    ],
    [
      ["t", "if"],
      ["if", "yes", "true"],
      ["if", "no", "false"],
      ["no", "after"],
    ],
  );

  it("runs wave by wave and skips the branch not taken", () => {
    const frames = planRun(flow, (n) =>
      n.id === "if" ? { status: "success", ports: ["true"] } : { status: "success" },
    );
    expect(frames[0]!.nodes).toEqual({ t: "running" });
    const last = frames.at(-1)!;
    expect(last.nodes).toEqual({
      t: "success",
      if: "success",
      yes: "success",
      no: "skipped",
      after: "skipped",
    });
    expect(last.edges).toEqual({ e0: "success", e1: "success", e2: "skipped", e3: "skipped" });
    // An edge carries items between its source finishing and its target starting.
    expect(frames.some((f) => f.edges.e1 === "running")).toBe(true);
  });

  it("stops after an error", () => {
    const last = planRun(flow, (n) =>
      n.id === "if" ? { status: "error" } : { status: "success" },
    ).at(-1)!;
    expect(last.nodes.if).toBe("error");
    expect(last.nodes.yes).toBe("skipped");
  });

  it("shows a failure sent on through an error port as handled, not as a success", () => {
    const retry = graphOf(
      [
        node("t", [], ["out"]),
        node("call", ["in"], ["out", { id: "error", type: "error" }]),
        node("retry", [{ id: "in", type: "error" }], ["ok"]),
        node("next", [{ id: "in", multiple: true }]),
      ],
      [
        ["t", "call"],
        ["call", "next", "out"],
        ["call", "retry", "error"],
        ["retry", "next", "ok"],
      ],
    );
    const decide = (n: FlowNode<Data>) =>
      n.id === "call"
        ? ({ status: "error", ports: ["error"] } as const)
        : ({ status: "success" } as const);
    const frames = planRun(retry, decide);
    const last = frames.at(-1)!;
    expect(last.nodes).toEqual({
      t: "success",
      call: "handled",
      retry: "success",
      next: "success",
    });
    expect(last.edges).toEqual({ e0: "success", e1: "skipped", e2: "success", e3: "success" });
    expect(planRun(retry, decide)).toEqual(frames);
  });
});

describe("JSON", () => {
  const g = {
    ...graphOf([node("a"), node("b")], [["a", "b"]]),
    groups: [{ id: "g1", label: "Pair", nodes: ["a", "b"] }],
  };

  it("round-trips a graph", () => {
    expect(parseFlow(serializeFlow(g))).toEqual(g);
  });

  it("round-trips through canvas items", () => {
    expect(itemsToGraph(graphToItems(g))).toEqual(g);
  });

  it("refuses what it cannot read", () => {
    expect(() => parseFlow("{")).toThrow(FlowFormatError);
    expect(() => parseFlow(JSON.stringify({ ...g, version: 2 }))).toThrow(/version/);
    const bad = { ...g, edges: [{ id: "e", from: ref("a", "nope"), to: ref("b", "in") }] };
    expect(() => parseFlow(JSON.stringify(bad))).toThrow(/no output "nope"/);
    const dup = { ...g, nodes: [...g.nodes, node("a")] };
    expect(() => parseFlow(JSON.stringify(dup))).toThrow(/twice/);
  });
});

describe("the controller on a canvas store", () => {
  const make = () => {
    const g = graphOf(
      [
        node("t", [], ["out"], 0, 0),
        node("a", ["in"], ["out"], 300, 0),
        node("b", ["in"], ["out"], 600, 0),
      ],
      [["t", "a"]],
    );
    const store: FlowStore<Data> = createCanvasStore<FlowItemData<Data>>({
      items: graphToItems(g),
      kinds: flowKinds<Data>(),
    });
    return { store, flow: createFlowController(store) };
  };

  it("connects from canvas ends, dropping on a node picks a free input", () => {
    const { flow } = make();
    expect(flow.canConnectEnds({ itemId: "a", handle: "out:out" }, { itemId: "b" })).toBe(true);
    const r = flow.connectEnds({ itemId: "a", handle: "out:out" }, { itemId: "b" });
    expect(r?.ok).toBe(true);
    expect(flow.graph().edges.map((e) => e.to.node)).toEqual(["a", "b"]);
    // From an input backwards to an output.
    expect(flow.canConnectEnds({ itemId: "a", handle: "in:in" }, { itemId: "b" })).toBe(false);
  });

  it("deletes a node and the edges into it as one undo step", () => {
    const { store, flow } = make();
    store.select(["a"]);
    flow.deleteSelection();
    expect(flow.graph().nodes.map((n) => n.id)).toEqual(["t", "b"]);
    expect(flow.graph().edges).toEqual([]);
    store.undo();
    expect(flow.graph().edges).toHaveLength(1);
    expect(store.getState().canUndo).toBe(false);
  });

  it("duplicates and pastes with internal edges", () => {
    const { store, flow } = make();
    store.select(["t", "a"]);
    const created = flow.duplicateSelection();
    expect(created).toHaveLength(2);
    expect(flow.graph().edges).toHaveLength(2);
    const json = flow.copySelection()!;
    expect(parseFlow(json).nodes).toHaveLength(2);
    flow.paste(json, { x: 1000, y: 1000 });
    expect(flow.graph().nodes.at(-2)!.position).toEqual({ x: 1000, y: 1000 });
  });

  it("lays out as one undo step", () => {
    const { store, flow } = make();
    store.update("b", { bounds: { x: 37, y: 900, w: 240, h: 80 } });
    flow.autoLayout();
    const before = store.getState().items.map((i) => i.bounds);
    expect(before.every((b) => b.x % 20 === 0 && b.y % 20 === 0)).toBe(true);
    store.undo();
    expect(store.get("b")!.bounds.y).toBe(900);
  });
});

describe("reading a graph again after a drag", () => {
  it("keeps the edges, the groups and the index when the items only moved", () => {
    const graph = generateFlowGraph({ nodes: 40, edges: 56 });
    const items = graphToItems(graph);
    const first = itemsToGraph(items);
    const firstIndex = indexGraph(first);
    const moved = items.map((i, n) =>
      n % 2 ? { ...i, bounds: { ...i.bounds, x: i.bounds.x + 30 } } : i,
    );
    const next = itemsToGraphAfter(moved, { items, graph: first });
    expect(next).toEqual(itemsToGraph(moved));
    expect(next.edges).toBe(first.edges);
    expect(next.groups).toBe(first.groups);
    // An item that did not change keeps its node.
    expect(next.nodes[0]).toBe(first.nodes[0]);
    const index = indexGraph(next);
    expect(index.out).toBe(firstIndex.out);
    expect(index.nodes.get(next.nodes[1]!.id)).toBe(next.nodes[1]);
    // Data changed (an edge added, a port renamed): read again.
    const changed = moved.map((i, n) => (n === 0 ? { ...i, data: { ...i.data, out: [] } } : i));
    const again = itemsToGraphAfter(changed, { items: moved, graph: next });
    expect(again).toEqual(itemsToGraph(changed));
    expect(again.edges).not.toBe(first.edges);
  });
});
