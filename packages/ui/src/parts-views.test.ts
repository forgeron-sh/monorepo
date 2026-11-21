// @vitest-environment jsdom
import { createElement as h } from "react";
import { renderToStaticMarkup as html } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Board, BoardCard, BoardCards, BoardColumn, BoardColumnHeader, BoardEmpty } from "./board";
import {
  DiffBar,
  DiffFold,
  DiffHunk,
  DiffLine,
  DiffSplitLine,
  DiffTable,
  DiffView,
  FieldDiff,
  FieldDiffRow,
  FieldDiffTable,
  VersionCompare,
  VersionCompareItem,
  VersionCompareList,
  VersionCompareView,
  type CompareVersion,
} from "./diff";
import { structureDiffFields, structureDiffRows } from "./diff-model";
import {
  DetailList,
  DetailListItem,
  DetailListTerm,
  DetailListValue,
  ToolCard,
  ToolCardDescription,
  ToolCardFooter,
  ToolCardHeader,
  ToolCardHeading,
  ToolCardIcon,
  ToolCardLink,
  ToolCardMeta,
  ToolCardTitle,
} from "./tool-card";

describe("DiffView", () => {
  it("keeps the props form", () => {
    const out = html(h(DiffView, { before: "a\nb", after: "a\nc" }));
    expect(out).toContain("fg-diff-unified");
    expect(out).toContain("+1");
    expect(out).toContain('aria-label="Added"');
    expect(out).toContain("Changes from Before to After");
  });
  it("renders split from the props form", () => {
    const out = html(h(DiffView, { before: "a", after: "b", mode: "split" }));
    expect(out).toContain("fg-diff-split");
    expect(out).toContain('scope="colgroup"');
  });
  it("composes from its parts", () => {
    const rows = structureDiffRows("a\nb", "a\nc", { context: 3, collapse: true });
    const out = html(
      h(
        DiffView,
        { beforeLabel: "v1", afterLabel: "v2", className: "x" },
        h(DiffBar, { added: 1, removed: 1 }),
        h(
          DiffTable,
          null,
          h(
            DiffHunk,
            null,
            rows.map((r, i) =>
              r.kind === "fold"
                ? h(DiffFold, { key: i, count: r.count, onUnfold: () => {} })
                : h(DiffLine, { key: i, kind: r.kind, text: r.text }),
            ),
          ),
        ),
      ),
    );
    expect(out).toContain('data-slot="diff-view"');
    expect(out).toContain("fg-diff x");
    expect(out).toContain("Changes from v1 to v2");
    expect(out).toContain('data-slot="diff-line"');
    expect(out).toContain("fg-diff-add");
  });
  it("lays out a split line and a fold with the right spans", () => {
    const out = html(
      h(
        DiffView,
        { defaultMode: "split" },
        h(
          DiffTable,
          null,
          h(
            "tbody",
            null,
            h(DiffSplitLine, { left: { no: 1, text: "a", kind: "del" }, right: null }),
            h(DiffFold, { count: 4, onUnfold: () => {} }),
          ),
        ),
      ),
    );
    expect(out).toContain('aria-label="Removed"');
    expect(out).toContain("fg-diff-blank");
    expect(out).toContain('colSpan="6"');
    expect(out).toContain("4 unchanged lines");
  });
  it("keeps DiffHunk a tbody", () => {
    expect(html(h("table", null, h(DiffHunk)))).toContain("<tbody");
  });
});

describe("FieldDiff", () => {
  it("keeps the props form", () => {
    const out = html(
      h(FieldDiff, { before: { a: "1" }, after: { a: "2" }, labels: { a: "Name" } }),
    );
    expect(out).toContain("Name");
    expect(out).toContain("fg-fdiff-changed");
  });
  it("composes from its parts", () => {
    const [change] = structureDiffFields({ a: "1" }, { a: "2" });
    const out = html(
      h(
        FieldDiff,
        { className: "y" },
        h(FieldDiffTable, null, h(FieldDiffRow, { change: change!, label: "Alpha" })),
      ),
    );
    expect(out).toContain('data-slot="field-diff"');
    expect(out).toContain("Alpha");
    expect(out).toContain("(Changed)");
  });
});

