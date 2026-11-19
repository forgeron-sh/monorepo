// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup as html } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CoverArt,
  CoverPicker,
  DiffView,
  FieldDiff,
  InlineComments,
  OrgChart,
  Outline,
  TemplateGallery,
  Tree,
  VersionCompare,
  type CoverValue,
  type InlineThread,
  type OrgPerson,
  type TemplateItem,
  type TreeMove,
  type TreeNode,
} from "../index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | undefined;
afterEach(() => {
  host?.remove();
  host = undefined;
  document.body.innerHTML = "";
});
const mount = async (element: Parameters<ReturnType<typeof createRoot>["render"]>[0]) => {
  host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () => root.render(element));
  return host;
};
const key = async (el: Element, k: string, init: KeyboardEventInit = {}) =>
  act(async () => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, ...init }));
  });
const click = async (el: Element, init: MouseEventInit = {}) =>
  act(async () => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, ...init }));
  });
const drag = async (el: Element, type: string, clientY = 0) =>
  act(async () => {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(event, "dataTransfer", {
      value: { types: [], files: [], getData: () => "", setData: () => {}, dropEffect: "none" },
    });
    Object.defineProperty(event, "clientY", { value: clientY });
    el.dispatchEvent(event);
  });
const typeInto = async (input: HTMLInputElement, value: string) =>
  act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
const q = <T extends Element = HTMLElement>(root: ParentNode, selector: string) =>
  root.querySelector<T>(selector)!;
const items = (root: ParentNode, selector: string) =>
  Array.from(root.querySelectorAll<HTMLElement>(selector));
const treeItem = (root: ParentNode, id: string) => q(root, `[data-tree-id="${id}"]`);

const PAGES: TreeNode[] = [
  {
    id: "docs",
    label: "Docs",
    children: [
      { id: "intro", label: "Intro" },
      { id: "guide", label: "Guide", children: [{ id: "setup", label: "Setup" }] },
    ],
  },
  { id: "notes", label: "Notes", count: 3 },
  { id: "lazy", label: "Archive", hasChildren: true },
];

