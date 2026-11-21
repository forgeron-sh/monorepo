import { resizeBounds, resizeRule, type Item } from "@forgeron/canvas";
import { describe, expect, it } from "vitest";
import {
  align,
  arrowEnds,
  arrowItem,
  createDrawStore,
  distribute,
  drawKinds,
  exportSvg,
  frameItem,
  group,
  parseBoard,
  penFromPoints,
  serializeBoard,
  shapeItem,
  simplify,
  stickyHeight,
  stickyItem,
  strokePath,
  strokePixels,
  textItem,
  toPixels,
  type ArrowData,
  type DrawData,
  type DrawItem,
  type FrameData,
  type PenData,
} from "../index";

const hit = (item: DrawItem, x: number, y: number) =>
  (drawKinds[item.kind]?.hitTest ?? (() => true))(item, { x, y });

const make = (n: ReturnType<typeof shapeItem>, id: string, z = 0): DrawItem =>
  ({ ...n, id, z }) as DrawItem;

const store = () => createDrawStore({ grid: { snap: false } });

const arrow = (s: ReturnType<typeof store>, id: string) => s.get(id) as DrawItem<ArrowData>;

describe("hit tests", () => {
  it("a rectangle is its box, an ellipse and a diamond leave their corners", () => {
    const b = { x: 0, y: 0, w: 100, h: 60 };
    expect(hit(make(shapeItem("rectangle", b), "r"), 2, 2)).toBe(true);
    const e = make(shapeItem("ellipse", b), "e");
    expect(hit(e, 50, 30)).toBe(true);
    expect(hit(e, 3, 3)).toBe(false);
    const d = make(shapeItem("diamond", b), "d");
    expect(hit(d, 50, 30)).toBe(true);
    expect(hit(d, 10, 5)).toBe(false);
    expect(hit(d, 50, 2)).toBe(true);
  });

  it("an arrow is hit near its route only", () => {
    const a = { ...arrowItem({ x: 0, y: 0 }, { x: 200, y: 100 }, () => undefined), id: "a", z: 0 };
    expect(hit(a as DrawItem, 100, 50)).toBe(true);
    expect(hit(a as DrawItem, 100, 54)).toBe(true);
    expect(hit(a as DrawItem, 30, 80)).toBe(false);
  });

  it("an elbow arrow is hit on its bends", () => {
    const a = {
      ...arrowItem({ x: 0, y: 0 }, { x: 200, y: 100 }, () => undefined, { route: "elbow" }),
      id: "a",
      z: 0,
    } as DrawItem<ArrowData>;
    expect(hit(a, 100, 50)).toBe(true);
    expect(hit(a, 150, 100)).toBe(true);
    expect(hit(a, 50, 70)).toBe(false);
  });

  it("a pen stroke is hit on its pixels, not across its box", () => {
    const g = penFromPoints(
      [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ],
      { color: "ink", weight: 1 },
    )!;
    const p = { id: "p", kind: "pen", z: 0, ...g } as DrawItem<PenData>;
    expect(hit(p, 50, 50)).toBe(true);
    expect(hit(p, 90, 10)).toBe(false);
  });

  it("a frame is grabbed by its name strip and its edge, not its inside", () => {
    const f = make(frameItem({ x: 0, y: 0, w: 400, h: 300 }, "One"), "f");
    expect(hit(f, 200, 10)).toBe(true);
    expect(hit(f, 2, 200)).toBe(true);
    expect(hit(f, 200, 150)).toBe(false);
  });
});

