// The plugin contract of the whiteboard (D-154): the minimal core alone, the resolution of a plugin
// list, graceful degradation of what no plugin knows, a third-party kind written here, the rules
// inside one undo step, and the presets.

import type { FarPrimitive, NewItem } from "@forgeron/canvas";
import { describe, expect, it } from "vitest";
import {
  arrowItem,
  createDrawEngine,
  createDrawStore,
  createRegistry,
  definePlugin,
  DRAW_KINDS,
  exportSvg,
  frameItem,
  farPrimitives,
  pagePaint,
  paintItem,
  parseBoard,
  PluginError,
  resolvePlugins,
  serializeBoard,
  shapeItem,
  stickyItem,
  textItem,
  toMarkup,
  type DrawData,
  type DrawItem,
  type DrawPlugin,
  type ExportSpec,
  type KindSpec,
} from "../index";
import { DrawFormatError } from "../core/parse";
import { n } from "../core/svg";
import {
  alignPlugin,
  arrow,
  corePresets,
  diamond,
  ellipse,
  frame,
  fullCorePlugins,
  groups,
  image,
  minimalCorePlugins,
  pen,
  rectangle,
  sketchCorePlugins,
  sticky,
  svg,
  text,
} from "./index";
import { goldenBoard } from "./fixtures/golden";

const nostore = { grid: { snap: false } } as const;
const ids = (items: ReadonlyArray<{ id: string }>) => items.map((i) => i.id);

/* ------------------------------------------------------------------ A third-party kind */

interface StarData {
  type: "star";
  points: number;
  label?: string;
  angle?: number;
}
const star = (item: DrawItem) => item.data as unknown as StarData;

const starKind: KindSpec = {
  type: "star",
  label: "Star",
  // Hit: inside the circle of the star, not the corners of its box.
  canvas: {
    hitTest: (i, p) => {
      const r = Math.min(i.bounds.w, i.bounds.h) / 2;
      return Math.hypot(p.x - i.bounds.x - i.bounds.w / 2, p.y - i.bounds.y - i.bounds.h / 2) <= r;
    },
  },
  parse: (raw) =>
    ({
      type: "star",
      points: typeof raw.points === "number" ? raw.points : 5,
      ...(typeof raw.label === "string" ? { label: raw.label } : {}),
      ...(typeof raw.angle === "number" ? { angle: raw.angle } : {}),
    }) as unknown as DrawData,
  paint(item, o) {
    const b = item.bounds;
    const k = star(item).points;
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    const pts = Array.from({ length: k * 2 }, (_, i) => {
      const r = (i % 2 ? 0.4 : 1) * (Math.min(b.w, b.h) / 2);
      const a = (Math.PI * i) / k - Math.PI / 2;
      return `${Math.round(cx + Math.cos(a) * r)},${Math.round(cy + Math.sin(a) * r)}`;
    }).join(" ");
    return [n("polygon", { points: pts, fill: o.color("warning"), stroke: o.color("ink") })];
  },
  far: (item) => [{ type: "ellipse", ...item.bounds, fill: "gold" } as FarPrimitive],
  words: (item) => star(item).label ?? "",
};

const starJson: ExportSpec = {
  id: "star-count",
  name: "Star count",
  mime: "text/plain",
  extension: "txt",
  run: (ctx) => ({
    data: String(ctx.items.filter((i) => i.kind === "star").length),
    mime: "text/plain",
    name: "stars",
  }),
};

const starPlugin = definePlugin({
  id: "star",
  name: "Star",
  description: "A star with a number of points.",
  kinds: { star: starKind },
  exports: [starJson],
  engineRules: {
    // A derived field kept in step with the position: written in the same undo step as the move.
    follow: ({ before, items, changed }) =>
      items.flatMap((i) => {
        if (i.kind !== "star" || !changed.has(i.id) || !before.has(i.id) || before.get(i.id) === i)
          return [];
        const angle = i.bounds.x % 360;
        return star(i).angle === angle
          ? []
          : [[i.id, { data: { ...i.data, angle } as unknown as DrawData }] as const];
      }),
    copy: ({ copies }) =>
      copies
        .filter((c) => c.kind === "star")
        .map((c) => [c.id, { data: { ...c.data, label: "copy" } as unknown as DrawData }] as const),
  },
});

