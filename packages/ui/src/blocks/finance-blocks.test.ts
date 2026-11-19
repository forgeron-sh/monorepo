// @vitest-environment jsdom
import { act, createElement as h, useState } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup as html } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AmountBadge,
  DocumentHeader,
  LineItemsEditor,
  MetaTable,
  Paper,
  PartyBlock,
  PaymentForm,
  ReceiptViewer,
  StatementTable,
  TEST_CARDS,
  TEST_IBANS,
  TotalsSummary,
  allocate,
  buildStatement,
  cardBrand,
  computeTotals,
  csvField,
  expiryValid,
  formatCardNumber,
  formatExpiry,
  formatIban,
  ibanValid,
  lineAmounts,
  luhnValid,
  moveLine,
  parseMinor,
  percentOf,
  sectionSubtotals,
  statementToCsv,
  validateBank,
  validateCard,
  type LineItem,
  type PaymentSubmit,
  type ReceiptField,
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
const key = async (el: Element, k: string, more: KeyboardEventInit = {}) =>
  act(async () => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, ...more }));
  });
const type = async (input: HTMLInputElement, value: string) =>
  act(async () => {
    const proto = Object.getPrototypeOf(input) as object;
    Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
const click = (el: Element) => act(async () => (el as HTMLElement).click());
const blur = (el: HTMLElement) => act(async () => el.blur());

const line = (id: string, over: Partial<LineItem> = {}): LineItem => ({
  id,
  description: id,
  quantity: 1,
  unitPrice: 1000,
  taxRate: 20,
  ...over,
});

describe("money arithmetic", () => {
  it("rounds once, half away from zero, without float drift", () => {
    // 3 x 0.10 would be 0.30000000000000004 in floats.
    expect(lineAmounts(line("a", { quantity: 3, unitPrice: 10 })).net).toBe(30);
    expect(lineAmounts(line("a", { quantity: 1.005, unitPrice: 100 })).net).toBe(101);
    expect(lineAmounts(line("a", { quantity: 3, unitPrice: 333, discount: 10 }))).toEqual({
      subtotal: 999,
      discount: 100,
      net: 899,
    });
    expect(percentOf(1999, 5.5)).toBe(110);
    expect(percentOf(-250, 1)).toBe(-3);
    expect(lineAmounts({ id: "s", kind: "section", description: "x" }).net).toBe(0);
  });

  it("shares an amount without losing a cent", () => {
    expect(allocate(100, [1, 1, 1])).toEqual([34, 33, 33]);
    expect(allocate(-100, [1, 1, 1]).reduce((a, b) => a + b, 0)).toBe(-100);
    expect(allocate(5, [0, 0])).toEqual([0, 0]);
    expect(allocate(7, [3, 0, 4]).reduce((a, b) => a + b, 0)).toBe(7);
  });

  it("totals by rate, with discounts, tax and what is paid", () => {
    const lines = [
      line("a", { quantity: 3, unitPrice: 333, taxRate: 20 }),
      line("b", { unitPrice: 1999, taxRate: 5.5 }),
      line("c", { unitPrice: 500, taxRate: 20, discount: 10 }),
      { id: "s", kind: "section" as const, description: "Heading" },
    ];
    const t = computeTotals(lines, { paid: 1000 });
    expect(t.subtotal).toBe(999 + 1999 + 500);
    expect(t.lineDiscounts).toBe(50);
    expect(t.taxes.map((x) => x.rate)).toEqual([5.5, 20]);
    expect(t.taxes[1]).toEqual({ rate: 20, base: 999 + 450, amount: 290 });
    expect(t.taxes[0]).toEqual({ rate: 5.5, base: 1999, amount: 110 });
    expect(t.total).toBe(t.net + t.tax);
    expect(t.due).toBe(t.total - 1000);
  });

  it("keeps the parts equal to the total under a document discount", () => {
    const lines = [
      line("a", { unitPrice: 333 }),
      line("b", { unitPrice: 333, taxRate: 10 }),
      line("c", { unitPrice: 334, taxRate: 0 }),
    ];
    const t = computeTotals(lines, { discount: { percent: 10, amount: 7 } });
    expect(t.documentDiscount).toBe(percentOf(1000, 10) + 7);
    expect(t.taxes.reduce((a, x) => a + x.base, 0)).toBe(t.net);
    expect(t.net).toBe(1000 - t.documentDiscount);
    expect(computeTotals(lines, { discount: { amount: 99999 } }).net).toBe(0);
  });

  it("taxes per line or per rate, and inside the price", () => {
    const lines = [
      line("a", { unitPrice: 105, taxRate: 10 }),
      line("b", { unitPrice: 105, taxRate: 10 }),
    ];
    expect(computeTotals(lines, { taxMode: "rate" }).tax).toBe(21);
    expect(computeTotals(lines, { taxMode: "line" }).tax).toBe(22);
    const inc = computeTotals([line("a", { unitPrice: 12000, taxRate: 20 })], {
      pricesIncludeTax: true,
    });
    expect(inc.total).toBe(12000);
    expect(inc.tax).toBe(2000);
    expect(inc.net).toBe(10000);
  });

  it("moves lines, subtotals sections and reads typed amounts", () => {
    expect(moveLine([1, 2, 3], 0, 1)).toEqual([2, 1, 3]);
    expect(moveLine([1, 2, 3], 0, -1)).toEqual([1, 2, 3]);
    const sub = sectionSubtotals([
      { id: "s1", kind: "section", description: "A" },
      line("a"),
      line("b"),
      { id: "s2", kind: "section", description: "B" },
      line("c"),
    ]);
    expect(sub.get("s1")).toBe(2000);
    expect(sub.get("s2")).toBe(1000);
    expect(parseMinor("1 234,50")).toBe(123450);
    expect(parseMinor("1.234,5")).toBe(123450);
    expect(parseMinor("1,234")).toBe(123400);
    expect(parseMinor("12.5")).toBe(1250);
    expect(parseMinor("−3")).toBe(-300);
    expect(parseMinor("abc")).toBeNull();
    expect(parseMinor("5", 0)).toBe(5);
  });
});

describe("statement", () => {
  const entries = [
    { id: "1", date: "2026-11-02", description: "Invoice 1", amount: 12000, group: "November" },
    { id: "2", date: "2026-11-05", description: "=HYPERLINK(x)", amount: -2500, group: "November" },
    {
      id: "3",
      date: "2026-12-01",
      description: 'Refund, "partial"',
      amount: -1000,
      group: "December",
    },
  ];
  it("runs the balance across sections with subtotals and a total", () => {
    const rows = buildStatement(entries, { opening: 5000 });
    expect(rows.map((r) => r.kind)).toEqual([
      "opening",
      "group",
      "entry",
      "entry",
      "subtotal",
      "group",
      "entry",
      "subtotal",
      "total",
    ]);
    const balances = rows
      .filter((r) => r.kind === "entry")
      .map((r) => (r as { balance: number }).balance);
    expect(balances).toEqual([17000, 14500, 13500]);
    const total = rows.at(-1) as {
      amount: number;
      credits: number;
      debits: number;
      balance: number;
    };
    expect(total).toMatchObject({ amount: 8500, credits: 12000, debits: -3500, balance: 13500 });
    expect(buildStatement(entries.slice(0, 1)).map((r) => r.kind)).toContain("subtotal");
    expect(buildStatement(entries, { grouped: false }).some((r) => r.kind === "group")).toBe(false);
  });
  it("sorts by date on request and writes safe CSV", () => {
    const rows = buildStatement([...entries].reverse(), { sort: "date", grouped: false });
    expect(
      rows.filter((r) => r.kind === "entry").map((r) => (r as { entry: { id: string } }).entry.id),
    ).toEqual(["1", "2", "3"]);
    const csv = statementToCsv(buildStatement(entries));
    expect(csv).toContain("'=HYPERLINK(x)");
    expect(csv).toContain('"Refund, ""partial"""');
    expect(csv.split("\r\n")[0]).toBe("Date,Description,Reference,Amount,Balance");
    expect(csvField("@a")).toBe("'@a");
    expect(csvField(-5)).toBe("-5");
  });
});

describe("payment checks", () => {
  it("passes the published test numbers and refuses a changed digit", () => {
    for (const c of TEST_CARDS) {
      expect(luhnValid(c.number)).toBe(true);
      expect(cardBrand(c.number)).toBe(c.brand);
      expect(
        validateCard(
          {
            number: c.number,
            expiry: "12/34",
            cvc: c.brand === "amex" ? "1234" : "123",
            name: "A",
          },
          new Date(2026, 0, 1),
        ),
      ).toEqual({});
    }
    expect(luhnValid("4242424242424241")).toBe(false);
    expect(luhnValid("abcd")).toBe(false);
    expect(formatCardNumber("378282246310005")).toBe("3782 822463 10005");
    expect(formatCardNumber("4242 4242-4242 4242")).toBe("4242 4242 4242 4242");
  });
  it("formats and checks expiry dates", () => {
    expect(formatExpiry("1")).toBe("1");
    expect(formatExpiry("4")).toBe("04");
    expect(formatExpiry("1234")).toBe("12 / 34");
    const now = new Date(2026, 10, 19);
    expect(expiryValid("11/26", now)).toBe(true);
    expect(expiryValid("10/26", now)).toBe(false);
    expect(expiryValid("13/30", now)).toBe(false);
  });
  it("checks IBANs with mod 97 and the length of the country", () => {
    for (const i of TEST_IBANS) expect(ibanValid(i.iban)).toBe(true);
    expect(ibanValid("de89 3704 0044 0532 0130 00")).toBe(true);
    expect(ibanValid("DE89370400440532013001")).toBe(false);
    expect(ibanValid("DE8937040044053201300")).toBe(false);
    expect(ibanValid("XX89370400440532013000")).toBe(false);
    expect(formatIban("de89370400440532013000")).toBe("DE89 3704 0044 0532 0130 00");
    expect(validateBank({ holder: "", iban: "", mandate: false })).toMatchObject({
      holder: expect.any(String),
      iban: expect.any(String),
      mandate: expect.any(String),
    });
  });
});

describe("LineItemsEditor", () => {
  const Harness = ({ onChange }: { onChange?: (l: LineItem[]) => void }) => {
    const [lines, setLines] = useState<LineItem[]>([
      line("a", { description: "Design" }),
      line("b", { description: "Build" }),
    ]);
    return h(LineItemsEditor, {
      currency: "EUR",
      locale: "en",
      value: lines,
      onChange: (l: LineItem[]) => {
        setLines(l);
        onChange?.(l);
      },
    });
  };
  const cell = (root: HTMLElement, id: string, col: string) =>
    root.querySelector<HTMLInputElement>(`input[data-line="${id}"][data-col="${col}"]`)!;

  it("edits a cell, writes the line total and reports the change", async () => {
    const seen = vi.fn<(l: LineItem[]) => void>();
    const root = await mount(h(Harness, { onChange: seen }));
    const qty = cell(root, "a", "quantity");
    await act(async () => qty.focus());
    await type(qty, "2.5");
    await blur(qty);
    expect(seen.mock.calls.at(-1)![0]![0]!.quantity).toBe(2.5);
    expect(root.textContent).toContain("€25.00");
    const price = cell(root, "a", "unitPrice");
    await type(price, "1 234,5x");
    await blur(price);
    expect(seen.mock.calls.at(-1)![0]![0]!.unitPrice).toBe(1000);
  });

  it("moves like a sheet: Enter down, Escape reverts, Alt arrows reorder, Enter at the end adds", async () => {
    const seen = vi.fn<(l: LineItem[]) => void>();
    const root = await mount(h(Harness, { onChange: seen }));
    const first = cell(root, "a", "description");
    await act(async () => first.focus());
    await key(first, "ArrowDown");
    expect(document.activeElement).toBe(cell(root, "b", "description"));
    await type(cell(root, "b", "description"), "Typed");
    await key(cell(root, "b", "description"), "Escape");
    expect(cell(root, "b", "description").value).toBe("Build");
    await key(cell(root, "b", "description"), "ArrowUp", { altKey: true });
    expect(seen.mock.calls.at(-1)![0].map((l) => l.id)).toEqual(["b", "a"]);
    const last = cell(root, "a", "quantity");
    await act(async () => last.focus());
    await key(last, "Enter");
    expect(seen.mock.calls.at(-1)![0]).toHaveLength(3);
    expect(cell(root, seen.mock.calls.at(-1)![0][2]!.id, "description")).toBeTruthy();
  });

  it("removes with the buttons and the keys, and is only text when read only", async () => {
    const seen = vi.fn<(l: LineItem[]) => void>();
    const root = await mount(h(Harness, { onChange: seen }));
    await click(root.querySelector('[aria-label="Remove line 1"]')!);
    expect(seen.mock.calls.at(-1)![0].map((l) => l.id)).toEqual(["b"]);
    await key(cell(root, "b", "description"), "Backspace", { ctrlKey: true, shiftKey: true });
    expect(seen.mock.calls.at(-1)![0]).toEqual([]);
    expect(root.textContent).toContain("No line yet");
    const ro = html(
      h(LineItemsEditor, {
        currency: "EUR",
        locale: "en",
        readOnly: true,
        defaultValue: [line("a"), { id: "s", kind: "section", description: "Part" }],
      }),
    );
    expect(ro).not.toContain("<input");
    expect(ro).not.toContain("Add line");
    expect(ro).toContain("Part");
  });
});

describe("TotalsSummary", () => {
  it("writes tax by rate, the total and the balance due", () => {
    const out = html(
      h(TotalsSummary, {
        currency: "EUR",
        locale: "en",
        paid: 500,
        lines: [
          line("a", { unitPrice: 10000, taxRate: 20 }),
          line("b", { unitPrice: 2000, taxRate: 5.5, discount: 10 }),
        ],
      }),
    );
    expect(out).toContain("Tax 20 %");
    expect(out).toContain("Tax 5.5 %");
    expect(out).toContain("€138.99");
    expect(out).toContain("Balance due");
    expect(out).toContain("Discounts");
    expect(html(h(TotalsSummary, { currency: "EUR", lines: [line("a")] }))).not.toContain(
      "Balance due",
    );
  });
});

describe("AmountBadge", () => {
  it("writes the sign in text next to the tone", () => {
    const pos = html(h(AmountBadge, { amount: 1250, currency: "EUR", locale: "en" }));
    const neg = html(h(AmountBadge, { amount: -1250, currency: "EUR", locale: "en" }));
    expect(pos).toContain("+");
    expect(pos).toContain("fg-fin-amount-positive");
    expect(neg).toContain("−");
    expect(neg).toContain("fg-fin-amount-negative");
    expect(html(h(AmountBadge, { amount: -1, currency: "EUR", invert: true }))).toContain(
      "positive",
    );
    expect(html(h(AmountBadge, { amount: 0, currency: "EUR" }))).toContain("neutral");
  });
});

describe("ReceiptViewer", () => {
  const fields: ReceiptField[] = [
    {
      id: "m",
      label: "Merchant",
      value: "Cafe Exemple",
      confidence: 0.97,
      box: { x: 0.1, y: 0.05, w: 0.5, h: 0.05 },
    },
    {
      id: "t",
      label: "Total",
      value: "12.50",
      confidence: 0.55,
      box: { x: 0.6, y: 0.8, w: 0.3, h: 0.05 },
    },
    { id: "n", label: "Note", value: "" },
  ];
  it("lights a field from its box and the box from its field, and edits", async () => {
    const changed = vi.fn<(id: string, v: string) => void>();
    const root = await mount(
      h(ReceiptViewer, {
        pages: [{ src: "data:image/gif;base64,R0lGODlhAQABAAAAACw=" }],
        fields,
        onFieldChange: changed,
      }),
    );
    const box = root.querySelector<HTMLElement>('.fg-fin-rv-box[aria-label^="Total"]')!;
    const row = root.querySelector<HTMLElement>('[data-field="t"]')!.closest("li")!;
    await act(async () => box.dispatchEvent(new PointerEvent("pointerover", { bubbles: true })));
    await act(async () => box.dispatchEvent(new Event("pointerenter")));
    await act(async () => box.focus());
    expect(row.classList.contains("fg-fin-rv-lit")).toBe(true);
    await act(async () => box.blur());
    expect(row.classList.contains("fg-fin-rv-lit")).toBe(false);
    const main = root.querySelector<HTMLElement>('[data-field="m"]')!;
    await act(async () => main.focus());
    expect(
      root.querySelector(".fg-fin-rv-box.fg-fin-rv-lit")!.getAttribute("aria-label"),
    ).toContain("Merchant");
    await key(main, "ArrowDown");
    expect(document.activeElement).toBe(root.querySelector('[data-field="t"]'));
    await key(document.activeElement!, "Enter");
    const input = root.querySelector<HTMLInputElement>(".fg-fin-rv-input")!;
    await type(input, "13.00");
    await key(input, "Enter");
    expect(changed).toHaveBeenCalledWith("t", "13.00");
    expect(root.textContent).toContain("Low confidence");
    expect(root.textContent).toContain("High confidence");
  });
  it("is read only without onFieldChange", () => {
    expect(html(h(ReceiptViewer, { pages: [{ src: "x.png" }], fields }))).not.toContain(
      "Edit Merchant",
    );
  });
});

describe("PaymentForm", () => {
  it("announces the test mode, formats while typing and sends valid details once, then clears", async () => {
    const sent = vi.fn<(p: PaymentSubmit) => void>();
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const root = await mount(h(PaymentForm, { onSubmit: sent }));
    expect(root.textContent).toContain("Test mode");
    const field = (label: string) =>
      root.querySelector<HTMLInputElement>(`input[autocomplete="${label}"]`)!;
    await click(root.querySelector("button[type=submit]")!);
    expect(sent).not.toHaveBeenCalled();
    expect(root.textContent).toContain("Enter the card number.");
    await type(field("cc-number"), "4242424242424242");
    expect(field("cc-number").value).toBe("4242 4242 4242 4242");
    await type(field("cc-exp"), "1234");
    expect(field("cc-exp").value).toBe("12 / 34");
    await type(field("cc-csc"), "123");
    await type(field("cc-name"), "Test Person");
    await click(root.querySelector("button[type=submit]")!);
    expect(sent).toHaveBeenCalledTimes(1);
    expect(sent.mock.calls[0]![0]).toMatchObject({ method: "card", last4: "4242", brand: "Visa" });
    expect(field("cc-number").value).toBe("");
    expect(log).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    log.mockRestore();
    setItem.mockRestore();
  });
  it("takes a bank account with a mandate and shows no banner when test mode is off", async () => {
    const sent = vi.fn<(p: PaymentSubmit) => void>();
    const root = await mount(
      h(PaymentForm, { defaultMethod: "bank", testMode: false, onSubmit: sent }),
    );
    expect(root.textContent).not.toContain("Test mode");
    const inputs = root.querySelectorAll<HTMLInputElement>("input");
    await type(inputs[0]!, "Test Person");
    await type(inputs[1]!, TEST_IBANS[0]!.iban.toLowerCase());
    expect(inputs[1]!.value).toBe("DE89 3704 0044 0532 0130 00");
    await click(root.querySelector("button[type=submit]")!);
    expect(sent).not.toHaveBeenCalled();
    expect(root.textContent).toContain("Accept the mandate");
    await click(root.querySelector("input[type=checkbox]")!);
    await click(root.querySelector("button[type=submit]")!);
    expect(sent.mock.calls[0]![0].method).toBe("bank");
  });
});

describe("StatementTable and Paper", () => {
  it("renders sections, subtotals, the total and exports", async () => {
    const onExport = vi.fn<(p: { rows: unknown[]; csv: string }) => void>();
    const root = await mount(
      h(StatementTable, {
        currency: "EUR",
        locale: "en",
        opening: 1000,
        onExport,
        entries: [
          { id: "1", date: "2026-11-02", description: "In", amount: 5000, group: "A" },
          { id: "2", date: "2026-11-03", description: "Out", amount: -2000, group: "A" },
        ],
      }),
    );
    expect(root.querySelectorAll(".fg-fin-r-subtotal")).toHaveLength(1);
    expect(root.querySelector(".fg-fin-r-total")!.textContent).toContain("Closing balance");
    expect(root.querySelector(".fg-fin-r-total")!.textContent).toContain("€40.00");
    await click(
      [...root.querySelectorAll("button")].find((b) => b.textContent?.includes("Export"))!,
    );
    expect(onExport.mock.calls[0]![0].csv).toContain("Opening balance");
    expect(html(h(StatementTable, { currency: "EUR", entries: [] }))).toContain("No entry");
  });
  it("lays out a sheet with its parts and the page rule", () => {
    const out = html(
      h(Paper, {
        size: "Letter",
        margin: "0.75in",
        header: "HEAD",
        footer: "FOOT",
        zoom: 1,
        children: h(
          "div",
          null,
          h(DocumentHeader, { title: "Invoice", number: "INV-1" }),
          h(PartyBlock, { label: "Bill to", name: "Acme", lines: ["1 Test Street"] }),
          h(MetaTable, { rows: [{ label: "Due", value: "2026-12-01" }] }),
        ),
      }),
    );
    expect(out).toContain("@page{size:215.9mm 279.4mm;margin:0.75in}");
    expect(out).toContain("<header");
    expect(out).toContain("<footer");
    expect(out).toContain("INV-1");
    expect(out).toContain("Bill to");
    expect(out).toContain("<dt>Due</dt>");
  });
});