describe("Tree", () => {
  it("is a tree with levels, sizes and expanded state", async () => {
    const el = await mount(h(Tree, { items: PAGES, defaultExpanded: ["docs"], label: "Pages" }));
    expect(q(el, "[role=tree]").getAttribute("aria-label")).toBe("Pages");
    const docs = treeItem(el, "docs");
    expect(docs.getAttribute("aria-expanded")).toBe("true");
    expect(docs.getAttribute("aria-level")).toBe("1");
    expect(docs.getAttribute("aria-setsize")).toBe("3");
    expect(treeItem(el, "intro").getAttribute("aria-level")).toBe("2");
    expect(treeItem(el, "intro").getAttribute("aria-posinset")).toBe("1");
    expect(treeItem(el, "setup")).toBeNull();
    expect(q(el, ".fg-tree-count").textContent).toBe("3");
    // One stop in the tab order.
    expect(items(el, "[role=treeitem][tabindex='0']")).toHaveLength(1);
  });

  it("walks with arrows, opens and closes, and types ahead", async () => {
    const el = await mount(h(Tree, { items: PAGES, defaultExpanded: ["docs"] }));
    const first = treeItem(el, "docs");
    first.focus();
    await key(first, "ArrowDown");
    expect(document.activeElement).toBe(treeItem(el, "intro"));
    await key(treeItem(el, "intro"), "ArrowLeft");
    expect(document.activeElement).toBe(treeItem(el, "docs"));
    await key(treeItem(el, "docs"), "ArrowLeft");
    expect(treeItem(el, "docs").getAttribute("aria-expanded")).toBe("false");
    await key(treeItem(el, "docs"), "ArrowRight");
    expect(treeItem(el, "docs").getAttribute("aria-expanded")).toBe("true");
    await key(treeItem(el, "docs"), "End");
    expect(document.activeElement).toBe(treeItem(el, "lazy"));
    await key(treeItem(el, "lazy"), "n");
    expect(document.activeElement).toBe(treeItem(el, "notes"));
  });

  it("selects one, or several with the modifiers", async () => {
    const onSelectedChange = vi.fn<(...args: any[]) => void>();
    const el = await mount(
      h(Tree, {
        items: PAGES,
        defaultExpanded: ["docs"],
        selectionMode: "multiple",
        onSelectedChange,
      }),
    );
    await click(q(treeItem(el, "intro"), ".fg-tree-row"));
    await click(q(treeItem(el, "notes"), ".fg-tree-row"), { metaKey: true });
    expect(onSelectedChange).toHaveBeenLastCalledWith(["intro", "notes"]);
    expect(q(el, "[role=tree]").getAttribute("aria-multiselectable")).toBe("true");
    await click(q(treeItem(el, "docs"), ".fg-tree-row"));
    await click(q(treeItem(el, "guide"), ".fg-tree-row"), { shiftKey: true });
    expect(onSelectedChange).toHaveBeenLastCalledWith(["docs", "intro", "guide"]);
  });

  it("activates on Enter and loads children on the first opening", async () => {
    const onActivate = vi.fn<(...args: any[]) => void>();
    let done: () => void = () => {};
    const onLoadChildren = vi.fn<(id: string) => Promise<void>>(
      () => new Promise<void>((r) => (done = r)),
    );
    const el = await mount(h(Tree, { items: PAGES, onActivate, onLoadChildren }));
    await key(treeItem(el, "notes"), "Enter");
    expect(onActivate).toHaveBeenCalledWith("notes");
    await key(treeItem(el, "lazy"), "ArrowRight");
    expect(onLoadChildren).toHaveBeenCalledWith("lazy");
    expect(el.textContent).toContain("Loading");
    await act(async () => done());
  });

  it("moves with Alt+arrows and tells the new tree", async () => {
    const onMove = vi.fn<(m: TreeMove) => void>();
    const el = await mount(h(Tree, { items: PAGES, defaultExpanded: ["docs"], onMove }));
    await key(treeItem(el, "intro"), "ArrowDown", { altKey: true });
    const move = onMove.mock.calls[0]![0];
    expect(move).toMatchObject({ ids: ["intro"], parentId: "docs", index: 1 });
    expect(move.items[0]!.children!.map((n) => n.id)).toEqual(["guide", "intro"]);
    expect(el.querySelector("[role=status]")!.textContent).toContain("Intro moved");
    await key(treeItem(el, "notes"), "ArrowRight", { altKey: true });
    expect(onMove.mock.calls[1]![0]).toMatchObject({ ids: ["notes"], parentId: "docs" });
    await key(treeItem(el, "docs"), "ArrowUp", { altKey: true });
    expect(onMove).toHaveBeenCalledTimes(2);
  });

  it("does not drag or move without onMove", async () => {
    const el = await mount(h(Tree, { items: PAGES }));
    expect(q(treeItem(el, "notes"), ".fg-tree-row").getAttribute("draggable")).toBeNull();
  });

  it("drops a row before, inside and after another, with a drop mark", async () => {
    const onMove = vi.fn<(m: TreeMove) => void>();
    const el = await mount(h(Tree, { items: PAGES, defaultExpanded: ["docs"], onMove }));
    const notes = q(treeItem(el, "notes"), ".fg-tree-row");
    expect(notes.getAttribute("draggable")).toBe("true");
    await drag(notes, "dragstart");
    const intro = q(treeItem(el, "intro"), ".fg-tree-row");
    // jsdom has no layout: a zero-height row drops inside.
    await drag(intro, "dragover");
    expect(intro.className).toContain("fg-tree-drop-inside");
    await drag(intro, "drop");
    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onMove.mock.calls[0]![0]).toMatchObject({ ids: ["notes"], parentId: "intro", index: 0 });
  });

  it("refuses to drop a row into itself", async () => {
    const onMove = vi.fn<(...args: any[]) => void>();
    const el = await mount(h(Tree, { items: PAGES, defaultExpanded: ["docs"], onMove }));
    await drag(q(treeItem(el, "docs"), ".fg-tree-row"), "dragstart");
    const guide = q(treeItem(el, "guide"), ".fg-tree-row");
    await drag(guide, "dragover");
    expect(guide.className).not.toContain("fg-tree-drop");
    await drag(guide, "drop");
    expect(onMove).not.toHaveBeenCalled();
  });

  it("renames in place with F2: Enter commits, Escape cancels", async () => {
    const onRename = vi.fn<(...args: any[]) => void>();
    const el = await mount(h(Tree, { items: PAGES, onRename }));
    await key(treeItem(el, "notes"), "F2");
    const input = q<HTMLInputElement>(el, "input.fg-tree-rename");
    expect(input.value).toBe("Notes");
    await typeInto(input, "Journal");
    await key(input, "Enter");
    expect(onRename).toHaveBeenCalledWith("notes", "Journal");
    expect(el.querySelector("input")).toBeNull();
    await key(treeItem(el, "notes"), "F2");
    await key(q(el, "input"), "Escape");
    expect(onRename).toHaveBeenCalledTimes(1);
  });

  it("filters to the matches, opens the way and marks the words", async () => {
    const el = await mount(h(Tree, { items: PAGES, filter: "set" }));
    expect(items(el, "[role=treeitem]").map((e) => e.dataset.treeId)).toEqual([
      "docs",
      "guide",
      "setup",
    ]);
    expect(q(el, "mark.fg-tree-mark").textContent).toBe("Set");
  });

  it("shows the empty state when nothing matches", async () => {
    const el = await mount(h(Tree, { items: PAGES, filter: "zzz", empty: "Nothing here" }));
    expect(el.textContent).toContain("Nothing here");
    expect(el.querySelector("[role=treeitem]")).toBeNull();
  });

  it("takes a node renderer", async () => {
    const el = await mount(
      h(Tree, {
        items: PAGES,
        renderItem: (n: TreeNode) => h("em", { className: "mine" }, n.label.toUpperCase()),
      }),
    );
    expect(q(el, "em.mine").textContent).toBe("DOCS");
  });
});

