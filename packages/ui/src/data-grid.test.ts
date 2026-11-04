import { createElement as h } from "react";
import { renderToStaticMarkup as html } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConstraintChip, DataGrid, Drawer, Pager, cellText } from "./index";
import type { GridColumn } from "./index";

const columns: GridColumn[] = [
  {
    name: "id",
    type: "TEXT",
    chips: [{ kind: "primary" }, { kind: "notNull" }],
  },
  { name: "company_id", type: "TEXT", chips: [{ kind: "foreignKey", title: "companies.id" }] },
  { name: "visits", type: "INTEGER", numeric: true },
  { name: "email", type: "TEXT", masked: "The name suggests personal data" },
];
const rows = [
  ["k1", "c1", 7, { masked: "The name suggests personal data" }],
  ["k2", null, 0, { masked: "x" }],
];

describe("ConstraintChip", () => {
  it("says the constraint in words", () => {
    expect(html(h(ConstraintChip, { kind: "foreignKey", title: "companies.id" }))).toContain(
      "Foreign key",
    );
    expect(html(h(ConstraintChip, { kind: "notNull" }))).toContain("Not null");
    expect(html(h(ConstraintChip, { kind: "primary" }))).toContain("fg-chip-primary");
  });
});

describe("DataGrid", () => {
  const grid = (props = {}) =>
    html(h(DataGrid, { label: "Rows of contacts", columns, rows: rows as never, ...props }));

  it("renders typed headers with their chips, and a name for the region", () => {
    const out = grid();
    expect(out).toContain('aria-label="Rows of contacts"');
    expect(out).toContain("INTEGER");
    expect(out).toContain("Primary");
    expect(out).toContain("Not null");
    expect(out).toContain("Foreign key");
  });

  it("shows NULL and masked cells for what they are, never a value", () => {
    const out = grid();
    expect(out).toContain('class="fg-cell-null">NULL');
    expect(out).toContain('title="The name suggests personal data"');
    expect(out).toContain(">masked<");
  });

  it("makes headers sortable buttons, except a masked column's, and tells the direction", () => {
    const out = grid({ onSort: () => {}, sort: { column: "visits", descending: true } });
    expect(out).toContain('aria-sort="descending"');
    expect(out.match(/<button/g)).toHaveLength(3);
  });

  it("makes rows focusable when they open", () => {
    expect(grid({ onOpenRow: () => {} })).toContain('tabindex="0"');
  });

  it("shows the empty message", () => {
    expect(html(h(DataGrid, { label: "x", columns, rows: [], empty: "Nothing here" }))).toContain(
      "Nothing here",
    );
  });

  it("copies the text of a cell, empty for NULL and masked", () => {
    expect(cellText(7)).toBe("7");
    expect(cellText(null)).toBe("");
    expect(cellText({ masked: "x" })).toBe("");
  });
});

describe("Pager", () => {
  const pager = (props = {}) =>
    html(
      h(Pager, {
        page: 2,
        pageSize: 50,
        count: 50,
        total: 120,
        hasMore: true,
        onPage: () => {},
        ...props,
      }),
    );
  it("says where the page sits", () => {
    expect(pager()).toContain("51–100 of 120");
  });
  it("disables what leads nowhere", () => {
    expect(pager({ page: 1, hasMore: false })).toMatch(
      /disabled=""[^>]*>Previous[\s\S]*disabled=""[^>]*>Next/,
    );
  });
});

describe("Drawer", () => {
  it("is named by its title and has a close button", () => {
    const out = html(h(Drawer, { title: "Row k1", onClose: () => {} }, "body"));
    expect(out).toContain("Row k1");
    expect(out).toContain("Close");
    expect(out).toContain("aria-labelledby=");
  });
});
