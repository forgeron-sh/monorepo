import { describe, expect, it } from "vitest";
import {
  structureActiveHeading,
  structureCoverCells,
  structureCoverPath,
  structureDiffFields,
  structureDiffRows,
  structureDiffSeq,
  structureDiffWords,
  structureDropPlacement,
  structureDropZone,
  structureFilter,
  structureFilterTemplates,
  structureFlatten,
  structureHeadingsFrom,
  structureHighlight,
  structureLayoutThreads,
  structureMove,
  structureOrgLayout,
  structureOrgNavigate,
  structureOutlineTree,
  structureRandom,
  structureRebaseAnchor,
  structureSafeImageUrl,
  structureShift,
  structureSlug,
  structureSplitRows,
  structureIds,
  type StructureAnchor,
} from "./structure-model";

interface N {
  id: string;
  children?: N[];
}
const tree = (): N[] => [
  { id: "a", children: [{ id: "a1" }, { id: "a2", children: [{ id: "a2x" }] }] },
  { id: "b" },
  { id: "c", children: [{ id: "c1" }] },
];
const shape = (nodes: N[]): string =>
  nodes.map((n) => (n.children?.length ? `${n.id}(${shape(n.children)})` : n.id)).join(",");

describe("structure tree helpers", () => {
  it("flattens only what is open, with level, parent and position", () => {
    const rows = structureFlatten(tree(), new Set(["a"]));
    expect(rows.map((r) => `${r.node.id}:${r.level}:${r.parent}:${r.index}/${r.size}`)).toEqual([
      "a:1:null:0/3",
      "a1:2:a:0/2",
      "a2:2:a:1/2",
      "b:1:null:1/3",
      "c:1:null:2/3",
    ]);
  });

  it("keeps only the visible ids when a filter is on", () => {
    const rows = structureFlatten(tree(), new Set(["a", "a2"]), new Set(["a", "a2", "a2x"]));
    expect(rows.map((r) => r.node.id)).toEqual(["a", "a2", "a2x"]);
  });

  it("moves a node into another parent, before, and refuses a move into itself", () => {
    expect(shape(structureMove(tree(), ["b"], { parentId: "a", index: 1 })!)).toBe(
      "a(a1,b,a2(a2x)),c(c1)",
    );
    expect(shape(structureMove(tree(), ["c"], { parentId: null, index: 0 })!)).toBe(
      "c(c1),a(a1,a2(a2x)),b",
    );
    // Into a leaf: it gets its first child.
    expect(shape(structureMove(tree(), ["c"], { parentId: "b", index: 0 })!)).toBe(
      "a(a1,a2(a2x)),b(c(c1))",
    );
    expect(structureMove(tree(), ["a"], { parentId: "a2", index: 0 })).toBeNull();
    expect(structureMove(tree(), ["a"], { parentId: "a", index: 0 })).toBeNull();
    expect(structureMove(tree(), ["zz"], { parentId: null, index: 0 })).toBeNull();
  });

  it("counts the moved sibling above the spot in the same list", () => {
    // a goes after b: index 2 among [a, b, c] is between b and c.
    expect(shape(structureMove(tree(), ["a"], { parentId: null, index: 2 })!)).toBe(
      "b,a(a1,a2(a2x)),c(c1)",
    );
    expect(shape(structureMove(tree(), ["a", "c"], { parentId: null, index: 2 })!)).toBe(
      "b,a(a1,a2(a2x)),c(c1)",
    );
  });

  it("drops before, after and inside a row", () => {
    expect(structureDropPlacement(tree(), "b", "before")).toEqual({ parentId: null, index: 1 });
    expect(structureDropPlacement(tree(), "a2", "after")).toEqual({ parentId: "a", index: 2 });
    expect(structureDropPlacement(tree(), "c", "inside")).toEqual({ parentId: "c", index: 1 });
    expect(structureDropZone(2, 28, true)).toBe("before");
    expect(structureDropZone(14, 28, true)).toBe("inside");
    expect(structureDropZone(26, 28, true)).toBe("after");
    expect(structureDropZone(5, 28, false)).toBe("before");
    expect(structureDropZone(0, 0, true)).toBe("inside");
  });

  it("shifts with Alt+arrows: up, down, in, out", () => {
    const down = structureShift(tree(), "a", "down")!;
    expect(shape(down.items)).toBe("b,a(a1,a2(a2x)),c(c1)");
    expect(down).toMatchObject({ parentId: null, index: 1 });
    expect(shape(structureShift(tree(), "b", "up")!.items)).toBe("b,a(a1,a2(a2x)),c(c1)");
    expect(structureShift(tree(), "a", "up")).toBeNull();
    expect(structureShift(tree(), "c", "down")).toBeNull();
    const indent = structureShift(tree(), "b", "in")!;
    expect(shape(indent.items)).toBe("a(a1,a2(a2x),b),c(c1)");
    expect(indent).toMatchObject({ parentId: "a", index: 2 });
    const out = structureShift(tree(), "a2x", "out")!;
    expect(shape(out.items)).toBe("a(a1,a2,a2x),b,c(c1)");
    expect(structureShift(tree(), "a", "out")).toBeNull();
    expect(structureShift(tree(), "a", "in")).toBeNull();
  });

  it("filters to the matches and the way to them", () => {
    const r = structureFilter(tree(), "x", (n) => n.id)!;
    expect([...r.matches]).toEqual(["a2x"]);
    expect([...r.visible].sort()).toEqual(["a", "a2", "a2x"]);
    expect([...r.open].sort()).toEqual(["a", "a2"]);
    expect(structureFilter(tree(), "  ", (n) => n.id)).toBeNull();
  });

  it("cuts a label where the query appears", () => {
    expect(structureHighlight("Quarterly plan", "AR")).toEqual([
      { text: "Qu", match: false },
      { text: "ar", match: true },
      { text: "terly plan", match: false },
    ]);
    expect(structureHighlight("abc", "")).toEqual([{ text: "abc", match: false }]);
    expect(structureHighlight("abab", "ab")).toHaveLength(2);
  });

  it("lists every id", () => {
    expect(structureIds(tree())).toEqual(["a", "a1", "a2", "a2x", "b", "c", "c1"]);
  });
});