describe("Outline", () => {
  const headings = [
    { id: "intro", text: "Intro", level: 1 },
    { id: "why", text: "Why", level: 2 },
    { id: "how", text: "How", level: 2 },
    { id: "end", text: "The end", level: 1 },
  ];

  it("nests the headings, marks the active one and links to ids", async () => {
    const el = await mount(h(Outline, { headings, defaultActive: "how" }));
    expect(q(el, "nav").getAttribute("aria-label")).toBe("On this page");
    const links = items(el, "a.fg-outline-link");
    expect(links.map((a) => a.getAttribute("href"))).toEqual(["#intro", "#why", "#how", "#end"]);
    expect(links[2]!.getAttribute("aria-current")).toBe("location");
    expect(links[1]!.getAttribute("aria-current")).toBeNull();
    expect(items(el, "ul ul")).toHaveLength(1);
  });

  it("folds a branch and reports the click", async () => {
    const onSelect = vi.fn<(...args: any[]) => void>();
    const onActiveChange = vi.fn<(...args: any[]) => void>();
    const el = await mount(h(Outline, { headings, onSelect, onActiveChange }));
    await click(q(el, "button[aria-label='Collapse Intro']"));
    expect(items(el, "a.fg-outline-link").map((a) => a.textContent)).toEqual(["Intro", "The end"]);
    expect(q(el, "button[aria-expanded]").getAttribute("aria-expanded")).toBe("false");
    await click(items(el, "a.fg-outline-link")[1]!);
    expect(onSelect).toHaveBeenCalledWith("end", expect.anything());
    expect(onActiveChange).toHaveBeenCalledWith("end");
  });

  it("scrolls to the heading on click and focuses it", async () => {
    const target = document.createElement("h2");
    target.id = "why";
    target.scrollIntoView = vi.fn<(...args: any[]) => void>();
    document.body.append(target);
    const el = await mount(h(Outline, { headings }));
    await click(items(el, "a.fg-outline-link")[1]!);
    expect(target.scrollIntoView).toHaveBeenCalled();
    expect(document.activeElement).toBe(target);
  });

  it("reads the headings of an element, and gives them ids", async () => {
    const doc = document.createElement("article");
    doc.id = "doc";
    doc.innerHTML = "<h1>Alpha</h1><p>x</p><h2>Beta</h2><h2>Beta</h2>";
    document.body.append(doc);
    const el = await mount(h(Outline, { from: "#doc" }));
    expect(items(el, "a.fg-outline-link").map((a) => a.getAttribute("href"))).toEqual([
      "#alpha",
      "#beta",
      "#beta-2",
    ]);
    expect(doc.querySelector("h2")!.id).toBe("beta");
  });

  it("limits the levels, folds the whole panel and says when empty", async () => {
    const el = await mount(
      h(Outline, { headings, maxLevel: 1, foldable: true, title: "Contents" }),
    );
    expect(items(el, "a.fg-outline-link")).toHaveLength(2);
    const head = q(el, "button.fg-outline-head");
    expect(head.getAttribute("aria-expanded")).toBe("true");
    await click(head);
    expect(head.getAttribute("aria-expanded")).toBe("false");
    const none = await mount(h(Outline, { headings: [] }));
    expect(none.textContent).toContain("No headings yet");
  });
});