const newStar = (x = 0, y = 0): NewItem<DrawData> => ({
  kind: "star",
  bounds: { x, y, w: 80, h: 80 },
  data: { type: "star", points: 5 } as unknown as DrawData,
});

/* ------------------------------------------------------------------ The minimal core */

describe("the minimal core, with no plugin at all", () => {
  it("is the canvas: items select, move, resize and undo; no rule runs", () => {
    const store = createDrawStore({ ...nostore, plugins: [] });
    const [a, b] = store.add([newStar(0, 0), newStar(200, 0)]);
    store.select([a!.id]);
    store.update(a!.id, { bounds: { x: 40, y: 0, w: 80, h: 80 } });
    expect(store.get(a!.id)!.bounds.x).toBe(40);
    // No `follow` rule: nothing derived was written.
    expect(star(store.get(a!.id) as DrawItem).angle).toBeUndefined();
    store.undo();
    expect(store.get(a!.id)!.bounds.x).toBe(0);
    expect(store.get(b!.id)!.bounds.x).toBe(200);
  });

  it("degrades an arrow or a frame of a board it does not know: kept, never painted or exported", () => {
    const list = [rectangle];
    const board = serializeBoard(
      parseBoard(goldenBoard).items.filter((i) => ["rect", "arr-1", "frame-1"].includes(i.id)),
    );
    expect(() => parseBoard(board, list)).toThrow(DrawFormatError);
    const { items } = parseBoard(board, list, { unknown: "keep" });
    expect(ids(items)).toEqual(["frame-1", "rect", "arr-1"]);
    const arrowItemRaw = items.find((i) => i.id === "arr-1")!;
    expect(paintItem(arrowItemRaw, pagePaint("x"), list)).toEqual([]);
    expect(farPrimitives(arrowItemRaw, undefined, list)).toEqual([]);
    const out = exportSvg(items, { ids: ids(items) }, list)!;
    expect(out.items.map((i) => i.id)).toEqual(["rect"]);
    expect(out.svg).not.toContain("polyline");
    expect(out.svg).not.toContain("clipPath");
  });

  it("moving the item an unknown arrow was bound to leaves the arrow alone", () => {
    const list = [rectangle];
    const store = createDrawStore({ ...nostore, plugins: list });
    const full = parseBoard(goldenBoard).items;
    store.replace(full.filter((i) => ["rect", "ell", "arr-1"].includes(i.id)));
    const arrowBefore = store.get("arr-1");
    store.update("rect", { bounds: { x: 300, y: 300, w: 160, h: 100 } });
    expect(store.get("arr-1")).toBe(arrowBefore);
    // And the frame rules are not there either: no `frame` field was added.
    expect("frame" in (store.get("ell")!.data as object)).toBe(false);
  });
});

/* ------------------------------------------------------------------ Resolution */

const plug = (id: string, extra: Partial<DrawPlugin> = {}): DrawPlugin =>
  definePlugin({ id, name: id, description: id, ...extra });

describe("resolving a plugin list", () => {
  it("puts what a plugin requires first", () => {
    const shapes = plug("shapes");
    const arrows = plug("arrows", { requires: ["shapes"] });
    expect(resolvePlugins([arrows, shapes]).map((p) => p.id)).toEqual(["shapes", "arrows"]);
    expect(createRegistry([arrows, shapes]).plugins.map((p) => p.id)).toEqual(["shapes", "arrows"]);
  });

  it("refuses a duplicate id", () => {
    expect(() => createRegistry([plug("a"), plug("a")])).toThrow(PluginError);
    expect(() => createRegistry([plug("a"), plug("a")])).toThrow(/Duplicate plugin id "a"/);
  });

  it("refuses a missing dependency", () => {
    expect(() => createRegistry([plug("arrows", { requires: ["shapes"] })])).toThrow(
      /"arrows" requires "shapes", which is missing/,
    );
    // The bundled png needs the svg export.
    expect(() =>
      createRegistry([rectangle, corePresets.full.find((p) => p.id === "png")!]),
    ).toThrow(/requires "svg"/);
  });

  it("refuses a cycle", () => {
    expect(() =>
      createRegistry([plug("a", { requires: ["b"] }), plug("b", { requires: ["a"] })]),
    ).toThrow(/cycle: a -> b -> a/);
  });

  it("refuses two plugins that own one kind, or one export", () => {
    const own = (id: string) => plug(id, { kinds: { rectangle: starKind } });
    expect(() => createRegistry([own("a"), own("b")])).toThrow(
      /Kind "rectangle" of plugin "b" is already owned by "a"/,
    );
    expect(() =>
      createRegistry([rectangle, plug("clone", { kinds: { rectangle: starKind } })]),
    ).toThrow(PluginError);
    const ex = (id: string) => plug(id, { exports: [starJson] });
    expect(() => createRegistry([ex("a"), ex("b")])).toThrow(/Export "star-count"/);
  });

  it("knows its kinds, owners and rules", () => {
    const registry = createRegistry([rectangle, arrow, frame, groups]);
    expect(registry.kindIds).toEqual(["rectangle", "arrow", "frame"]);
    expect(registry.owner("arrow")).toBe("arrow");
    expect(registry.knows("ellipse")).toBe(false);
    expect(registry.rules.follow).toHaveLength(1);
    expect(registry.rules.carry).toHaveLength(1);
    expect(registry.rules.select).toHaveLength(1);
    expect(registry.rules.copy).toHaveLength(3);
  });
});