describe("structure outline helpers", () => {
  it("slugs names and avoids the ones taken", () => {
    expect(structureSlug("Été à Paris!")).toBe("ete-a-paris");
    expect(structureSlug("Plan", new Set(["plan", "plan-2"]))).toBe("plan-3");
    expect(structureSlug("???")).toBe("section");
  });

  it("nests headings by level, even when a level is skipped", () => {
    const tree = structureOutlineTree([
      { id: "1", text: "One", level: 1 },
      { id: "2", text: "Two", level: 2 },
      { id: "4", text: "Four", level: 4 },
      { id: "2b", text: "Two b", level: 2 },
      { id: "1b", text: "One b", level: 1 },
    ]);
    expect(tree.map((n) => n.id)).toEqual(["1", "1b"]);
    expect(tree[0]!.children.map((n) => n.id)).toEqual(["2", "2b"]);
    expect(tree[0]!.children[0]!.children.map((n) => n.id)).toEqual(["4"]);
  });

  it("finds the active heading from tops", () => {
    const tops = [
      { id: "a", top: -400 },
      { id: "b", top: -20 },
      { id: "c", top: 300 },
    ];
    expect(structureActiveHeading(tops, 0)).toBe("b");
    expect(structureActiveHeading(tops, 300)).toBe("c");
    expect(structureActiveHeading([{ id: "x", top: 50 }], 0)).toBe("x");
    expect(structureActiveHeading([], 0)).toBeNull();
  });
});

describe("structure org layout", () => {
  const size = { width: 100, height: 40, gapX: 10, gapY: 20 };
  const org: N[] = [
    {
      id: "ceo",
      children: [{ id: "cto", children: [{ id: "d1" }, { id: "d2" }] }, { id: "cfo" }],
    },
  ];

  it("centres a parent over its reports and never overlaps siblings", () => {
    const l = structureOrgLayout(org, new Set(), size);
    const at = (id: string) => l.boxes.find((b) => b.id === id)!;
    expect(at("d1").x).toBe(0);
    expect(at("d2").x).toBe(110);
    expect(at("cto").x).toBe(55);
    expect(at("cfo").x).toBe(220 + 0);
    expect(at("ceo").y).toBe(0);
    expect(at("cto").y).toBe(60);
    expect(at("d1").y).toBe(120);
    expect(l.height).toBe(160);
    expect(l.width).toBe(320);
    const kids = l.links.filter((k) => k.from === "ceo");
    expect(kids).toHaveLength(2);
    expect(kids[0]!.points[0]).toEqual([at("ceo").x + 50, 40]);
    expect(kids[0]!.points[3]).toEqual([at("cto").x + 50, 60]);
  });

  it("hides the reports of a folded card", () => {
    const l = structureOrgLayout(org, new Set(["cto"]), size);
    expect(l.boxes.map((b) => b.id)).toEqual(["ceo", "cto", "cfo"]);
    expect(l.boxes.find((b) => b.id === "cto")).toMatchObject({ branch: true, folded: true });
  });

  it("lays several trees side by side", () => {
    const l = structureOrgLayout([{ id: "x" }, { id: "y" }], new Set(), size);
    expect(l.boxes.map((b) => b.x)).toEqual([0, 110]);
    expect(l.links).toHaveLength(0);
  });

  it("moves with the arrow keys", () => {
    const { boxes } = structureOrgLayout(org, new Set(), size);
    expect(structureOrgNavigate(boxes, "ceo", "ArrowDown")).toBe("cto");
    expect(structureOrgNavigate(boxes, "cto", "ArrowRight")).toBe("cfo");
    expect(structureOrgNavigate(boxes, "cfo", "ArrowLeft")).toBe("cto");
    expect(structureOrgNavigate(boxes, "d2", "ArrowUp")).toBe("cto");
    expect(structureOrgNavigate(boxes, "ceo", "ArrowUp")).toBeNull();
    expect(structureOrgNavigate(boxes, "d2", "Home")).toBe("d1");
  });
});