describe("OrgChart", () => {
  const people: OrgPerson[] = [
    {
      id: "ceo",
      name: "Ada King",
      title: "CEO",
      children: [
        {
          id: "cto",
          name: "Lin Park",
          title: "CTO",
          children: [{ id: "dev", name: "Open role", title: "Backend engineer", vacant: true }],
        },
        { id: "cfo", name: "Max Roy", title: "CFO" },
      ],
    },
  ];

  it("is a tree of cards with levels and a fold per branch", async () => {
    const el = await mount(h(OrgChart, { roots: people, defaultCollapsed: ["cto"] }));
    expect(q(el, "[role=tree]").getAttribute("aria-label")).toBe("Organisation chart");
    const cards = items(el, "[role=treeitem]");
    expect(cards.map((c) => c.dataset.orgId)).toEqual(["ceo", "cto", "cfo"]);
    expect(cards[1]!.getAttribute("aria-expanded")).toBe("false");
    expect(cards[1]!.getAttribute("aria-level")).toBe("2");
    expect(cards[2]!.getAttribute("aria-posinset")).toBe("2");
    expect(q(cards[1]!, ".fg-org-fold").textContent).toBe("+1");
    expect(el.querySelectorAll("svg path").length).toBe(2);
  });

  it("walks with arrows, unfolds on Down, folds with minus", async () => {
    const onSelectedChange = vi.fn<(...args: any[]) => void>();
    const onActivate = vi.fn<(...args: any[]) => void>();
    const el = await mount(
      h(OrgChart, { roots: people, defaultCollapsed: ["cto"], onSelectedChange, onActivate }),
    );
    const card = (id: string) => q(el, `[data-org-id="${id}"]`);
    card("ceo").focus();
    await key(card("ceo"), "ArrowDown");
    expect(document.activeElement).toBe(card("cto"));
    await key(card("cto"), "ArrowRight");
    expect(document.activeElement).toBe(card("cfo"));
    await key(card("cfo"), "ArrowLeft");
    await key(card("cto"), "ArrowDown");
    expect(card("dev")).not.toBeNull();
    await key(card("cto"), "-");
    expect(el.querySelector('[data-org-id="dev"]')).toBeNull();
    await key(card("cto"), "Enter");
    expect(onSelectedChange).toHaveBeenCalledWith("cto");
    expect(onActivate).toHaveBeenCalledWith("cto");
    await key(card("cto"), "ArrowUp");
    expect(document.activeElement).toBe(card("ceo"));
  });

  it("marks a vacancy and offers the detailed card", async () => {
    const el = await mount(h(OrgChart, { roots: people, variant: "detailed" }));
    const vacant = q(el, '[data-org-id="dev"]');
    expect(vacant.className).toContain("fg-org-card-vacant");
    expect(vacant.textContent).toContain("Vacant");
    expect(vacant.textContent).toContain("Backend engineer");
    expect(q(el, '[data-org-id="ceo"]').textContent).toContain("3 under them");
    expect(el.querySelector(".fg-org-detailed")).not.toBeNull();
  });

  it("folds from the pointer and takes a card renderer", async () => {
    const onCollapsedChange = vi.fn<(...args: any[]) => void>();
    const el = await mount(
      h(OrgChart, {
        roots: people,
        onCollapsedChange,
        renderCard: (p: OrgPerson) => h("b", { className: "mine" }, p.id),
      }),
    );
    expect(items(el, "b.mine")).toHaveLength(4);
    await click(q(el, '[data-org-id="cto"] .fg-org-fold'));
    expect(onCollapsedChange).toHaveBeenCalledWith(["cto"]);
  });
});

