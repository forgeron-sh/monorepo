// @vitest-environment jsdom
import { act, createElement as h, useState } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup as html } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  FieldEditor,
  FieldTypePicker,
  ImportWizard,
  RecordForm,
  RecordGrid,
  SchemaFields,
  TableList,
  checkRows,
  fieldNameError,
  formatValue,
  guessMapping,
  mappingProblems,
  parseCsv,
  parseValue,
  toFieldName,
  validateRecord,
  validateValue,
  type CellValue,
  type DataField,
  type DataRecord,
  type RecordGridSort,
} from "../index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | undefined;
let reactRoot: ReturnType<typeof createRoot> | undefined;
afterEach(async () => {
  await act(async () => reactRoot?.unmount());
  reactRoot = undefined;
  host?.remove();
  host = undefined;
  document.body.innerHTML = "";
});
const mount = async (element: Parameters<ReturnType<typeof createRoot>["render"]>[0]) => {
  host = document.createElement("div");
  document.body.append(host);
  reactRoot = createRoot(host);
  await act(async () => reactRoot!.render(element));
  return host;
};
const settle = () => act(async () => new Promise((r) => setTimeout(r, 30)));
const key = async (el: Element, k: string, more: KeyboardEventInit = {}) =>
  act(async () => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, ...more }));
  });