describe("resize rules", () => {
  const rule = (kind: string) =>
    resizeRule(drawKinds, {
      id: "x",
      kind,
      bounds: { x: 0, y: 0, w: 1, h: 1 },
      z: 0,
      data: null,
    } as unknown as Item<DrawData>);

  it("a text sets its width only, an arrow has no box, a pen and an image keep their ratio", () => {
    expect(rule("text")?.handles).toEqual(["e", "w"]);
    expect(rule("arrow")).toBeNull();
    expect(rule("pen")?.keepAspect).toBe(true);
    expect(rule("image")?.keepAspect).toBe(true);
  });

  it("a sticky note never gets smaller than 80", () => {
    const b = resizeBounds({ x: 0, y: 0, w: 160, h: 160 }, "se", -150, -150, {
      rule: rule("sticky")!,
    });
    expect(b).toEqual({ x: 0, y: 0, w: 80, h: 80 });
  });

  it("a pen stroke resized keeps its pixels and scales them", () => {
    const s = store();
    const g = penFromPoints(
      [
        { x: 0, y: 0 },
        { x: 40, y: 20 },
      ],
      { color: "ink", weight: 1 },
    )!;
    const [p] = s.add({ kind: "pen", ...g });
    s.beginGesture();
    s.dispatch({
      type: "resize-handle",
      id: p!.id,
      handle: "se",
      from: p!.bounds,
      dx: p!.bounds.w,
      dy: 0,
      keepAspect: false,
      snap: false,
    });
    s.endGesture();
    const after = s.get(p!.id)!;
    expect(after.bounds.w / after.bounds.h).toBeCloseTo(p!.bounds.w / p!.bounds.h);
    expect(after.data).toBe(p!.data);
  });
});

describe("arrow bindings", () => {
  const setup = () => {
    const s = store();
    const [a, b] = s.add([
      shapeItem("rectangle", { x: 0, y: 0, w: 100, h: 100 }),
      shapeItem("ellipse", { x: 300, y: 0, w: 100, h: 100 }),
    ]);
    const [ar] = s.add(
      arrowItem({ x: 50, y: 50 }, { x: 350, y: 50 }, (id) => s.get(id) as DrawItem, {
        startBind: a!.id,
        endBind: b!.id,
      }),
    );
    return { s, a: a!, b: b!, ar: ar! };
  };

  it("lands a bound end on the outline of its item, facing the other", () => {
    const { s, ar } = setup();
    const { start, end } = arrowEnds(arrow(s, ar.id));
    expect(start).toEqual({ x: 104, y: 50 });
    expect(end).toEqual({ x: 296, y: 50 });
  });

  it("follows an item that moves, in the same undo step", () => {
    const { s, b, ar } = setup();
    s.moveBy([b.id], 0, 200);
    const { end } = arrowEnds(arrow(s, ar.id));
    expect(end.y).toBeGreaterThan(200);
    expect(arrow(s, ar.id).data.end.bind).toBe(b.id);
    s.undo();
    expect(arrowEnds(arrow(s, ar.id)).end).toEqual({ x: 296, y: 50 });
    expect(s.getState().canUndo).toBe(true);
    s.undo();
    expect(s.get(ar.id)).toBeUndefined();
  });

  it("follows a drag gesture, and a cancelled drag puts it back", () => {
    const { s, a, ar } = setup();
    const before = arrow(s, ar.id);
    s.beginGesture("Move");
    s.dispatch({
      type: "drag",
      from: [[a.id, a.bounds]],
      anchor: a.bounds,
      dx: 0,
      dy: -150,
      snap: false,
    });
    expect(arrowEnds(arrow(s, ar.id)).start.y).toBeLessThan(0);
    s.cancelGesture();
    expect(arrow(s, ar.id)).toEqual(before);
  });

  it("lets go of the items when the arrow is dragged on its own", () => {
    const { s, ar } = setup();
    s.moveBy([ar.id], 0, 300);
    const moved = arrow(s, ar.id);
    expect(moved.data.start.bind).toBeUndefined();
    expect(moved.data.end.bind).toBeUndefined();
    expect(arrowEnds(moved).start).toEqual({ x: 104, y: 350 });
  });

  it("keeps its ends when it moves with both of its items", () => {
    const { s, a, b, ar } = setup();
    s.moveBy([a.id, b.id, ar.id], 40, 40);
    const moved = arrow(s, ar.id);
    expect(moved.data.start.bind).toBe(a.id);
    expect(arrowEnds(moved).start).toEqual({ x: 144, y: 90 });
  });

  it("lets go of an item that is deleted", () => {
    const { s, b, ar } = setup();
    s.remove([b.id]);
    expect(arrow(s, ar.id).data.end.bind).toBeUndefined();
    s.undo();
    expect(arrow(s, ar.id).data.end.bind).toBe(b.id);
  });

  it("a duplicate of an arrow and its items is bound to the copies", () => {
    const { s, a, b, ar } = setup();
    s.select([a.id, b.id, ar.id]);
    const copies = s.duplicateSelection();
    const copy = copies.find((c) => c.kind === "arrow") as DrawItem<ArrowData>;
    const now = arrow(s, copy.id);
    expect(now.data.start.bind).not.toBe(a.id);
    expect(copies.map((c) => c.id)).toContain(now.data.start.bind);
    expect(copies.map((c) => c.id)).toContain(now.data.end.bind);
  });

  it("a pasted arrow without its items lets go of them", () => {
    const { s, ar } = setup();
    s.select([ar.id]);
    s.copy();
    const [pasted] = s.paste();
    const now = arrow(s, pasted!.id);
    expect(now.data.start.bind).toBeUndefined();
    expect(now.data.end.bind).toBeUndefined();
  });
});