describe("TemplateGallery", () => {
  const templates: TemplateItem[] = [
    { id: "meet", name: "Meeting notes", category: "Team", description: "Agenda and actions" },
    { id: "road", name: "Roadmap", category: "Product", description: "Quarter by quarter" },
    { id: "retro", name: "Retro", category: "Team" },
  ];

  it("starts on the blank entry and chooses it as null", async () => {
    const onChoose = vi.fn<(...args: any[]) => void>();
    const el = await mount(h(TemplateGallery, { templates, onChoose }));
    const options = items(el, "[role=option]");
    expect(options.map((o) => o.textContent)).toContain("Blank");
    expect(options[0]!.getAttribute("aria-selected")).toBe("true");
    await click(q(el, ".fg-tgal-pane button"));
    expect(onChoose).toHaveBeenCalledWith(null);
  });

  it("previews the one pointed at and chooses it with Enter", async () => {
    const onChoose = vi.fn<(...args: any[]) => void>();
    const el = await mount(h(TemplateGallery, { templates, onChoose }));
    const road = items(el, "[role=option]").find((o) => o.dataset.template === "road")!;
    await click(road);
    expect(q(el, ".fg-tgal-title").textContent).toBe("Roadmap");
    expect(q(el, ".fg-tgal-desc").textContent).toBe("Quarter by quarter");
    await key(road, "Enter");
    expect(onChoose).toHaveBeenCalledWith("road");
    await key(road, "ArrowRight");
    expect(document.activeElement!.getAttribute("data-template")).toBe("retro");
  });

  it("filters by category and by words, and hides the blank entry", async () => {
    const el = await mount(h(TemplateGallery, { templates, onChoose: () => {} }));
    await click(items(el, ".fg-tgal-catbtn").find((b) => b.textContent!.startsWith("Team"))!);
    expect(items(el, "[role=option]").map((o) => o.dataset.template)).toEqual(["meet", "retro"]);
    await click(items(el, ".fg-tgal-catbtn")[0]!);
    await typeInto(q<HTMLInputElement>(el, "input[type=search]"), "quarter");
    expect(items(el, "[role=option]").map((o) => o.dataset.template)).toEqual(["road"]);
    await typeInto(q<HTMLInputElement>(el, "input[type=search]"), "zzz");
    expect(el.textContent).toContain("No template matches.");
  });

  it("works without the blank entry", async () => {
    const el = await mount(h(TemplateGallery, { templates, blank: false, onChoose: () => {} }));
    expect(items(el, "[role=option]")).toHaveLength(3);
    expect(q(el, ".fg-tgal-title").textContent).toBe("Meeting notes");
  });
});

