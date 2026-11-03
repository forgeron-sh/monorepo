import { createElement as h } from "react";
import { renderToStaticMarkup as html } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BarChart, Board, Page, Select, Stat, Table } from "./index";
import type { TableColumn } from "./index";

describe("Page", () => {
  it("renders title, description, actions and content", () => {
    const out = html(
      h(Page, { title: "Tickets", description: "Open ones", actions: h("b", null, "New") }, "body"),
    );
    expect(out).toContain("<h1");
    expect(out).toContain("Tickets");
    expect(out).toContain("Open ones");
    expect(out).toContain("<b>New</b>");
    expect(out).toContain("body");
  });
});

describe("Table", () => {
  type Row = { id: number; name: string };
  const columns: TableColumn<Row>[] = [
    { key: "id", header: "Id", mono: true },
    { key: "name", header: "Name", render: (r) => r.name.toUpperCase() },
  ];
  it("renders headers and rows", () => {
    const out = html(h(Table<Row>, { columns, rows: [{ id: 1, name: "a" }], rowKey: (r) => r.id }));
    expect(out).toContain('scope="col"');
    expect(out).toContain('<td class="fg-mono">1</td>');
    expect(out).toContain(">A<");
  });
  it("shows the empty message", () => {
    const out = html(h(Table<Row>, { columns, rows: [], rowKey: () => 0, empty: "None" }));
    expect(out).toContain('colSpan="2"');
    expect(out).toContain("None");
  });
  it("makes rows focusable when clickable", () => {
    const out = html(
      h(Table<Row>, {
        columns,
        rows: [{ id: 1, name: "a" }],
        rowKey: (r) => r.id,
        onRowClick: () => {},
      }),
    );
    expect(out).toContain('tabindex="0"');
  });
});

describe("Board", () => {
  it("renders columns with counts and cards", () => {
    const out = html(
      h(Board<{ id: number; t: string }>, {
        columns: [
          { id: "a", title: "Todo", items: [{ id: 1, t: "one" }] },
          { id: "b", title: "Done", items: [] },
        ],
        itemKey: (i) => i.id,
        renderItem: (i) => i.t,
        empty: "Nothing",
      }),
    );
    expect(out).toContain("Todo");
    expect(out).toContain("one");
    expect(out).toContain("Nothing");
  });
});

describe("Stat", () => {
  it("renders label, value and hint", () => {
    const out = html(h(Stat, { label: "Runs", value: "42", hint: "7 days" }));
    expect(out).toContain("Runs");
    expect(out).toContain("42");
    expect(out).toContain("7 days");
  });
});

describe("BarChart", () => {
  it("scales bars to the largest value", () => {
    const out = html(
      h(BarChart, {
        title: "Calls",
        data: [
          { label: "a", value: 10 },
          { label: "b", value: 5 },
        ],
      }),
    );
    expect(out).toContain("width:100%");
    expect(out).toContain("width:50%");
  });
  it("does not divide by zero", () => {
    const out = html(h(BarChart, { title: "x", data: [{ label: "a", value: 0 }] }));
    expect(out).toContain("width:0%");
  });
});

describe("Select", () => {
  it("renders options and a disabled placeholder", () => {
    const out = html(
      h(Select, {
        placeholder: "Pick",
        options: [{ value: "x", label: "X" }],
      }),
    );
    expect(out).toContain('<option value="" disabled="" selected="">Pick</option>');
    expect(out).toContain('<option value="x">X</option>');
  });
});