describe("frames", () => {
  const setup = () => {
    const s = store();
    const [f] = s.add(frameItem({ x: 0, y: 0, w: 400, h: 300 }, "Plan"));
    const [inside, outside] = s.add([
      shapeItem("rectangle", { x: 40, y: 60, w: 80, h: 80 }),
      shapeItem("rectangle", { x: 600, y: 60, w: 80, h: 80 }),
    ]);
    return { s, f: f!, inside: inside!, outside: outside! };
  };
  const frameOf = (s: ReturnType<typeof store>, id: string) => {
    const d = s.get(id)!.data;
    return d.type === "frame" ? undefined : d.frame;
  };

  it("holds the items whose centre is inside it", () => {
    const { s, f, inside, outside } = setup();
    expect(frameOf(s, inside.id)).toBe(f.id);
    expect(frameOf(s, outside.id)).toBeUndefined();
  });

  it("takes its items along when it moves, one undo step", () => {
    const { s, f, inside, outside } = setup();
    s.moveBy([f.id], 100, 50);
    expect(s.get(inside.id)!.bounds).toMatchObject({ x: 140, y: 110 });
    expect(s.get(outside.id)!.bounds).toMatchObject({ x: 600, y: 60 });
    s.undo();
    expect(s.get(inside.id)!.bounds).toMatchObject({ x: 40, y: 60 });
    expect(s.get(f.id)!.bounds).toMatchObject({ x: 0, y: 0 });
  });

  it("takes its items along through a drag gesture", () => {
    const { s, f, inside } = setup();
    s.beginGesture("Move");
    for (const dy of [10, 20, 30]) {
      s.dispatch({
        type: "drag",
        from: [[f.id, f.bounds]],
        anchor: f.bounds,
        dx: 0,
        dy,
        snap: false,
      });
    }
    s.endGesture();
    expect(s.get(inside.id)!.bounds.y).toBe(90);
    s.undo();
    expect(s.get(inside.id)!.bounds.y).toBe(60);
  });

  it("an item dragged out leaves, dragged in joins and is raised above the frame", () => {
    const { s, f, inside, outside } = setup();
    s.moveBy([inside.id], 700, 0);
    expect(frameOf(s, inside.id)).toBeUndefined();
    s.update(f.id, { z: 50 });
    s.beginGesture();
    s.dispatch({
      type: "drag",
      from: [[outside.id, outside.bounds]],
      anchor: outside.bounds,
      dx: -500,
      dy: 0,
      snap: false,
    });
    s.endGesture();
    expect(frameOf(s, outside.id)).toBe(f.id);
    expect(s.get(outside.id)!.z).toBeGreaterThan(50);
  });

  it("deleting a frame keeps its items, out of it", () => {
    const { s, f, inside } = setup();
    s.remove([f.id]);
    expect(s.get(inside.id)).toBeDefined();
    expect(frameOf(s, inside.id)).toBeUndefined();
  });

  it("shrinking a frame lets go of what no longer fits", () => {
    const { s, f, inside } = setup();
    s.resize(f.id, { x: 200, y: 0, w: 200, h: 300 });
    expect(frameOf(s, inside.id)).toBeUndefined();
  });

  it("exports with its items clipped, colours as hex codes", () => {
    const { s, f } = setup();
    const out = exportSvg(s.getState().items as DrawItem[], { ids: [f.id] })!;
    expect(out.bounds).toEqual({ x: 0, y: 0, w: 400, h: 300 });
    expect(out.items).toHaveLength(2);
    expect(out.svg).toContain('<clipPath id="fgd-clip-frame-1">');
    expect(out.svg).toContain('clip-path="url(#fgd-clip-frame-1)"');
    expect(out.svg).toContain("#ededed");
    expect(out.svg).not.toContain("var(");
    expect(out.svg).toContain(">Plan<");
  });
});