describe("VersionCompare", () => {
  const versions: CompareVersion[] = [
    { id: "b", label: "v2", at: "today", by: "Léa", content: "x\ny" },
    { id: "a", label: "v1", at: "before", by: "Hugo", content: "x\nz" },
  ];
  it("keeps the props form", () => {
    const out = html(h(VersionCompare, { versions, onRestore: () => {} }));
    expect(out).toContain("Current version");
    expect(out).toContain('aria-label="Restore v1"');
    expect(out).toContain("fg-diff-unified");
  });
  it("composes from its parts", () => {
    const out = html(
      h(
        VersionCompare,
        { defaultFrom: "a", defaultTo: "b" },
        h(
          VersionCompareList,
          { versions },
          versions.map((v, i) =>
            h(VersionCompareItem, { key: v.id, version: v, current: i === 0 }),
          ),
        ),
        h(VersionCompareView, { versions }),
      ),
    );
    expect(out).toContain('data-slot="version-compare"');
    expect(out).toContain("fg-vcmp-picked");
    expect(out).toContain("fg-diff-unified");
  });
});

describe("ToolCard", () => {
  it("keeps the props form", () => {
    const out = html(
      h(ToolCard, { name: "Invoices", summary: "Syncs.", href: "/t", footer: "Open" }),
    );
    expect(out).toContain("fg-toolcard-link");
    expect(out).toContain('href="/t"');
    expect(out).toContain("In");
    expect(out).toContain("fg-toolcard-footer");
  });
  it("composes from its parts", () => {
    const out = html(
      h(
        ToolCard,
        { className: "z" },
        h(
          ToolCardHeader,
          null,
          h(ToolCardIcon, { name: "Contracts" }),
          h(
            ToolCardHeading,
            null,
            h(ToolCardTitle, null, h(ToolCardLink, { href: "/c" }, "Contracts")),
            h(ToolCardMeta, null, "1.0"),
          ),
        ),
        h(ToolCardDescription, null, "Does things."),
        h(ToolCardFooter, null, "Open"),
      ),
    );
    expect(out).toContain('data-slot="tool-card"');
    expect(out).toContain("fg-toolcard z");
    expect(out).toContain("fg-toolicon");
    expect(out).toContain("fg-toolcard-summary");
  });
  it("renders its child as the link with asChild", () => {
    const out = html(h(ToolCardLink, { href: "/c", asChild: true }, h("a", { id: "r" }, "Go")));
    expect(out).toContain('id="r"');
    expect(out).toContain("fg-toolcard-link");
  });
});

describe("DetailList", () => {
  it("keeps the props form", () => {
    const out = html(h(DetailList, { items: [{ label: "Owner", value: "Léa" }] }));
    expect(out).toContain("<dt");
    expect(out).toContain("fg-details-row");
    expect(out).toContain("Léa");
  });
  it("composes from its parts", () => {
    const out = html(
      h(
        DetailList,
        { className: "w" },
        h(DetailListItem, null, h(DetailListTerm, null, "Owner"), h(DetailListValue, null, "Léa")),
      ),
    );
    expect(out).toContain("fg-details w");
    expect(out).toContain('data-slot="detail-list-term"');
    expect(out).toContain('data-slot="detail-list-value"');
  });
});

describe("Board", () => {
  it("keeps the props form", () => {
    const out = html(
      h(Board<string>, {
        columns: [
          { id: 1, title: "Todo", items: ["a"] },
          { id: 2, title: "Done", items: [] },
        ],
        itemKey: (i: string) => i,
        renderItem: (i: string) => i,
      }),
    );
    expect(out).toContain("fg-board-card");
    expect(out).toContain("fg-board-count");
    expect(out).toContain("Empty");
  });
  it("composes from its parts", () => {
    const out = html(
      h(
        Board,
        { className: "b" },
        h(
          BoardColumn,
          null,
          h(BoardColumnHeader, { count: 1 }, "Todo"),
          h(BoardCards, null, h(BoardCard, null, "a")),
        ),
        h(BoardColumn, null, h(BoardColumnHeader, null, "Done"), h(BoardEmpty, null, "Nothing")),
      ),
    );
    expect(out).toContain("fg-board b");
    expect(out).toContain('data-slot="board-card"');
    expect(out).toContain("fg-board-empty");
  });
});