describe("structure comment anchors", () => {
  const range = (start: number, end: number): StructureAnchor => ({
    kind: "range",
    blockId: "p1",
    start,
    end,
  });
  const edit = (at: number, remove: number, insert: number) => ({
    blockId: "p1",
    at,
    remove,
    insert,
  });

  it("moves with text typed before it, and ignores text after", () => {
    expect(structureRebaseAnchor(range(10, 20), edit(2, 0, 5))).toMatchObject({
      start: 15,
      end: 25,
    });
    expect(structureRebaseAnchor(range(10, 20), edit(20, 0, 5))).toMatchObject({
      start: 10,
      end: 20,
    });
    expect(structureRebaseAnchor(range(10, 20), edit(10, 0, 3))).toMatchObject({
      start: 13,
      end: 23,
    });
    expect(structureRebaseAnchor(range(10, 20), edit(2, 4, 0))).toMatchObject({
      start: 6,
      end: 16,
    });
  });

  it("grows and shrinks with an edit inside", () => {
    expect(structureRebaseAnchor(range(10, 20), edit(14, 0, 4))).toMatchObject({
      start: 10,
      end: 24,
    });
    expect(structureRebaseAnchor(range(10, 20), edit(12, 3, 0))).toMatchObject({
      start: 10,
      end: 17,
    });
  });

  it("cuts the part that was deleted at an edge, and loses a range deleted whole", () => {
    expect(structureRebaseAnchor(range(10, 20), edit(8, 4, 0))).toMatchObject({
      start: 8,
      end: 16,
    });
    expect(structureRebaseAnchor(range(10, 20), edit(16, 8, 0))).toMatchObject({
      start: 10,
      end: 16,
    });
    expect(structureRebaseAnchor(range(10, 20), edit(9, 12, 0))).toBeNull();
    expect(structureRebaseAnchor(range(10, 20), edit(10, 10, 4))).toBeNull();
  });

  it("leaves block anchors and other blocks alone", () => {
    const block: StructureAnchor = { kind: "block", blockId: "p1" };
    expect(structureRebaseAnchor(block, edit(0, 3, 0))).toBe(block);
    const other = structureRebaseAnchor(range(10, 20), { ...edit(0, 5, 0), blockId: "p2" });
    expect(other).toMatchObject({ start: 10, end: 20 });
  });

  it("lays threads out without overlap, the active one on its anchor", () => {
    const boxes = [
      { id: "a", top: 0, height: 100 },
      { id: "b", top: 20, height: 100 },
      { id: "c", top: 40, height: 100 },
    ];
    const plain = structureLayoutThreads(boxes, 10);
    expect([plain.get("a"), plain.get("b"), plain.get("c")]).toEqual([0, 110, 220]);
    const active = structureLayoutThreads(boxes, 10, "c");
    expect(active.get("c")).toBe(220);
    expect(structureLayoutThreads([{ id: "x", top: -5, height: 10 }], 10).get("x")).toBe(0);
    const spread = structureLayoutThreads(
      [
        { id: "a", top: 0, height: 10 },
        { id: "b", top: 500, height: 10 },
      ],
      8,
    );
    expect(spread.get("b")).toBe(500);
    const mid = structureLayoutThreads(
      [
        { id: "a", top: 300, height: 100 },
        { id: "b", top: 310, height: 100 },
      ],
      10,
      "b",
    );
    expect(mid.get("b")).toBe(310);
    expect(mid.get("a")).toBe(200);
  });
});