describe("the pixel pen", () => {
  it("puts points on whole pixels and drops repeats", () => {
    expect(
      toPixels([
        { x: 1, y: 1 },
        { x: 3, y: 2 },
        { x: 5, y: 9 },
      ]),
    ).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 2 },
    ]);
  });

  it("simplifies a shaky straight line to its two ends", () => {
    const shaky = Array.from({ length: 50 }, (_, i) => ({ x: i, y: i % 2 ? 0.4 : -0.4 }));
    expect(simplify(shaky, 1)).toEqual([shaky[0], shaky[49]]);
  });

  it("keeps the corner of an L", () => {
    const l = [
      ...Array.from({ length: 10 }, (_, i) => ({ x: i, y: 0 })),
      ...Array.from({ length: 10 }, (_, i) => ({ x: 9, y: i + 1 })),
    ];
    expect(simplify(l, 1)).toEqual([
      { x: 0, y: 0 },
      { x: 9, y: 0 },
      { x: 9, y: 10 },
    ]);
  });

  it("builds an item on the pixel grid, its vertices local, its pixels connected", () => {
    const pts = Array.from({ length: 40 }, (_, i) => ({
      x: 101 + i * 3,
      y: 47 + Math.sin(i / 6) * 20,
    }));
    const g = penFromPoints(pts, { color: "accent", weight: 2 })!;
    for (const v of [g.bounds.x, g.bounds.y, g.bounds.w, g.bounds.h]) expect(v % 4).toBe(0);
    expect(g.data.points.length).toBeLessThan(pts.length * 2);
    expect(Math.min(...g.data.points)).toBeGreaterThanOrEqual(0);
    const pixels = strokePixels(g.data);
    for (const p of pixels) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThan(g.data.cols);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThan(g.data.rows);
    }
  });
});

describe("arranging", () => {
  const items = [
    make(shapeItem("rectangle", { x: 0, y: 0, w: 40, h: 40 }), "a"),
    make(shapeItem("rectangle", { x: 100, y: 30, w: 20, h: 20 }), "b"),
    make(shapeItem("rectangle", { x: 300, y: 10, w: 60, h: 60 }), "c"),
  ];
  it("aligns on an edge and a centre", () => {
    expect(align(items, "left").map(([id, c]) => [id, c.bounds!.x])).toEqual([
      ["b", 0],
      ["c", 0],
    ]);
    expect(align(items, "middle").map(([id, c]) => [id, c.bounds!.y])).toEqual([
      ["a", 15],
      ["b", 25],
      ["c", 5],
    ]);
  });
  it("distributes evenly between the first and the last", () => {
    expect(distribute(items, "horizontal")).toEqual([
      ["b", { bounds: { x: 160, y: 30, w: 20, h: 20 } }],
    ]);
  });
  it("selecting one item of a group selects the group", () => {
    const s = store();
    const made = s.add([
      shapeItem("rectangle", { x: 0, y: 0, w: 40, h: 40 }),
      shapeItem("rectangle", { x: 100, y: 0, w: 40, h: 40 }),
      shapeItem("rectangle", { x: 200, y: 0, w: 40, h: 40 }),
    ]);
    s.updateMany(group(made.slice(0, 2) as DrawItem[], "g1"));
    s.select([made[0]!.id]);
    expect([...s.getState().selection].sort()).toEqual([made[0]!.id, made[1]!.id].sort());
  });
});

describe("text", () => {
  it("a sticky note grows with its text", () => {
    expect(stickyHeight("", 160)).toBe(160);
    expect(stickyHeight("word ".repeat(80), 160)).toBeGreaterThan(160);
  });
});

