// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup as html } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addParticipant,
  addPoint,
  ApprovalAudit,
  ApprovalChain,
  boxAt,
  chainProgress,
  chainStatus,
  clampPage,
  clampZoom,
  dataUrlToBlob,
  DocumentViewer,
  FieldPlacer,
  fitScale,
  formatStamp,
  hashPrefix,
  isOverdue,
  moveById,
  moveItem,
  nudgeField,
  ParticipantList,
  participantsWithoutField,
  removeParticipant,
  resizeField,
  resolveChain,
  SealBadge,
  SignaturePad,
  smoothStroke,
  stepStatus,
  stepZoom,
  strokesBounds,
  strokesPath,
  strokesSvgDataUrl,
  type ApprovalParticipant,
  type ApprovalStep,
  type DocumentPage,
  type PlacedField,
} from "../index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | undefined;
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});
afterEach(() => {
  host?.remove();
  host = undefined;
  vi.restoreAllMocks();
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
const click = async (el: Element) =>
  act(async () => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

const p = (id: string, status?: ApprovalParticipant["status"]): ApprovalParticipant => ({
  id,
  name: id.toUpperCase(),
  ...(status ? { status } : {}),
});
const people = [p("a"), p("b"), p("c")];
const pages: DocumentPage[] = [1, 2, 3].map((n) => ({
  id: `p${n}`,
  src: `data:image/gif;base64,R0lGODlhAQABAAAAACw=#${n}`,
  width: 600,
  height: 800,
}));

describe("chain model", () => {
  it("resolves a sequential step one person at a time", () => {
    const [step] = resolveChain([{ id: "s", participants: people }]);
    expect(step!.participants.map((x) => x.status)).toEqual(["current", "waiting", "waiting"]);
  });

  it("resolves a parallel step all at once, and keeps given statuses", () => {
    const [step] = resolveChain([
      { id: "s", mode: "parallel", participants: [p("a", "approved"), p("b"), p("c")] },
    ]);
    expect(step!.participants.map((x) => x.status)).toEqual(["approved", "current", "current"]);
  });

  it("makes later steps wait, and a rejection stops the chain", () => {
    const steps: ApprovalStep[] = [
      { id: "1", participants: [p("a", "approved")] },
      { id: "2", participants: [p("b", "rejected")] },
      { id: "3", participants: [p("c")] },
    ];
    const resolved = resolveChain(steps);
    expect(resolved.map(stepStatus)).toEqual(["approved", "rejected", "waiting"]);
    expect(chainStatus(steps)).toBe("rejected");
    expect(chainProgress(steps)).toEqual({ done: 1, total: 3 });
    expect(chainStatus([{ id: "1", participants: [p("a", "approved"), p("b", "skipped")] }])).toBe(
      "approved",
    );
    expect(chainStatus([{ id: "1", participants: people }])).toBe("current");
  });

  it("finds a late step", () => {
    expect(isOverdue("2026-11-01", "2026-11-19", "current")).toBe(true);
    expect(isOverdue("2026-11-01", "2026-11-19", "approved")).toBe(false);
    expect(isOverdue(undefined, "2026-11-19", "current")).toBe(false);
  });

  it("edits a chain without duplicating a person", () => {
    const steps: ApprovalStep[] = [{ id: "1", participants: [p("a")] }];
    expect(addParticipant(steps, "1", p("a"))[0]!.participants).toHaveLength(1);
    expect(addParticipant(steps, "1", p("b"))[0]!.participants.map((x) => x.id)).toEqual([
      "a",
      "b",
    ]);
    expect(removeParticipant(steps, "a")[0]!.participants).toEqual([]);
    expect(moveItem([1, 2, 3], 0, 2)).toEqual([2, 3, 1]);
    expect(moveItem([1, 2, 3], 0, 5)).toEqual([1, 2, 3]);
    expect(moveById(people, "c", -1).map((x) => x.id)).toEqual(["a", "c", "b"]);
  });

  it("writes stamps and hashes", () => {
    expect(formatStamp("2026-11-19T14:32:10Z")).toBe("2026-11-19 14:32 UTC");
    expect(formatStamp("2026-11-19")).toBe("2026-11-19");
    expect(hashPrefix("A3F91C07ffee", 8)).toBe("A3F9 1C07");
  });
});

describe("field model", () => {
  it("keeps boxes on the page", () => {
    const b = boxAt("signature", 0.99, 0.99);
    expect(b.x + b.w).toBeLessThanOrEqual(1);
    expect(b.y + b.h).toBeLessThanOrEqual(1);
    const f = {
      id: "f",
      type: "text",
      page: 1,
      participantId: "a",
      ...boxAt("text", 0.5, 0.5),
    } as const;
    expect(nudgeField(f, -2, 0).x).toBe(0);
    expect(resizeField(f, -1, -1).w).toBeGreaterThanOrEqual(0.02);
  });

  it("names the people without a signature box", () => {
    const fields: PlacedField[] = [
      { id: "f", type: "signature", page: 1, x: 0, y: 0, w: 0.2, h: 0.1, participantId: "a" },
    ];
    expect(participantsWithoutField(fields, people).map((x) => x.id)).toEqual(["b", "c"]);
  });
});

describe("signature model", () => {
  it("drops points that are too close and smooths the rest", () => {
    const s = addPoint(addPoint([{ x: 0, y: 0 }], { x: 0.5, y: 0 }), { x: 10, y: 0 });
    expect(s).toHaveLength(2);
    expect(
      smoothStroke([
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 20, y: 10 },
        { x: 30, y: 10 },
      ]),
    ).toEqual([
      { cx: 10, cy: 0, x: 15, y: 5 },
      { cx: 20, cy: 10, x: 25, y: 10 },
    ]);
    const strokes = [
      [
        { x: 2, y: 4 },
        { x: 12, y: 24 },
      ],
    ];
    expect(strokesBounds(strokes)).toEqual({ x: 2, y: 4, w: 10, h: 20 });
    expect(strokesPath(strokes)).toBe("M2 4L12 24");
    expect(strokesBounds([])).toBeNull();
  });

  it("makes an image that becomes a blob", () => {
    const url = strokesSvgDataUrl(
      [
        [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
        ],
      ],
      "#000",
    );
    expect(url.startsWith("data:image/svg+xml")).toBe(true);
    expect(dataUrlToBlob(url).type).toBe("image/svg+xml");
    expect(dataUrlToBlob("data:image/png;base64,AAEC").size).toBe(3);
  });
});

describe("viewer model", () => {
  it("clamps and steps the zoom", () => {
    expect(clampZoom(10)).toBe(50);
    expect(clampZoom(999)).toBe(300);
    expect(stepZoom(100, 1)).toBe(125);
    expect(stepZoom(100, -1)).toBe(75);
    expect(stepZoom(300, 1)).toBe(300);
    expect(fitScale(664, 600)).toBe(1);
    expect(clampPage(9, 3)).toBe(3);
    expect(clampPage(0, 3)).toBe(1);
  });
});

describe("ParticipantList", () => {
  it("reads as a named list with statuses", () => {
    const out = html(
      h(ParticipantList, {
        label: "Signers",
        value: [{ ...p("a", "approved"), role: "Manager" }, p("b", "current")],
      }),
    );
    expect(out).toContain('aria-label="Signers"');
    expect(out).toContain("Manager");
    expect(out).toContain("Approved");
    expect(out).not.toContain('draggable="true"');
  });

  it("reorders with Alt and the arrows, and says so", async () => {
    const onChange = vi.fn<(value: any) => void>();
    const root = await mount(
      h(ParticipantList, { label: "Signers", defaultValue: people, editable: true, onChange }),
    );
    const rows = () => [...root.querySelectorAll<HTMLElement>("li[data-pid]")];
    await act(async () => rows()[0]!.focus());
    await key(rows()[0]!, "ArrowDown", { altKey: true });
    expect(onChange.mock.calls[0]![0].map((x: ApprovalParticipant) => x.id)).toEqual([
      "b",
      "a",
      "c",
    ]);
    expect(rows().map((r) => r.dataset.pid)).toEqual(["b", "a", "c"]);
    expect(root.querySelector("[role=status]")!.textContent).toContain("position 2 of 3");
    expect(document.activeElement).toBe(rows()[1]);
  });

  it("removes with Delete", async () => {
    const root = await mount(
      h(ParticipantList, { label: "Signers", defaultValue: people, editable: true }),
    );
    const first = root.querySelector<HTMLElement>("li[data-pid]")!;
    await key(first, "Delete");
    expect(root.querySelectorAll("li[data-pid]")).toHaveLength(2);
  });
});

describe("ApprovalChain", () => {
  const steps: ApprovalStep[] = [
    {
      id: "1",
      label: "Manager",
      participants: [p("a", "approved")],
      due: "2026-11-01",
      comments: [{ id: "c", author: "Léa", at: "2026-11-02T10:00:00Z", text: "Looks fine" }],
    },
    { id: "2", label: "Finance", mode: "parallel", participants: [p("b"), p("c")] },
  ];

  it("shows each step, its status, the late mark and the comments", () => {
    const out = html(
      h(ApprovalChain, {
        label: "Expense 214",
        value: steps,
        today: "2026-11-19",
        onRemind: () => {},
      }),
    );
    expect(out).toContain("Manager");
    expect(out).toContain("Finance");
    expect(out).toContain("To act");
    expect(out).toContain("Looks fine");
    expect(out).toContain('aria-current="step"');
    expect(out).toContain("All at once");
  });

  it("adds a step and switches a step to parallel when editable", async () => {
    const onChange = vi.fn<(value: any) => void>();
    const root = await mount(
      h(ApprovalChain, {
        label: "Chain",
        defaultValue: [{ id: "1", participants: [p("a"), p("b")] }],
        editable: true,
        onChange,
      }),
    );
    const parallel = [...root.querySelectorAll("button")].find(
      (b) => b.textContent === "All at once",
    )!;
    await click(parallel);
    expect(onChange.mock.calls.at(-1)![0][0].mode).toBe("parallel");
    const add = [...root.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("Add step"),
    )!;
    await click(add);
    expect(onChange.mock.calls.at(-1)![0]).toHaveLength(2);
  });

  it("does not freeze the statuses it found when people are reordered", async () => {
    const onChange = vi.fn<(value: any) => void>();
    const root = await mount(
      h(ApprovalChain, {
        label: "Chain",
        defaultValue: [{ id: "1", participants: people }],
        editable: true,
        onChange,
      }),
    );
    const first = root.querySelector<HTMLElement>("li[data-pid]")!;
    await key(first, "ArrowDown", { altKey: true });
    const out = onChange.mock.calls[0]![0][0].participants as ApprovalParticipant[];
    expect(out.map((x) => x.id)).toEqual(["b", "a", "c"]);
    expect(out.every((x) => x.status === undefined)).toBe(true);
  });

  it("lists the audit, newest first", () => {
    const out = html(
      h(ApprovalAudit, {
        events: [
          { id: "1", at: "2026-11-01T09:00:00Z", actor: "Léa", action: "approved" },
          { id: "2", at: "2026-11-02T09:00:00Z", actor: "Karim", action: "rejected" },
        ],
      }),
    );
    expect(out.indexOf("Karim")).toBeLessThan(out.indexOf("Léa"));
  });
});

describe("SealBadge", () => {
  it("states who, when, how and the hash prefix", () => {
    const out = html(
      h(SealBadge, {
        action: "Signed",
        who: "Léa Martin",
        at: "2026-11-19T14:32:10Z",
        method: "Email code",
        hash: "a3f91c07deadbeef",
      }),
    );
    expect(out).toContain("Signed by Léa Martin, 2026-11-19 14:32 UTC, Verified");
    expect(out).toContain("a3f9 1c07");
    expect(out).toContain("Email code");
    expect(
      html(h(SealBadge, { who: "X", at: "2026-11-19", state: "revoked", compact: true })),
    ).toContain("Revoked");
  });
});

describe("SignaturePad", () => {
  it("types a name into an image and clears it", async () => {
    const onChange = vi.fn<(value: any) => void>();
    const root = await mount(h(SignaturePad, { onChange, defaultMode: "type" }));
    const input = root.querySelector<HTMLInputElement>("input[type=text], input:not([type])")!;
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
      setter.call(input, "Léa Martin");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const value = onChange.mock.calls.at(-1)![0];
    expect(value.method).toBe("type");
    expect(value.text).toBe("Léa Martin");
    expect(value.dataUrl.startsWith("data:image/")).toBe(true);
    expect(root.querySelectorAll("[role=radio]").length).toBeGreaterThan(1);
  });

  it("offers the three ways and a pen for the keyboard", async () => {
    const root = await mount(h(SignaturePad, {}));
    expect([...root.querySelectorAll("button[aria-pressed]")].map((b) => b.textContent)).toEqual([
      "Draw",
      "Type",
      "Upload",
    ]);
    const canvas = root.querySelector("canvas")!;
    expect(canvas.getAttribute("tabindex")).toBe("0");
    await key(canvas, " ");
    await key(canvas, "ArrowRight");
    await key(canvas, "ArrowDown");
    await key(canvas, " ");
    expect(root.querySelector("[role=status]")!.textContent).toContain("Pen lifted");
    const undo = [...root.querySelectorAll("button")].find((b) => b.textContent === "Undo")!;
    expect(undo.disabled).toBe(false);
  });
});

describe("DocumentViewer", () => {
  it("changes page with the buttons and the keys, and zooms", async () => {
    const onPage = vi.fn<(value: any) => void>();
    const onZoom = vi.fn<(value: any) => void>();
    const root = await mount(
      h(DocumentViewer, { label: "Contract", pages, onPageChange: onPage, onZoomChange: onZoom }),
    );
    expect(root.querySelectorAll("[data-page]")).toHaveLength(3);
    expect(root.querySelectorAll(".fg-doc-thumb")).toHaveLength(3);
    const next = root.querySelector<HTMLElement>("[aria-label='Next page']")!;
    await click(next);
    expect(onPage).toHaveBeenLastCalledWith(2);
    const scroller = root.querySelector<HTMLElement>(".fg-doc-scroll")!;
    await key(scroller, "End");
    expect(onPage).toHaveBeenLastCalledWith(3);
    await key(scroller, "+");
    expect(onZoom).toHaveBeenLastCalledWith(125);
    await key(scroller, "0");
    expect(root.querySelector<HTMLSelectElement>("select")!.value).toBe("fit");
  });

  it("draws an overlay on each page and searches through the callback", async () => {
    const onSearch = vi.fn<(q: string) => Promise<{ page: number }[]>>(async () => [
      { page: 2 },
      { page: 3 },
    ]);
    const onPage = vi.fn<(value: any) => void>();
    const root = await mount(
      h(DocumentViewer, {
        label: "Contract",
        pages,
        thumbnails: false,
        onSearch,
        onPageChange: onPage,
        overlay: (i) => h("i", { className: "mark" }, `p${i.number}`),
      }),
    );
    expect([...root.querySelectorAll(".mark")].map((m) => m.textContent)).toEqual([
      "p1",
      "p2",
      "p3",
    ]);
    expect(root.querySelector(".fg-doc-thumbs")).toBeNull();
    const input = root.querySelector<HTMLInputElement>(
      "input[type=text], .fg-doc-search input:not(.x)",
    )!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
        input,
        "term",
      );
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => {
      root
        .querySelector("form")!
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    expect(onSearch).toHaveBeenCalledWith("term");
    expect(onPage).toHaveBeenLastCalledWith(2);
    expect(root.querySelector(".fg-doc-hits")!.textContent).toBe("1 of 2");
  });
});

describe("FieldPlacer", () => {
  const field: PlacedField = {
    id: "f1",
    type: "signature",
    page: 1,
    x: 0.2,
    y: 0.2,
    w: 0.28,
    h: 0.06,
    participantId: "a",
  };

  it("places a box on the page in view from the keyboard-reachable button", async () => {
    const onChange = vi.fn<(value: any) => void>();
    const root = await mount(
      h(FieldPlacer, {
        label: "Fields",
        pages,
        participants: people,
        onChange,
        viewer: { height: 300 },
      }),
    );
    const place = [...root.querySelectorAll("button")].find((b) =>
      b.textContent?.startsWith("Place on page"),
    )!;
    await click(place);
    const added = onChange.mock.calls[0]![0] as PlacedField[];
    expect(added).toHaveLength(1);
    expect(added[0]).toMatchObject({ type: "signature", page: 1, participantId: "a" });
    expect(root.querySelector("[role=status]:last-of-type")).not.toBeNull();
  });

  it("nudges, resizes and deletes a focused box with the keys", async () => {
    const onChange = vi.fn<(value: any) => void>();
    const root = await mount(
      h(FieldPlacer, {
        label: "Fields",
        pages,
        participants: people,
        defaultValue: [field],
        onChange,
      }),
    );
    const box = root.querySelector<HTMLElement>(".fg-fp-box")!;
    expect(box.getAttribute("aria-label")).toContain("Signature for A");
    await key(box, "ArrowRight");
    expect((onChange.mock.calls.at(-1)![0] as PlacedField[])[0]!.x).toBeCloseTo(0.205);
    await key(box, "ArrowDown", { shiftKey: true });
    expect((onChange.mock.calls.at(-1)![0] as PlacedField[])[0]!.y).toBeCloseTo(0.22);
    await key(box, "ArrowRight", { altKey: true });
    expect((onChange.mock.calls.at(-1)![0] as PlacedField[])[0]!.w).toBeCloseTo(0.285);
    await key(box, "Delete");
    expect(onChange.mock.calls.at(-1)![0]).toEqual([]);
    expect(root.querySelector(".fg-fp-box")).toBeNull();
  });

  it("reassigns a box from the list and lists it", async () => {
    const onChange = vi.fn<(value: any) => void>();
    const root = await mount(
      h(FieldPlacer, {
        label: "Fields",
        pages,
        participants: people,
        defaultValue: [field],
        onChange,
      }),
    );
    expect(root.querySelector(".fg-fp-list")!.textContent).toContain("A · p. 1");
    const select = root.querySelector<HTMLSelectElement>(".fg-fp-item select")!;
    await act(async () => {
      select.value = "b";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect((onChange.mock.calls.at(-1)![0] as PlacedField[])[0]!.participantId).toBe("b");
  });

  it("only looks when read-only", async () => {
    const root = await mount(
      h(FieldPlacer, {
        label: "Fields",
        pages,
        participants: people,
        defaultValue: [field],
        readOnly: true,
      }),
    );
    expect(root.querySelector(".fg-fp-types")).toBeNull();
    await key(root.querySelector<HTMLElement>(".fg-fp-box")!, "Delete");
    expect(root.querySelector(".fg-fp-box")).not.toBeNull();
  });
});