describe("CoverArt and CoverPicker", () => {
  it("draws a pattern as a pixel path in a token colour", () => {
    const out = html(h(CoverArt, { value: { type: "pattern", pattern: "hatch", tone: "accent" } }));
    expect(out).toContain('shape-rendering="crispEdges"');
    expect(out).toContain("var(--accent)");
    expect(out).toContain('<path d="M');
  });

  it("holds a picture at its position and refuses an unsafe address", () => {
    const ok = html(h(CoverArt, { value: { type: "image", src: "/a.png", position: 20 } }));
    expect(ok).toContain("object-position:50% 20%");
    const bad = html(h(CoverArt, { value: { type: "image", src: "javascript:alert(1)" } }));
    expect(bad).not.toContain("<img");
  });

  it("picks a pattern in a tone and removes it", async () => {
    const onChange = vi.fn<(...args: any[]) => void>();
    const el = await mount(h(CoverPicker, { onChange }));
    expect(el.textContent).toContain("No cover");
    await click(q(el, "button[aria-label='checker']"));
    expect(onChange).toHaveBeenLastCalledWith({
      type: "pattern",
      pattern: "checker",
      tone: "accent",
    });
    await click(items(el, ".fg-coverpick-tone").find((b) => b.textContent === "Ink")!);
    expect(onChange).toHaveBeenLastCalledWith({ type: "pattern", pattern: "checker", tone: "ink" });
    await click(items(el, "button").find((b) => b.textContent === "Remove")!);
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("adds a picture by link, and says when the address is wrong", async () => {
    const onChange = vi.fn<(...args: any[]) => void>();
    const el = await mount(h(CoverPicker, { onChange }));
    await click(items(el, "button").find((b) => b.textContent === "Link")!);
    const input = q<HTMLInputElement>(el, "input");
    await typeInto(input, "javascript:alert(1)");
    await click(items(el, "button").find((b) => b.textContent === "Use picture")!);
    expect(q(el, "[role=alert]").textContent).toContain("https://");
    expect(onChange).not.toHaveBeenCalled();
    await typeInto(input, "https://pics.test/a.jpg");
    await click(items(el, "button").find((b) => b.textContent === "Use picture")!);
    expect(onChange).toHaveBeenCalledWith({
      type: "image",
      src: "https://pics.test/a.jpg",
      position: 50,
    });
  });

  it("moves a picture with the arrow keys, as a slider", async () => {
    const onChange = vi.fn<(...args: any[]) => void>();
    const value: CoverValue = { type: "image", src: "/a.png", position: 50 };
    const el = await mount(h(CoverPicker, { value, onChange }));
    const slider = q(el, "[role=slider]");
    expect(slider.getAttribute("aria-valuenow")).toBe("50");
    expect(slider.getAttribute("aria-label")).toBe("Cover position");
    await key(slider, "ArrowDown");
    expect(onChange).toHaveBeenLastCalledWith({ ...value, position: 52 });
    await key(slider, "End");
    expect(onChange).toHaveBeenLastCalledWith({ ...value, position: 100 });
  });

  it("leaves out the tabs it was told to", async () => {
    const el = await mount(h(CoverPicker, { upload: false, link: false }));
    expect(el.querySelector(".fg-seg")).toBeNull();
  });
});

describe("InlineComments", () => {
  const threads: InlineThread[] = [
    {
      id: "t1",
      anchor: { kind: "range", blockId: "p1", start: 0, end: 5, quote: "Hello" },
      status: "open",
      comments: [
        { id: "c1", author: "Ada King", at: "Nov 17", body: "Say **more** here" },
        { id: "c2", author: "Lin Park", at: "Nov 18", body: "Agreed" },
      ],
    },
    {
      id: "t2",
      anchor: { kind: "block", blockId: "p2" },
      status: "resolved",
      comments: [{ id: "c3", author: "Max Roy", at: "Nov 16", body: "Fixed" }],
    },
  ];

  it("shows the open threads first, with the quote and the replies", async () => {
    const el = await mount(h(InlineComments, { threads }));
    const cards = items(el, "article");
    expect(cards).toHaveLength(1);
    expect(cards[0]!.textContent).toContain("Hello");
    expect(cards[0]!.textContent).toContain("Lin Park");
    expect(q(el, ".fg-seg").textContent).toContain("Open 1");
    expect(q(el, ".fg-seg").textContent).toContain("Resolved 1");
  });

  it("filters to resolved and reopens", async () => {
    const onReopen = vi.fn<(...args: any[]) => void>();
    const el = await mount(h(InlineComments, { threads, defaultFilter: "resolved", onReopen }));
    expect(items(el, "article")).toHaveLength(1);
    await click(items(el, "button").find((b) => b.textContent === "Reopen")!);
    expect(onReopen).toHaveBeenCalledWith("t2");
  });

  it("resolves, and sets the active thread on focus", async () => {
    const onResolve = vi.fn<(...args: any[]) => void>();
    const onActiveChange = vi.fn<(...args: any[]) => void>();
    const el = await mount(
      h(InlineComments, { threads, onResolve, onActiveChange, layout: "stack" }),
    );
    await click(items(el, "button").find((b) => b.textContent === "Resolve")!);
    expect(onResolve).toHaveBeenCalledWith("t1");
    expect(onActiveChange).toHaveBeenCalledWith("t1");
  });

  it("opens a box to reply, and sends the text", async () => {
    const onReply = vi.fn<(...args: any[]) => void>();
    const el = await mount(h(InlineComments, { threads, onReply, layout: "stack" }));
    await click(items(el, "button").find((b) => b.textContent === "Reply")!);
    const box = q<HTMLTextAreaElement>(el, "textarea");
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!;
      setter.call(box, "On it");
      box.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await key(box, "Enter", { metaKey: true });
    expect(onReply).toHaveBeenCalledWith("t1", "On it", []);
  });

  it("starts a thread from a draft", async () => {
    const onCreate = vi.fn<(...args: any[]) => void>();
    const onCancelDraft = vi.fn<(...args: any[]) => void>();
    const draft = { kind: "range" as const, blockId: "p9", start: 2, end: 6, quote: "word" };
    const el = await mount(
      h(InlineComments, { threads: [], draft, onCreate, onCancelDraft, layout: "stack" }),
    );
    expect(q(el, "article[aria-label='New comment']").textContent).toContain("word");
    await click(items(el, "button").find((b) => b.textContent === "Cancel")!);
    expect(onCancelDraft).toHaveBeenCalled();
    const box = q<HTMLTextAreaElement>(el, "textarea");
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!;
      setter.call(box, "Why?");
      box.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await key(box, "Enter", { metaKey: true });
    expect(onCreate).toHaveBeenCalledWith(draft, "Why?", []);
  });

  it("says when there is nothing to show", async () => {
    const el = await mount(h(InlineComments, { threads: [] }));
    expect(el.textContent).toContain("No comments");
  });

  it("places the cards from the anchors it is told, without overlap", async () => {
    const two: InlineThread[] = [
      { ...threads[0]!, id: "a" },
      { ...threads[0]!, id: "b", anchor: { kind: "block", blockId: "p2" } },
    ];
    const tops: Record<string, number> = { p1: 10, p2: 20 };
    const el = await mount(
      h(InlineComments, { threads: two, measure: (a) => tops[a.blockId] ?? null }),
    );
    const [a, b] = items(el, "article");
    expect(a!.style.top).toBe("10px");
    // jsdom measures every card at the default height, 120, plus the gap.
    expect(b!.style.top).toBe("138px");
  });
});

describe("DiffView", () => {
  const before = [
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten the old way",
  ].join("\n");
  const after = [
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten the new way",
  ].join("\n");

  it("lists the lines unified, marks the words, and folds the rest", async () => {
    const el = await mount(h(DiffView, { before, after, context: 2 }));
    expect(q(el, ".fg-diff-stats").textContent).toBe("+1−1");
    expect(q(el, "del.fg-diff-word").textContent).toBe("old");
    expect(q(el, "ins.fg-diff-word").textContent).toBe("new");
    expect(items(el, "tr.fg-diff-row")).toHaveLength(4);
    const fold = q(el, "button.fg-diff-fold");
    expect(fold.textContent).toContain("7 unchanged lines");
    await click(fold);
    expect(items(el, "tr.fg-diff-row")).toHaveLength(11);
    expect(el.querySelector("button.fg-diff-fold")).toBeNull();
  });

  it("switches to two columns, facing the removed line with the added one", async () => {
    const el = await mount(
      h(DiffView, { before, after, defaultMode: "split", beforeLabel: "v1", afterLabel: "v2" }),
    );
    expect(items(el, "th").map((t) => t.textContent)).toEqual(["v1", "v2"]);
    const row = items(el, "tr.fg-diff-row").at(-1)!;
    expect(row.textContent).toContain("old");
    expect(row.textContent).toContain("new");
    await click(items(el, ".fg-seg button").find((b) => b.textContent === "Unified")!);
    expect(el.querySelector(".fg-diff-unified")).not.toBeNull();
  });

  it("says when nothing differs", async () => {
    const el = await mount(h(DiffView, { before: "a", after: "a", same: "Identical" }));
    expect(el.textContent).toContain("Identical");
    expect(el.querySelector("table")).toBeNull();
  });
});

describe("FieldDiff", () => {
  const a = { title: "Old plan", owner: "Ada", stage: "Draft", tags: ["a"] };
  const b = { title: "New plan", owner: "Ada", stage: "Review", note: "Ready", tags: ["a"] };

  it("lists what changed with its before and after, and hides what did not", async () => {
    const el = await mount(h(FieldDiff, { before: a, after: b, labels: { stage: "Stage" } }));
    const rows = items(el, "tbody tr");
    expect(rows.map((r) => q(r, "th").textContent!.replace(/\s*\(.*\)/, ""))).toEqual([
      "title",
      "Stage",
      "note",
    ]);
    expect(rows[1]!.textContent).toContain("Draft");
    expect(rows[1]!.textContent).toContain("Review");
    expect(rows[2]!.className).toContain("fg-fdiff-added");
    const more = items(el, "button").find((x) => x.textContent!.startsWith("Show 2"))!;
    await click(more);
    expect(items(el, "tbody tr")).toHaveLength(5);
  });

  it("says when no field changed", async () => {
    const el = await mount(h(FieldDiff, { before: a, after: a }));
    expect(el.textContent).toContain("No field changed.");
  });
});

describe("VersionCompare", () => {
  const versions = [
    { id: "v3", label: "v3", at: "Nov 18", by: "Ada King", content: "alpha\nbeta changed\ngamma" },
    {
      id: "v2",
      label: "v2",
      at: "Nov 10",
      by: "Lin Park",
      note: "Typos",
      content: "alpha\nbeta\ngamma",
    },
    { id: "v1", label: "v1", at: "Nov 1", by: "Max Roy", content: "alpha" },
  ];

  it("compares the previous version with the current one by default", async () => {
    const el = await mount(h(VersionCompare, { versions }));
    expect(q(el, ".fg-vcmp-title").textContent).toBe("v2v3");
    expect(q(el, "ins.fg-diff-word, .fg-diff-add")).not.toBeNull();
    expect(q(el, "button[aria-label='Compare from v2']").getAttribute("aria-pressed")).toBe("true");
    expect(q(el, "button[aria-label='Compare to v3']").getAttribute("aria-pressed")).toBe("true");
  });

  it("changes a side and reports it", async () => {
    const onFromChange = vi.fn<(...args: any[]) => void>();
    const el = await mount(h(VersionCompare, { versions, onFromChange }));
    await click(q(el, "button[aria-label='Compare from v1']"));
    expect(onFromChange).toHaveBeenCalledWith("v1");
    expect(q(el, ".fg-vcmp-title").textContent).toBe("v1v3");
    expect(q(el, ".fg-diff-stats").textContent).toBe("+2−0");
  });

  it("asks for two different versions, and restores an older one", async () => {
    const onRestore = vi.fn<(...args: any[]) => void>();
    const el = await mount(h(VersionCompare, { versions, onRestore, defaultFrom: "v3" }));
    expect(el.textContent).toContain("Pick two different versions.");
    expect(items(el, "button[aria-label^='Restore']")).toHaveLength(2);
    await click(q(el, "button[aria-label='Restore v1']"));
    expect(onRestore).toHaveBeenCalledWith("v1");
  });

  it("diffs the fields of a record", async () => {
    const records = [
      {
        id: "b",
        label: "v2",
        at: "Nov 18",
        by: "Ada",
        content: { name: "Acme SAS", city: "Lyon" },
      },
      { id: "a", label: "v1", at: "Nov 1", by: "Lin", content: { name: "Acme", city: "Lyon" } },
    ];
    const el = await mount(h(VersionCompare, { versions: records }));
    expect(el.querySelector(".fg-fdiff-table")).not.toBeNull();
    expect(el.textContent).toContain("Acme SAS");
  });
});