/* ------------------------------------------------------------------ Unknown kinds */

describe("what no plugin knows", () => {
  const board = JSON.stringify({
    format: "forgeron/draw",
    version: 1,
    items: [
      {
        id: "a",
        kind: "rectangle",
        bounds: { x: 0, y: 0, w: 10, h: 10 },
        z: 0,
        data: { type: "shape" },
      },
      {
        id: "w",
        kind: "widget",
        bounds: { x: 20, y: 0, w: 30, h: 30 },
        z: 1,
        data: { type: "widget", anything: [1, { two: 2 }], nested: { deep: true } },
      },
    ],
  });

  it("is refused by default and kept on request, as it is", () => {
    expect(() => parseBoard(board, [rectangle])).toThrow(/kind widget is not a kind of draw/);
    const { items } = parseBoard(board, [rectangle], { unknown: "keep" });
    const widget = items.find((i) => i.id === "w")!;
    expect(widget).toEqual(JSON.parse(board).items[1]);
    // The known one was read and filled, the unknown one is the very object.
    expect((items.find((i) => i.id === "a")!.data as { fill: unknown }).fill).toEqual({
      type: "none",
    });
  });

  it("round-trips through a store of other plugins, and moves like any item", () => {
    const store = createDrawStore({ ...nostore, plugins: [rectangle] });
    store.load(board);
    const widget = store.get("w") as DrawItem;
    expect(widget.data).toEqual(JSON.parse(board).items[1].data);
    expect(store.query({ type: "hit", point: { x: 30, y: 10 } })?.id).toBe("w");
    expect(parseBoard(store.serialize(), [rectangle], { unknown: "keep" }).items.at(-1)).toEqual(
      JSON.parse(board).items[1],
    );
    store.update("w", { bounds: { x: 100, y: 0, w: 30, h: 30 } });
    expect((store.get("w") as DrawItem).data).toBe(widget.data);
  });

  it("is read when a plugin knows it, through a migration of an old kind", () => {
    const legacy = definePlugin({
      id: "legacy-box",
      name: "Box",
      description: "Reads the old `box` kind as a rectangle.",
      requires: ["rectangle"],
      json: {
        migrate: {
          box: (item) => ({
            ...item,
            kind: "rectangle",
            data: { type: "shape", fill: (item.data as { fill: unknown }).fill },
          }),
        },
      },
    });
    const old = JSON.stringify({
      version: 1,
      items: [
        {
          id: "b",
          kind: "box",
          bounds: { x: 0, y: 0, w: 5, h: 5 },
          z: 0,
          data: { type: "box", fill: { type: "solid", color: "ink" } },
        },
      ],
    });
    const { items } = parseBoard(old, [rectangle, legacy]);
    expect(items[0]!.kind).toBe("rectangle");
    expect((items[0]!.data as { fill: unknown }).fill).toEqual({ type: "solid", color: "ink" });
    expect(createRegistry([rectangle, legacy]).knows("box")).toBe(true);
  });
});

/* ------------------------------------------------------------------ A third-party plugin */