describe("the board as JSON", () => {
  it("round-trips every kind", () => {
    const s = store();
    const [r] = s.add([
      shapeItem(
        "rectangle",
        { x: 0, y: 0, w: 100, h: 100 },
        { fill: { type: "pattern", pattern: "dots-50", color: "accent" } },
      ),
      stickyItem({ x: 200, y: 0 }, "Hello"),
      textItem({ x: 0, y: 200 }, "Title"),
      frameItem({ x: -40, y: -40, w: 600, h: 400 }, "Board"),
      {
        kind: "image",
        bounds: { x: 400, y: 200, w: 40, h: 30 },
        data: { type: "image", src: "data:image/png;base64,AA==", name: "a.png" },
      },
    ]);
    s.add({
      kind: "pen",
      ...penFromPoints(
        [
          { x: 300, y: 300 },
          { x: 340, y: 320 },
        ],
        { color: "ink", weight: 1 },
      )!,
    });
    s.add(
      arrowItem({ x: 50, y: 50 }, { x: 300, y: 300 }, (id) => s.get(id) as DrawItem, {
        startBind: r!.id,
      }),
    );
    const items = s.getState().items as DrawItem[];
    const json = serializeBoard(items, { x: 1, y: 2, zoom: 1 });
    const back = parseBoard(json);
    expect(back.items).toEqual(items);
    expect(back.viewport).toEqual({ x: 1, y: 2, zoom: 1 });
    // The canvas JSON of the store reads as a board too.
    expect(parseBoard(s.serialize()).items).toEqual(items);
    // And loads back into a store.
    const t = store();
    t.load(json);
    expect(t.getState().items).toEqual(items);
  });

  it("refuses an unknown version, format or kind, and data of another kind", () => {
    expect(() => parseBoard('{"version":2,"items":[]}')).toThrow(/version/);
    expect(() => parseBoard('{"format":"other","version":1,"items":[]}')).toThrow(/format/);
    const item = (kind: string, data: unknown) =>
      JSON.stringify({
        version: 1,
        items: [{ id: "a", kind, bounds: { x: 0, y: 0, w: 1, h: 1 }, z: 0, data }],
      });
    expect(() => parseBoard(item("blob", {}))).toThrow(/kind/);
    expect(() => parseBoard(item("rectangle", { type: "sticky" }))).toThrow(/shape/);
    expect(() => parseBoard(item("pen", { type: "pen", points: [1.5, 2] }))).toThrow(/pixels/);
  });

  it("fills what a field leaves out", () => {
    const json = JSON.stringify({
      version: 1,
      items: [
        {
          id: "a",
          kind: "rectangle",
          bounds: { x: 0, y: 0, w: 1, h: 1 },
          z: 0,
          data: { type: "shape" },
        },
      ],
    });
    expect(parseBoard(json).items[0]!.data).toEqual({
      type: "shape",
      fill: { type: "none" },
      stroke: { color: "ink", width: 2, dash: "solid" },
    });
  });
});

describe("history", () => {
  it("repeated nudges and what follows them are one step", () => {
    const s = store();
    const [a, b] = s.add([
      shapeItem("rectangle", { x: 0, y: 0, w: 100, h: 100 }),
      shapeItem("rectangle", { x: 300, y: 0, w: 100, h: 100 }),
    ]);
    const [ar] = s.add(
      arrowItem({ x: 0, y: 0 }, { x: 1, y: 1 }, (id) => s.get(id) as DrawItem, {
        startBind: a!.id,
        endBind: b!.id,
      }),
    );
    const placed = s.get(ar!.id);
    s.select([b!.id]);
    s.nudge(0, 10);
    s.nudge(0, 10);
    expect(s.get(b!.id)!.bounds.y).toBe(20);
    s.undo();
    expect(s.get(b!.id)!.bounds.y).toBe(0);
    expect(s.get(ar!.id)).toEqual(placed);
  });

  it("frames hold the items added in them, in one step with the add", () => {
    const s = store();
    s.add(frameItem({ x: 0, y: 0, w: 400, h: 300 }, "F"));
    const [x] = s.add(shapeItem("rectangle", { x: 10, y: 40, w: 20, h: 20 }));
    expect((s.get(x!.id)!.data as Exclude<DrawData, FrameData>).frame).toBe("frame-1");
    s.undo();
    expect(s.get(x!.id)).toBeUndefined();
    expect(s.getState().items).toHaveLength(1);
  });
});

describe("the pen's path", () => {
  it("draws each row's run of pixels as one rectangle", () => {
    const d = { points: [0, 0, 5, 0, 5, 2], weight: 1 };
    expect(strokePath(d)).toBe("M0 0h6v1h-6zM5 1h1v1h-1zM5 2h1v1h-1z");
  });
});