const type = async (input: HTMLInputElement | HTMLTextAreaElement, value: string) =>
  act(async () => {
    const proto = Object.getPrototypeOf(input) as object;
    Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
const click = (el: Element) => act(async () => (el as HTMLElement).click());

const fields: DataField[] = [
  { id: "id", name: "id", type: "number", primary: true, decimals: 0 },
  { id: "name", name: "name", type: "text", required: true },
  { id: "price", name: "price", type: "number", decimals: 2 },
  { id: "active", name: "active", type: "boolean" },
  {
    id: "stage",
    name: "stage",
    type: "select",
    choices: [
      { value: "lead", label: "Lead" },
      { value: "won", label: "Won" },
    ],
  },
  { id: "company", name: "company_id", type: "relation", relation: { table: "companies" } },
];
const relations = {
  companies: [
    { id: "c1", label: "Fromagerie Roy" },
    { id: "c2", label: "Garnier Transports" },
  ],
};
const records: DataRecord[] = [
  {
    id: "1",
    values: { id: 1, name: "Brie", price: 12.5, active: true, stage: "won", company: ["c1"] },
  },
  {
    id: "2",
    values: { id: 2, name: "Comté", price: null, active: false, stage: null, company: null },
  },
];

describe("the model", () => {
  it("reads CSV with quotes, doubled quotes, line breaks and semicolons", () => {
    expect(parseCsv('a,b\n"x, y","say ""hi"""\n\n1,2\n')).toEqual([
      ["a", "b"],
      ["x, y", 'say "hi"'],
      ["1", "2"],
    ]);
    expect(parseCsv("a;b\r\n1;2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
    expect(parseCsv('note\n"two\nlines"')).toEqual([["note"], ["two\nlines"]]);
  });
  it("parses typed text, labels and lists", () => {
    const price = fields[2]!;
    expect(parseValue(price, "12,5")).toEqual({ value: 12.5 });
    expect(parseValue(price, "abc")).toEqual({ error: "Expected a number" });
    expect(parseValue(fields[3]!, "yes")).toEqual({ value: true });
    expect(parseValue(fields[4]!, "won")).toEqual({ value: "won" });
    expect(parseValue(fields[4]!, "Lead")).toEqual({ value: "lead" });
    expect(parseValue(fields[4]!, "Lost")).toEqual({ error: "Not a choice: Lost" });
    expect(parseValue(fields[5]!, "Garnier Transports", relations)).toEqual({ value: ["c2"] });
    expect(parseValue(fields[1]!, " ")).toEqual({ error: "Required" });
  });
  it("checks values by type", () => {
    expect(validateValue({ id: "d", name: "d", type: "date" }, "2026-02-30")).toMatch(/date/);
    expect(validateValue({ id: "d", name: "d", type: "date" }, "2026-02-28")).toBeNull();
    expect(validateValue({ id: "e", name: "e", type: "email" }, "a@b.fr")).toBeNull();
    expect(validateValue({ id: "u", name: "u", type: "url" }, "javascript:alert(1)")).toMatch(
      /http/,
    );
    expect(validateValue({ id: "j", name: "j", type: "json" }, "{")).toBe("Not valid JSON");
    expect(validateRecord(fields, { name: null, price: "1x" })).toEqual({
      name: "Required",
      price: "Expected a number",
    });
  });
  it("formats, names and maps", () => {
    expect(formatValue(fields[2]!, 3)).toBe("3.00");
    expect(formatValue(fields[5]!, ["c1"], relations)).toBe("Fromagerie Roy");
    expect(toFieldName("Due date (été)")).toBe("due_date_ete");
    expect(fieldNameError("Bad Name")).toMatch(/Lower case/);
    expect(fieldNameError("name", ["name"])).toBe("name exists already");
    expect(guessMapping(["Name", "PRICE", "notes"], fields)).toEqual(["name", "price", null]);
    expect(mappingProblems(fields, [null, "price"])).toEqual([
      "name is required: pick the column that fills it",
    ]);
    const checked = checkRows([["Brie", "x"]], ["name", "price"], fields);
    expect(checked[0]!.errors).toEqual({ price: "Expected a number" });
  });
});

describe("FieldTypePicker", () => {
  it("names its control and shows the type", () => {
    const out = html(h(FieldTypePicker, { value: "relation" }));
    expect(out).toContain("Relation");
    expect(out).toContain("Type");
  });
});

/** The grid with its records in state, as a caller keeps them. */
function Sheet({ onChange }: { onChange: (r: string, f: string, v: CellValue) => void }) {
  const [rows, setRows] = useState(records);
  return h(RecordGrid, {
    label: "products",
    fields,
    records: rows,
    relations,
    selectable: true,
    onChange: (r: string, f: string, v: CellValue) => {
      onChange(r, f, v);
      setRows((all) =>
        all.map((x) => (x.id === r ? { ...x, values: { ...x.values, [f]: v } } : x)),
      );
    },
  });
}
const activeCell = () => document.activeElement as HTMLElement;

describe("RecordGrid", () => {
  it("draws typed headers and cells, one cell in the tab order", () => {
    const out = html(h(RecordGrid, { label: "products", fields, records, relations }));
    expect(out).toContain('role="grid"');
    expect(out).toContain("company_id");
    expect(out).toContain("12.50");
    expect(out).toContain("Fromagerie Roy");
    expect(out).toContain('aria-readonly="true"');
    expect(out.match(/tabindex="0"/g)).toHaveLength(1);
  });
  it("moves with the arrows, Tab and Home", async () => {
    const root = await mount(h(Sheet, { onChange: () => {} }));
    const first = root.querySelector<HTMLElement>('td[data-active="true"]')!;
    first.focus();
    await key(first, "ArrowRight");
    expect(activeCell().textContent).toBe("Brie");
    await key(activeCell(), "ArrowDown");
    expect(activeCell().textContent).toBe("Comté");
    await key(activeCell(), "Tab");
    expect(activeCell().getAttribute("aria-colindex")).toBe("3");
    await key(activeCell(), "Home");
    expect(activeCell().getAttribute("aria-colindex")).toBe("1");
  });
  it("edits with Enter, commits with Enter and moves down; Escape cancels", async () => {
    const onChange = vi.fn<(r: string, f: string, v: CellValue) => void>();
    const root = await mount(h(Sheet, { onChange }));
    root.querySelector<HTMLElement>('td[data-active="true"]')!.focus();
    await key(activeCell(), "ArrowRight");
    await key(activeCell(), "Enter");
    const input = root.querySelector<HTMLInputElement>(".fg-dh-cellinput")!;
    expect(input.value).toBe("Brie");
    await type(input, "Brie de Meaux");
    await key(input, "Enter");
    expect(onChange).toHaveBeenCalledWith("1", "name", "Brie de Meaux");
    expect(root.querySelector(".fg-dh-edited")?.textContent).toBe("Brie de Meaux");
    expect(activeCell().textContent).toBe("Comté");
    await key(activeCell(), "x");
    const again = root.querySelector<HTMLInputElement>(".fg-dh-cellinput")!;
    expect(again.value).toBe("x");
    await key(again, "Escape");
    expect(root.querySelector(".fg-dh-cellinput")).toBeNull();
    expect(activeCell().textContent).toBe("Comté");
    expect(onChange).toHaveBeenCalledTimes(1);
  });
  it("keeps a wrong value in the editor with its problem", async () => {
    const onChange = vi.fn<(r: string, f: string, v: CellValue) => void>();
    const root = await mount(h(Sheet, { onChange }));
    root.querySelector<HTMLElement>('td[data-active="true"]')!.focus();
    await key(activeCell(), "End");
    await key(activeCell(), "ArrowLeft");
    await key(activeCell(), "ArrowLeft");
    await key(activeCell(), "ArrowLeft");
    await key(activeCell(), "1");
    const input = root.querySelector<HTMLInputElement>(".fg-dh-cellinput")!;
    await type(input, "1x");
    await key(input, "Tab");
    expect(root.querySelector('[role="alert"]')?.textContent).toBe("Expected a number");
    expect(onChange).not.toHaveBeenCalled();
    await type(input, "9");
    await key(input, "Tab");
    expect(onChange).toHaveBeenCalledWith("1", "price", 9);
  });
  it("toggles a checkbox with Space, clears with Delete, refuses the primary key", async () => {
    const onChange = vi.fn<(r: string, f: string, v: CellValue) => void>();
    const root = await mount(h(Sheet, { onChange }));
    root.querySelector<HTMLElement>('td[data-active="true"]')!.focus();
    await key(activeCell(), "Enter");
    expect(root.querySelector(".fg-dh-cellinput")).toBeNull();
    expect(root.querySelector('[aria-live="polite"]')?.textContent).toBe("id is the primary key");
    await key(activeCell(), "ArrowRight");
    await key(activeCell(), "ArrowRight");
    await key(activeCell(), "ArrowRight");
    await key(activeCell(), " ");
    expect(onChange).toHaveBeenLastCalledWith("1", "active", false);
    await key(activeCell(), "ArrowLeft");
    await key(activeCell(), "Delete");
    expect(onChange).toHaveBeenLastCalledWith("1", "price", null);
    await key(activeCell(), "ArrowLeft");
    await key(activeCell(), "Delete");
    expect(root.querySelector('[aria-live="polite"]')?.textContent).toBe("name is required");
  });
  it("selects rows from the header and with Shift+Space", async () => {
    const onSelectionChange = vi.fn<(ids: string[]) => void>();
    const root = await mount(
      h(RecordGrid, { label: "p", fields, records, selectable: true, onSelectionChange }),
    );
    root.querySelector<HTMLElement>('td[data-active="true"]')!.focus();
    await key(activeCell(), " ", { shiftKey: true });
    expect(onSelectionChange).toHaveBeenLastCalledWith(["1"]);
    await click(root.querySelector('th input[type="checkbox"]')!);
    expect(onSelectionChange).toHaveBeenLastCalledWith(["1", "2"]);
  });
  it("opens a record with Shift+Enter and sorts from a header", async () => {
    const onOpenRecord = vi.fn<(id: string) => void>();
    const onSortChange = vi.fn<(sort: RecordGridSort | null) => void>();
    const root = await mount(
      h(RecordGrid, { label: "p", fields, records, onOpenRecord, onSortChange, sort: null }),
    );
    root.querySelector<HTMLElement>('td[data-active="true"]')!.focus();
    await key(activeCell(), "Enter", { shiftKey: true });
    expect(onOpenRecord).toHaveBeenCalledWith("1");
    await click(root.querySelector('button[title="Sort by price"]')!);
    expect(onSortChange).toHaveBeenCalledWith({ field: "price", direction: "asc" });
  });
});

describe("RecordForm", () => {
  it("shows the problems on submit and saves once valid", async () => {
    const onSubmit = vi.fn<(values: Record<string, CellValue>) => void>();
    const root = await mount(
      h(RecordForm, { fields: fields.slice(0, 3), onSubmit, defaultValue: { id: 3 } }),
    );
    await act(async () =>
      root
        .querySelector("form")!
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
    );
    expect(root.textContent).toContain("Required");
    expect(onSubmit).not.toHaveBeenCalled();
    const name = root.querySelectorAll<HTMLInputElement>("input")[1]!;
    await type(name, "Tomme");
    await key(name, "Enter", { metaKey: true });
    expect(onSubmit).toHaveBeenCalledWith({ id: 3, name: "Tomme", price: null });
  });
  it("keeps the primary key read only when editing", () => {
    const out = html(h(RecordForm, { fields, mode: "edit", value: records[0]!.values, relations }));
    expect(out).toMatch(/<output[^>]*>1<\/output>/);
  });
});

describe("FieldEditor", () => {
  it("refuses a bad name and empty choices, then saves", async () => {
    const onSubmit = vi.fn<(field: DataField) => void>();
    const root = await mount(
      h(FieldEditor, {
        defaultValue: { id: "f", name: "Stage", type: "select", choices: [] },
        takenNames: ["name"],
        onSubmit,
      }),
    );
    const form = root.querySelector("form")!;
    const submit = () =>
      act(async () => form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    await submit();
    expect(root.textContent).toContain("Lower case letters");
    expect(root.textContent).toContain("Add at least one choice");
    await type(root.querySelector<HTMLInputElement>("input")!, "stage");
    await click(
      [...root.querySelectorAll("button")].find((b) => b.textContent === "Add a choice")!,
    );
    const choice = root.querySelector<HTMLInputElement>('input[aria-label="Choice 1"]')!;
    expect(document.activeElement).toBe(choice);
    await type(choice, "Lead");
    await submit();
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "stage",
        choices: [expect.objectContaining({ value: "Lead", label: "Lead" })],
      }),
    );
  });
});

describe("SchemaFields", () => {
  it("reorders with Alt and the arrows, the primary key stays first", async () => {
    const onReorder = vi.fn<(f: DataField[]) => void>();
    const root = await mount(h(SchemaFields, { defaultFields: fields, onReorder }));
    const price = root.querySelector<HTMLElement>('[data-field="price"] .fg-dh-sf-main')!;
    await key(price, "ArrowUp", { altKey: true });
    expect(onReorder.mock.lastCall![0].map((f) => f.id).slice(0, 3)).toEqual([
      "id",
      "price",
      "name",
    ]);
    await key(price, "ArrowUp", { altKey: true });
    expect(onReorder).toHaveBeenCalledTimes(1);
    expect(root.querySelector('[aria-live="polite"]')?.textContent).toBe("price, position 2 of 6");
    const out = html(h(SchemaFields, { fields }));
    expect(out).toContain("Primary");
    expect(out).toContain("relation → companies");
  });
});

describe("TableList", () => {
  it("narrows by the search and marks the current table", async () => {
    const onSelect = vi.fn<(id: string) => void>();
    const root = await mount(
      h(TableList, {
        current: "companies",
        onSelect,
        sections: [
          {
            key: "t",
            heading: "Tables",
            items: [
              { id: "companies", name: "companies", count: 12 },
              { id: "contacts", name: "contacts" },
            ],
          },
        ],
      }),
    );
    expect(root.querySelector('[aria-current="page"]')?.textContent).toContain("companies");
    expect(root.textContent).not.toContain("12");
    await type(root.querySelector("input")!, "cont");
    expect(root.querySelectorAll(".fg-dh-tl-row")).toHaveLength(1);
    await key(root.querySelector("input")!, "ArrowDown");
    await click(document.activeElement!);
    expect(onSelect).toHaveBeenCalledWith("contacts");
  });
});

describe("ImportWizard", () => {
  it("goes from pasted rows to the columns, the check and the import", async () => {
    const onImport = vi.fn<(rows: Record<string, CellValue>[]) => { inserted: number }>(
      (rows: Record<string, CellValue>[]) => ({ inserted: rows.length }),
    );
    const root = await mount(
      h(ImportWizard, {
        fields: fields.slice(0, 3),
        onImport,
        tableName: "products",
        defaultText: "Name,Price\nBrie,12.5\nComté,abc\n,3",
      }),
    );
    const button = (text: string) =>
      [...root.querySelectorAll("button")].find((b) => b.textContent?.startsWith(text))!;
    await click(button("Next"));
    expect(root.textContent).toContain("Column in the file");
    await click(button("Check 3 rows"));
    expect(root.textContent).toContain("1 row is ready, 2 have problems");
    await click(button("Import 1 record"));
    await settle();
    expect(onImport).toHaveBeenCalledWith([{ id: null, name: "Brie", price: 12.5 }]);
    expect(root.querySelector('[role="status"]')?.textContent).toContain("1record added");
  });
});