describe("a plugin written outside the package (a star)", () => {
  const list = [rectangle, starPlugin];
  const registry = createRegistry(list);

  it("is hit-tested by its own rule, drawn, drawn far, and exported", () => {
    const store = createDrawStore({ ...nostore, plugins: list });
    const [s] = store.add(newStar(0, 0));
    // The corner of its box is outside the star's circle.
    expect(store.query({ type: "hit", point: { x: 40, y: 40 } })?.id).toBe(s!.id);
    expect(store.query({ type: "hit", point: { x: 2, y: 2 } })).toBeFalsy();
    const item = store.get(s!.id) as DrawItem;
    const markup = toMarkup(paintItem(item, pagePaint("x"), list));
    expect(markup).toMatch(/^<polygon points="/);
    expect(markup).toContain('fill="var(--warning)"');
    expect(farPrimitives(item, undefined, list)).toEqual([
      { type: "ellipse", ...item.bounds, fill: "gold" },
    ]);
    const out = exportSvg(store.getState().items as DrawItem[], { ids: [s!.id] }, list)!;
    expect(out.svg).toContain("<polygon");
    expect(out.svg).toContain('fill="#ffb020"');
    const run = registry.export("star-count")!.run({
      items: store.getState().items as DrawItem[],
      ids: [s!.id],
      registry,
    });
    expect(run).toEqual({ data: "1", mime: "text/plain", name: "stars" });
  });

  it("reads and writes its own JSON", () => {
    const store = createDrawStore({ ...nostore, plugins: list });
    store.add([newStar(0, 0), shapeItem("rectangle", { x: 100, y: 0, w: 20, h: 20 })]);
    const json = serializeBoard(store.getState().items as DrawItem[]);
    const back = parseBoard(json, list);
    expect(back.items.map((i) => i.kind)).toEqual(["star", "rectangle"]);
    expect(star(back.items[0]!)).toEqual({ type: "star", points: 5 });
    // The default list does not know it.
    expect(() => parseBoard(json)).toThrow(/kind star/);
  });

  it("runs its rules inside the one undo step of the change", () => {
    const store = createDrawStore({ ...nostore, plugins: list });
    const [s] = store.add(newStar(0, 0));
    store.update(s!.id, { bounds: { x: 40, y: 0, w: 80, h: 80 } }, { label: "Move star" });
    expect(star(store.get(s!.id) as DrawItem).angle).toBe(40);
    // One undo takes back the move and what the rule wrote with it.
    store.undo();
    expect(store.get(s!.id)!.bounds.x).toBe(0);
    expect(star(store.get(s!.id) as DrawItem).angle).toBeUndefined();
    store.redo();
    expect(star(store.get(s!.id) as DrawItem).angle).toBe(40);
  });

  it("follows a drag gesture as one step too, and a duplicate is renamed in the duplicate's step", () => {
    const store = createDrawStore({ ...nostore, plugins: list });
    const [s] = store.add(newStar(0, 0));
    store.select([s!.id]);
    store.beginGesture("Drag");
    store.update(s!.id, { bounds: { x: 20, y: 0, w: 80, h: 80 } });
    store.update(s!.id, { bounds: { x: 60, y: 0, w: 80, h: 80 } });
    store.endGesture();
    expect(star(store.get(s!.id) as DrawItem).angle).toBe(60);
    store.undo();
    expect(store.get(s!.id)!.bounds.x).toBe(0);
    store.redo();
    store.duplicateSelection();
    const stars = (store.getState().items as DrawItem[]).filter((i) => i.kind === "star");
    expect(stars).toHaveLength(2);
    expect(star(stars[1]!).label).toBe("copy");
    store.undo();
    expect((store.getState().items as DrawItem[]).filter((i) => i.kind === "star")).toHaveLength(1);
  });

  it("is dropped from a list that lacks it, and what it wrote stays", () => {
    const store = createDrawStore({ ...nostore, plugins: list });
    store.add(newStar(0, 0));
    const json = store.serialize();
    const other = createDrawStore({ ...nostore, plugins: [rectangle] });
    other.load(json);
    expect(other.getState().items).toHaveLength(1);
    expect(paintItem(other.getState().items[0] as DrawItem, pagePaint("x"), [rectangle])).toEqual(
      [],
    );
  });
});

/* ------------------------------------------------------------------ Engine rules */

describe("engine rules of the bundled plugins, by stage", () => {
  it("run in the order of the list: a frame carries, membership settles, an arrow follows", () => {
    const store = createDrawStore({ ...nostore, plugins: [rectangle, frame, arrow] });
    const get = (id: string) => store.get(id) as DrawItem | undefined;
    const [f] = store.add(frameItem({ x: 0, y: 0, w: 400, h: 300 }, "F"));
    const [r1, r2] = store.add([
      shapeItem("rectangle", { x: 40, y: 60, w: 80, h: 60 }),
      shapeItem("rectangle", { x: 600, y: 60, w: 80, h: 60 }),
    ]);
    const [a] = store.add(
      arrowItem({ x: 0, y: 0 }, { x: 0, y: 0 }, get, { startBind: r1!.id, endBind: r2!.id }),
    );
    expect((get(r1!.id)!.data as { frame?: string }).frame).toBe(f!.id);
    const before = get(a!.id)!.bounds;
    store.update(f!.id, { bounds: { x: 100, y: 0, w: 400, h: 300 } }, { label: "Move frame" });
    // The frame's item went with it, the arrow followed the item, in one step.
    expect(get(r1!.id)!.bounds.x).toBe(140);
    expect(get(a!.id)!.bounds).not.toEqual(before);
    store.undo();
    expect(get(r1!.id)!.bounds.x).toBe(40);
    expect(get(a!.id)!.bounds).toEqual(before);
  });

  it("selecting one item of a group selects the group only with the groups plugin", () => {
    const withGroups = createDrawStore({ ...nostore, plugins: [rectangle, groups] });
    const without = createDrawStore({ ...nostore, plugins: [rectangle] });
    for (const s of [withGroups, without]) {
      const items = s.add([
        shapeItem("rectangle", { x: 0, y: 0, w: 10, h: 10 }),
        shapeItem("rectangle", { x: 50, y: 0, w: 10, h: 10 }),
      ]);
      s.updateMany(items.map((i) => [i.id, { data: { ...i.data, group: "g" } }] as const));
      s.select([items[0]!.id]);
    }
    expect(withGroups.getState().selection.size).toBe(2);
    expect(without.getState().selection.size).toBe(1);
  });

  it("the deletion hook runs inside the step of the delete", () => {
    const calls: string[][] = [];
    const watcher = definePlugin({
      id: "watcher",
      name: "Watcher",
      description: "Notes what was deleted and leaves a marker.",
      engineRules: {
        remove: ({ removed }) => {
          calls.push([...removed]);
          return [];
        },
      },
    });
    const store = createDrawStore({ ...nostore, plugins: [rectangle, watcher] });
    const [r] = store.add(shapeItem("rectangle", { x: 0, y: 0, w: 10, h: 10 }));
    store.remove([r!.id]);
    expect(calls).toEqual([[r!.id]]);
  });

  it("a drag step gives the rules the items before it, saved one by id, as one undo step", () => {
    const seen: Array<{ size: number; moved: number | undefined; still: number | undefined }> = [];
    let watching = false;
    const spy = definePlugin({
      id: "spy",
      name: "Spy",
      description: "Notes what the rules are given.",
      engineRules: {
        follow: ({ before, changed, items }) => {
          if (!watching) return [];
          const moved = [...changed][0]!;
          const still = items.find((i) => !changed.has(i.id))!.id;
          seen.push({
            size: before.size,
            moved: before.get(moved)?.bounds.x,
            still: before.get(still)?.bounds.x,
          });
          return [];
        },
      },
    });
    const store = createDrawStore({ ...nostore, plugins: [rectangle, frame, arrow, spy] });
    const get = (id: string) => store.get(id) as DrawItem | undefined;
    const [f] = store.add(frameItem({ x: 0, y: 0, w: 400, h: 300 }, "F"));
    const [r1, r2, r3] = store.add([
      shapeItem("rectangle", { x: 40, y: 60, w: 80, h: 60 }),
      shapeItem("rectangle", { x: 240, y: 60, w: 80, h: 60 }),
      shapeItem("rectangle", { x: 900, y: 600, w: 80, h: 60 }),
    ]);
    const [a] = store.add(
      arrowItem({ x: 0, y: 0 }, { x: 0, y: 0 }, get, { startBind: r1!.id, endBind: r2!.id }),
    );
    const moving = [f!, r1!, r2!, a!].map((i) => get(i.id)!);
    const arrowWas = get(a!.id)!;
    watching = true;
    store.beginGesture("Move");
    for (const dx of [20, 40]) {
      store.dispatch({
        type: "drag",
        from: moving.map((i) => [i.id, i.bounds] as const),
        anchor: { x: 0, y: 0, w: 0, h: 0 },
        dx,
        dy: 0,
        snap: false,
      });
    }
    watching = false;
    store.endGesture();
    // Each step: the moved items as they were, the others as they are; the whole board on demand.
    expect(seen[0]).toMatchObject({ size: 5, moved: 0, still: 900 });
    expect(seen[1]).toMatchObject({ size: 5, moved: 20, still: 900 });
    // The arrow moved with both its items: bound as it was, moved by as much.
    const now = get(a!.id)!;
    expect(now.data).toBe(arrowWas.data);
    expect(now.bounds).toEqual({ ...arrowWas.bounds, x: arrowWas.bounds.x + 40 });
    expect(get(r3!.id)!.bounds.x).toBe(900);
    store.undo();
    expect(get(f!.id)!.bounds.x).toBe(0);
    expect(get(a!.id)!.bounds).toEqual(arrowWas.bounds);
    // Dragged alone, it lets go of both ends, as before.
    store.beginGesture("Move");
    store.dispatch({
      type: "drag",
      from: [[a!.id, arrowWas.bounds]],
      anchor: { x: 0, y: 0, w: 0, h: 0 },
      dx: 0,
      dy: 200,
      snap: false,
    });
    store.endGesture();
    const alone = get(a!.id)!.data as { start: { bind?: string }; end: { bind?: string } };
    expect(alone.start.bind).toBeUndefined();
    expect(alone.end.bind).toBeUndefined();
  });

  it("an engine exposes the registry it runs", () => {
    const engine = createDrawEngine({ plugins: [rectangle, text] });
    expect(engine.registry.kindIds).toEqual(["rectangle", "text"]);
  });
});

/* ------------------------------------------------------------------ Presets */

describe("presets", () => {
  const kinds = (list: ReadonlyArray<DrawPlugin>) => createRegistry(list).kindIds;

  it("full is everything that ships: every kind, every rule", () => {
    expect(new Set(kinds(fullCorePlugins))).toEqual(new Set(DRAW_KINDS));
    const registry = createRegistry(fullCorePlugins);
    expect(registry.exports.map((e) => e.id)).toEqual(["svg", "json"]);
    expect(registry.rules.carry).toHaveLength(1);
    expect(registry.rules.follow).toHaveLength(1);
    expect(registry.rules.settle).toHaveLength(1);
    expect(registry.rules.select).toHaveLength(1);
    expect(registry.rules.copy).toHaveLength(3);
  });

  it("sketch has shapes, notes and the pen, and no arrows and no frames", () => {
    const registry = createRegistry(sketchCorePlugins);
    expect(registry.kindIds).toEqual(["rectangle", "ellipse", "diamond", "sticky", "text", "pen"]);
    expect(registry.rules.follow).toHaveLength(0);
    expect(registry.rules.carry).toHaveLength(0);
    expect(registry.has("frame")).toBe(false);
    expect(registry.has("arrow")).toBe(false);
  });

  it("minimal is a rectangle and a text", () => {
    expect(kinds(minimalCorePlugins)).toEqual(["rectangle", "text"]);
    expect(corePresets.minimal).toBe(minimalCorePlugins);
  });

  it("a board of today's kinds opens in sketch with what it does not know kept", () => {
    const all = parseBoard(goldenBoard);
    const { items } = parseBoard(goldenBoard, sketchCorePlugins, { unknown: "keep" });
    expect(items.map((i) => i.id)).toEqual(all.items.map((i) => i.id));
    // The kinds sketch knows are read as before; arrow, frame and image are the very raw items.
    expect(items.find((i) => i.id === "rect")).toEqual(all.items.find((i) => i.id === "rect"));
    expect(items.find((i) => i.id === "arr-1")).toEqual(
      JSON.parse(goldenBoard).items.find((i: { id: string }) => i.id === "arr-1"),
    );
  });

  it("a plugin list needs no preset: any subset that resolves works", () => {
    for (const list of [[sticky], [ellipse, diamond], [pen, text], [image], [alignPlugin], [svg]]) {
      expect(() => createDrawStore({ plugins: list })).not.toThrow();
    }
    expect(textItem({ x: 0, y: 0 }, "x").kind).toBe("text");
    expect(stickyItem({ x: 0, y: 0 }).kind).toBe("sticky");
  });
});