describe("structure diff", () => {
  const apply = (a: string[], b: string[]) => {
    const out: string[] = [];
    for (const op of structureDiffSeq(a, b)) {
      if (op.kind === "delete") continue;
      out.push(...b.slice(op.bStart, op.bEnd));
      if (op.kind === "equal")
        expect(a.slice(op.aStart, op.aEnd)).toEqual(b.slice(op.bStart, op.bEnd));
    }
    return out;
  };
  const lcs = (a: string[], b: string[]) => {
    const t = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        t[i]![j] =
          a[i - 1] === b[j - 1] ? t[i - 1]![j - 1]! + 1 : Math.max(t[i - 1]![j]!, t[i]![j - 1]!);
    return t[a.length]![b.length]!;
  };

  it("covers both inputs and finds the shortest script on random sequences", () => {
    const rand = structureRandom(7);
    for (let n = 0; n < 200; n++) {
      const a = Array.from(
        { length: Math.floor(rand() * 12) },
        () => "abc"[Math.floor(rand() * 3)]!,
      );
      const b = Array.from(
        { length: Math.floor(rand() * 12) },
        () => "abc"[Math.floor(rand() * 3)]!,
      );
      expect(apply(a, b)).toEqual(b);
      const ops = structureDiffSeq(a, b);
      expect(ops.reduce((s, o) => s + (o.kind === "equal" ? o.aEnd - o.aStart : 0), 0)).toBe(
        lcs(a, b),
      );
      expect(ops.reduce((s, o) => s + (o.aEnd - o.aStart), 0)).toBe(a.length);
      expect(ops.reduce((s, o) => s + (o.bEnd - o.bStart), 0)).toBe(b.length);
    }
  });

  it("handles empty sides and identical input", () => {
    expect(structureDiffSeq([], [])).toEqual([]);
    expect(structureDiffSeq([], ["x"])).toEqual([
      { kind: "insert", aStart: 0, aEnd: 0, bStart: 0, bEnd: 1 },
    ]);
    expect(structureDiffSeq(["x"], [])).toEqual([
      { kind: "delete", aStart: 0, aEnd: 1, bStart: 0, bEnd: 0 },
    ]);
    expect(structureDiffSeq(["x", "y"], ["x", "y"])).toHaveLength(1);
  });

  it("marks the words that changed in a line", () => {
    const d = structureDiffWords("The quick brown fox", "The quick red fox")!;
    expect(d.before.filter((p) => p.changed).map((p) => p.text)).toEqual(["brown"]);
    expect(d.after.filter((p) => p.changed).map((p) => p.text)).toEqual(["red"]);
    expect(d.before.map((p) => p.text).join("")).toBe("The quick brown fox");
    expect(structureDiffWords("alpha beta", "gamma delta")).toBeNull();
  });

  it("lists rows with numbers, pairs a change, and folds long unchanged runs", () => {
    const a = ["l1", "l2", "l3", "l4", "l5", "l6", "l7", "l8", "l9", "old line here"].join("\n");
    const b = ["l1", "l2", "l3", "l4", "l5", "l6", "l7", "l8", "l9", "new line here"].join("\n");
    const rows = structureDiffRows(a, b, { context: 2 });
    expect(rows.map((r) => r.kind)).toEqual(["fold", "same", "same", "del", "add"]);
    expect(rows[0]).toMatchObject({ kind: "fold", count: 7, id: "fold-1" });
    expect(rows[3]).toMatchObject({ kind: "del", aNo: 10 });
    expect(rows[4]).toMatchObject({ kind: "add", bNo: 10 });
    expect((rows[3] as { pieces?: unknown[] }).pieces).toBeDefined();
    const open = structureDiffRows(a, b, { context: 2, expanded: new Set(["fold-1"]) });
    expect(open.filter((r) => r.kind === "same")).toHaveLength(9);
    expect(structureDiffRows(a, b, { collapse: false })).toHaveLength(11);
    expect(structureDiffRows("", "a\nb")).toEqual([
      { kind: "add", bNo: 1, text: "a" },
      { kind: "add", bNo: 2, text: "b" },
    ]);
  });

  it("faces a removed line with the one added in its place", () => {
    const rows = structureSplitRows(
      structureDiffRows("a\nb\nc", "a\nB\nB2\nc", { collapse: false }),
    );
    expect(rows.map((r) => `${r.left?.text ?? "-"}|${r.right?.text ?? "-"}`)).toEqual([
      "a|a",
      "b|B",
      "-|B2",
      "c|c",
    ]);
  });

  it("diffs the fields of two records, nested ones by path", () => {
    const d = structureDiffFields(
      { name: "Ada Lovelace", city: { name: "Paris" }, tags: ["a", "b"], old: 1, same: true },
      { name: "Ada King", city: { name: "Lyon" }, tags: ["a", "b", "c"], fresh: null, same: true },
    );
    const by = Object.fromEntries(d.map((c) => [c.key, c]));
    expect(by.name).toMatchObject({ status: "changed", before: "Ada Lovelace", after: "Ada King" });
    expect(by["city.name"]).toMatchObject({ status: "changed" });
    expect(by.tags).toMatchObject({ status: "changed", before: "a, b", after: "a, b, c" });
    expect(by.old).toMatchObject({ status: "removed", before: "1" });
    expect(by.fresh).toMatchObject({ status: "added", after: "" });
    expect(by.same).toMatchObject({ status: "same" });
    expect(by.name!.pieces).toBeDefined();
  });
});

describe("structure templates and covers", () => {
  const templates = [
    { id: "a", name: "Meeting notes", category: "Team", keywords: ["agenda"] },
    { id: "b", name: "Roadmap", category: "Product", description: "Quarter by quarter" },
    { id: "c", name: "Retro", category: "Team" },
  ];
  it("filters by category and words", () => {
    expect(structureFilterTemplates(templates, "Team", "").map((t) => t.id)).toEqual(["a", "c"]);
    expect(structureFilterTemplates(templates, null, "agenda").map((t) => t.id)).toEqual(["a"]);
    expect(structureFilterTemplates(templates, null, "quarter").map((t) => t.id)).toEqual(["b"]);
    expect(structureFilterTemplates(templates, "Product", "retro")).toEqual([]);
  });

  it("draws the same field for the same seed, and a path of runs", () => {
    const a = structureCoverCells("noise", 24, 8, 3);
    const b = structureCoverCells("noise", 24, 8, 3);
    expect(Array.from(a)).toEqual(Array.from(b));
    expect(Array.from(structureCoverCells("noise", 24, 8, 4))).not.toEqual(Array.from(a));
    const cells = new Uint8Array([1, 1, 0, 1, 0, 0, 0, 1]);
    expect(structureCoverPath(cells, 4, 2)).toBe("M0 0h2v1h-2zM3 0h1v1h-1zM3 1h1v1h-1z");
    for (const p of [
      "ember",
      "dusk",
      "hatch",
      "grid",
      "checker",
      "steps",
      "waves",
      "bricks",
    ] as const) {
      const lit = structureCoverCells(p).reduce((s, v) => s + v, 0);
      expect(lit).toBeGreaterThan(0);
    }
  });

  it("accepts only safe picture addresses", () => {
    expect(structureSafeImageUrl("https://x.test/a.png")).toBe("https://x.test/a.png");
    expect(structureSafeImageUrl(" /img/a.png ")).toBe("/img/a.png");
    expect(structureSafeImageUrl("blob:abc")).toBe("blob:abc");
    expect(structureSafeImageUrl("data:image/png;base64,AAAA")).toBe("data:image/png;base64,AAAA");
    expect(structureSafeImageUrl("javascript:alert(1)")).toBeNull();
    expect(structureSafeImageUrl("//evil.test/a.png")).toBeNull();
    expect(structureSafeImageUrl("data:text/html;base64,AAAA")).toBeNull();
    expect(structureSafeImageUrl("")).toBeNull();
  });
});

describe("structure headings from the DOM", () => {
  // @vitest-environment jsdom is set on the block test; here a minimal fake keeps this file pure.
  it("reads levels, skips empty ones and gives ids", () => {
    const make = (tag: string, text: string, id = "") => ({
      tagName: tag,
      id,
      textContent: text,
      getAttribute: () => null,
    });
    const els = [
      make("H1", "Intro", "intro"),
      make("H2", "Plan"),
      make("H2", "Plan"),
      make("H3", "  "),
    ];
    const root = { querySelectorAll: () => els } as unknown as ParentNode;
    const out = structureHeadingsFrom(root);
    expect(out).toEqual([
      { id: "intro", text: "Intro", level: 1 },
      { id: "plan", text: "Plan", level: 2 },
      { id: "plan-2", text: "Plan", level: 2 },
    ]);
  });
});
