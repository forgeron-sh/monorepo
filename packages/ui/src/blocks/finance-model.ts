// The arithmetic of the "finance" blocks, pure and free of floats where it matters: money is in
// MINOR units (cents) as integers, quantities and percentages are scaled to integers before they
// are multiplied, and every division rounds half away from zero, once. Totals, tax by rate, a
// discount shared out without losing a cent, a running balance, and the CSV of a statement.

/** An amount in minor units: `1250` is 12.50 in EUR. Always an integer. */
export type Minor = number;

/* ---------------------------------------------------------------- rounding */

/** Integer division of two bigints, rounded half away from zero. */
function divRound(n: bigint, d: bigint): bigint {
  const negative = n < 0n !== d < 0n;
  const an = n < 0n ? -n : n;
  const ad = d < 0n ? -d : d;
  const q = (2n * an + ad) / (2n * ad);
  return negative ? -q : q;
}

/** A number with at most `digits` decimals as an integer: `scaled(12.5, 2)` is 1250. */
const scaled = (x: number, digits: number) => BigInt(Math.round(x * 10 ** digits));

const big = (n: number) => BigInt(Math.round(n));

/** Rounds to a whole number of minor units, half away from zero (`2.5` to 3, `-2.5` to -3). */
export function roundMinor(x: number): Minor {
  return x < 0 ? -Math.round(-x) : Math.round(x);
}

/** `percent` of an amount, rounded once: `percentOf(1999, 5.5)` is 110. */
export function percentOf(amount: Minor, percent: number): Minor {
  return Number(divRound(big(amount) * scaled(percent, 2), 10_000n));
}

/** `amount` times a decimal `factor` (a quantity), rounded once, without float drift. */
export function timesMinor(amount: Minor, factor: number): Minor {
  return Number(divRound(big(amount) * scaled(factor, 4), 10_000n));
}

/** Converts an amount written in major units (`12.5`) to minor units, as a decimal string would. */
export function toMinor(major: number, digits = 2): Minor {
  return roundMinor(Number(major.toFixed(digits + 4)) * 10 ** digits);
}

/**
 * Shares `total` between `weights` in proportion, in whole minor units, so that the parts add up to
 * `total` exactly (the largest remainders get the leftover cents). With no weight, all zeros.
 */
export function allocate(total: Minor, weights: ReadonlyArray<number>): Minor[] {
  const sum = weights.reduce((a, w) => a + Math.abs(w), 0);
  if (sum === 0 || weights.length === 0) return weights.map(() => 0);
  const sign = total < 0 ? -1n : 1n;
  const t = big(Math.abs(total));
  const w = weights.map((x) => big(Math.abs(x)));
  const s = w.reduce((a, b) => a + b, 0n);
  const parts = w.map((x) => (t * x) / s);
  let left = t - parts.reduce((a, b) => a + b, 0n);
  const order = w
    .map((x, i) => ({ i, rem: (t * x) % s }))
    .sort((a, b) => (a.rem === b.rem ? a.i - b.i : a.rem > b.rem ? -1 : 1));
  for (const { i } of order) {
    if (left <= 0n) break;
    parts[i] = (parts[i] ?? 0n) + 1n;
    left -= 1n;
  }
  return parts.map((p) => Number(sign * p));
}

/* ---------------------------------------------------------------- lines */

export interface LineItem {
  id: string;
  /** A `section` is a heading row (and a subtotal): it carries no amount of its own. */
  kind?: "item" | "section";
  description: string;
  /** Decimals allowed, up to four. Default 1. */
  quantity?: number;
  /** What `quantity` counts: `h`, `pcs`, `kg`. */
  unit?: string;
  /** In minor units. */
  unitPrice?: Minor;
  /** A percentage: `20` for 20 %, `5.5` for 5.5 %. */
  taxRate?: number;
  /** A percentage of the line, from 0 to 100. */
  discount?: number;
  /** The product it was picked from, when it was. */
  productId?: string | null;
}

export interface LineAmounts {
  /** Quantity times unit price, before any discount. */
  subtotal: Minor;
  /** What the line discount takes off. */
  discount: Minor;
  /** After the line discount: the amount the tax applies to (tax included for tax-inclusive prices). */
  net: Minor;
}

const clampPercent = (p: number | undefined) => Math.min(100, Math.max(0, p ?? 0));

/** The amounts of one line; a section has none. Rounded once: `net` is not `subtotal - discount` of two roundings. */
export function lineAmounts(line: LineItem): LineAmounts {
  if (line.kind === "section") return { subtotal: 0, discount: 0, net: 0 };
  const price = big(line.unitPrice ?? 0);
  const qty = scaled(line.quantity ?? 1, 4);
  const subtotal = Number(divRound(price * qty, 10_000n));
  const keep = 10_000n - scaled(clampPercent(line.discount), 2);
  const net = Number(divRound(price * qty * keep, 100_000_000n));
  return { subtotal, discount: subtotal - net, net };
}

/** A line with nothing in it: no description and no price, so not worth a row in a document. */
export const isBlankLine = (line: LineItem) =>
  line.kind !== "section" && line.description.trim() === "" && !line.unitPrice;

/** What a new line starts from. */
export function newLine(id: string, kind: "item" | "section" = "item", taxRate?: number): LineItem {
  return kind === "section"
    ? { id, kind, description: "" }
    : {
        id,
        kind,
        description: "",
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        ...(taxRate !== undefined ? { taxRate } : {}),
      };
}

/** Moves a line by `by` places (negative: up), staying inside the list. */
export function moveLine<T>(lines: ReadonlyArray<T>, from: number, by: number): T[] {
  const to = Math.min(lines.length - 1, Math.max(0, from + by));
  const next = [...lines];
  if (from < 0 || from >= lines.length || to === from) return next;
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item as T);
  return next;
}

/** The subtotal (after line discounts) of every section: what lies between it and the next one. */
export function sectionSubtotals(lines: ReadonlyArray<LineItem>): Map<string, Minor> {
  const out = new Map<string, Minor>();
  let current: string | null = null;
  for (const line of lines) {
    if (line.kind === "section") {
      current = line.id;
      out.set(current, 0);
    } else if (current !== null) {
      out.set(current, (out.get(current) ?? 0) + lineAmounts(line).net);
    }
  }
  return out;
}

/* ---------------------------------------------------------------- totals */

export interface TaxLine {
  /** The rate, in percent. */
  rate: number;
  /** The amount the rate applies to, after every discount. */
  base: Minor;
  amount: Minor;
}

export interface TotalsOptions {
  /**
   * `rate` (default): the tax of a rate is worked out once on the sum of its lines, as an invoice
   * prints it. `line`: tax per line, rounded each, then added.
   */
  taxMode?: "rate" | "line";
  /** The unit prices already contain the tax: the tax is the part of the amount, not added to it. */
  pricesIncludeTax?: boolean;
  /** A discount on the whole document: a percentage, then a fixed amount (minor units). */
  discount?: { percent?: number; amount?: Minor };
  /** Already paid, in minor units. */
  paid?: Minor;
}

export interface Totals {
  /** Before every discount. */
  subtotal: Minor;
  /** Taken off by the lines, positive. */
  lineDiscounts: Minor;
  /** Taken off by the document discount, positive. */
  documentDiscount: Minor;
  /** Both. */
  discounts: Minor;
  /** After discounts, without tax. */
  net: Minor;
  /** By rate, from the lowest. */
  taxes: TaxLine[];
  tax: Minor;
  /** To pay: `net + tax`. */
  total: Minor;
  paid: Minor;
  /** `total - paid`: negative when overpaid. */
  due: Minor;
  pricesIncludeTax: boolean;
}

/**
 * The totals of a document: subtotal, discounts, tax by rate, total, paid and balance due. All in
 * integer minor units; a document discount is shared out between the lines so that the tax of
 * each rate stays right and the parts always add up to the total.
 */
export function computeTotals(lines: ReadonlyArray<LineItem>, options: TotalsOptions = {}): Totals {
  const { taxMode = "rate", pricesIncludeTax = false, discount, paid = 0 } = options;
  const items = lines.filter((l) => l.kind !== "section");
  const amounts = items.map(lineAmounts);
  const subtotal = amounts.reduce((a, x) => a + x.subtotal, 0);
  const lineDiscounts = amounts.reduce((a, x) => a + x.discount, 0);
  const afterLines = subtotal - lineDiscounts;

  // The document discount, then its share in every line.
  let docDiscount = 0;
  if (discount?.percent) docDiscount += percentOf(afterLines, clampPercent(discount.percent));
  if (discount?.amount) docDiscount += discount.amount;
  docDiscount = afterLines >= 0 ? Math.min(afterLines, Math.max(0, docDiscount)) : 0;
  const shares = allocate(
    docDiscount,
    amounts.map((x) => x.net),
  );
  const bases = amounts.map((x, i) => x.net - (shares[i] ?? 0));

  const rateOf = (i: number) => items[i]?.taxRate ?? 0;
  const taxOf = (base: number, rate: number) =>
    pricesIncludeTax
      ? Number(divRound(big(base) * scaled(rate, 2), 10_000n + scaled(rate, 2)))
      : percentOf(base, rate);

  const groups = new Map<number, { base: number; lineTax: number }>();
  bases.forEach((base, i) => {
    const rate = rateOf(i);
    const g = groups.get(rate) ?? { base: 0, lineTax: 0 };
    g.base += base;
    g.lineTax += taxOf(base, rate);
    groups.set(rate, g);
  });
  const taxes: TaxLine[] = [...groups.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([rate, g]) => {
      const amount = taxMode === "line" ? g.lineTax : taxOf(g.base, rate);
      return { rate, base: pricesIncludeTax ? g.base - amount : g.base, amount };
    });
  const tax = taxes.reduce((a, t) => a + t.amount, 0);
  const net = taxes.reduce((a, t) => a + t.base, 0);
  const total = net + tax;
  return {
    subtotal,
    lineDiscounts,
    documentDiscount: docDiscount,
    discounts: lineDiscounts + docDiscount,
    net,
    taxes,
    tax,
    total,
    paid,
    due: total - paid,
    pricesIncludeTax,
  };
}

/* ---------------------------------------------------------------- statement */

export interface StatementEntry {
  id: string;
  /** `YYYY-MM-DD`. */
  date: string;
  description: string;
  /** An invoice number, a payment reference. */
  reference?: string;
  /** Signed, in minor units: money in is positive, money out negative. */
  amount: Minor;
  /** The section it belongs to: a month, an account, a category. */
  group?: string;
}

export type StatementRow =
  | { kind: "opening"; balance: Minor }
  | { kind: "group"; label: string }
  | { kind: "entry"; entry: StatementEntry; balance: Minor }
  | {
      kind: "subtotal";
      label: string;
      amount: Minor;
      credits: Minor;
      debits: Minor;
      balance: Minor;
    }
  | { kind: "total"; label: string; amount: Minor; credits: Minor; debits: Minor; balance: Minor };

export interface StatementOptions {
  /** The balance before the first entry, in minor units. Default 0. */
  opening?: Minor;
  /** Heads the sections and subtotals them. Default: when an entry has a `group`. */
  grouped?: boolean;
  /** `date` sorts the entries by date (then as given); default keeps the order given. */
  sort?: "date" | "none";
  totalLabel?: string;
  /** The label of a subtotal row, from the section name. */
  subtotalLabel?: (group: string) => string;
}

/**
 * The rows of a ledger: the opening balance, the entries with the balance after each (a running
 * balance that carries across sections), a subtotal at the end of each section and a total.
 * Money in and out are summed apart as well as net.
 */
export function buildStatement(
  entries: ReadonlyArray<StatementEntry>,
  options: StatementOptions = {},
): StatementRow[] {
  const {
    opening = 0,
    sort = "none",
    totalLabel = "Closing balance",
    subtotalLabel = (g: string) => `Subtotal ${g}`,
  } = options;
  const grouped = options.grouped ?? entries.some((e) => e.group);
  const ordered =
    sort === "date"
      ? entries
          .map((e, i) => ({ e, i }))
          .sort((a, b) => (a.e.date < b.e.date ? -1 : a.e.date > b.e.date ? 1 : a.i - b.i))
          .map((x) => x.e)
      : [...entries];
  const sections: { label: string | null; items: StatementEntry[] }[] = [];
  if (grouped) {
    const by = new Map<string, StatementEntry[]>();
    for (const e of ordered) {
      const key = e.group ?? "";
      if (!by.has(key)) by.set(key, []);
      by.get(key)!.push(e);
    }
    for (const [label, items] of by) sections.push({ label, items });
  } else sections.push({ label: null, items: ordered });

  const rows: StatementRow[] = [{ kind: "opening", balance: opening }];
  let balance = opening;
  let credits = 0;
  let debits = 0;
  for (const section of sections) {
    if (section.label !== null) rows.push({ kind: "group", label: section.label });
    let sc = 0;
    let sd = 0;
    for (const entry of section.items) {
      balance += entry.amount;
      if (entry.amount >= 0) sc += entry.amount;
      else sd += entry.amount;
      rows.push({ kind: "entry", entry, balance });
    }
    credits += sc;
    debits += sd;
    if (section.label !== null)
      rows.push({
        kind: "subtotal",
        label: subtotalLabel(section.label),
        amount: sc + sd,
        credits: sc,
        debits: sd,
        balance,
      });
  }
  rows.push({
    kind: "total",
    label: totalLabel,
    amount: credits + debits,
    credits,
    debits,
    balance,
  });
  return rows;
}

/** The sign of an amount as text, never colour alone: `+`, `−` (a true minus) or nothing for zero. */
export const signText = (amount: Minor) => (amount > 0 ? "+" : amount < 0 ? "−" : "");

/** Writes a field of a CSV; a text that starts like a formula is neutralised (`=`, `+`, `-`, `@`). */
export function csvField(value: string | number): string {
  let text = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * A statement as CSV, amounts in major units with a dot (`-12.50`), one line per row, the sections
 * and totals included. Spreadsheet formulas in descriptions are neutralised.
 */
export function statementToCsv(
  rows: ReadonlyArray<StatementRow>,
  options: { digits?: number; openingLabel?: string } = {},
): string {
  const { digits = 2, openingLabel = "Opening balance" } = options;
  const major = (n: Minor) => (n / 10 ** digits).toFixed(digits);
  const lines: (string | number)[][] = [["Date", "Description", "Reference", "Amount", "Balance"]];
  for (const row of rows) {
    if (row.kind === "opening") lines.push(["", openingLabel, "", "", major(row.balance)]);
    else if (row.kind === "group") lines.push(["", row.label, "", "", ""]);
    else if (row.kind === "entry")
      lines.push([
        row.entry.date,
        row.entry.description,
        row.entry.reference ?? "",
        major(row.entry.amount),
        major(row.balance),
      ]);
    else lines.push(["", row.label, "", major(row.amount), major(row.balance)]);
  }
  return lines.map((l) => l.map(csvField).join(",")).join("\r\n");
}

/* ---------------------------------------------------------------- receipt fields */

/** The box of a recognised field on its page, as fractions of the page (0 to 1). */
export interface FieldBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** How sure the reading is: `high` from 85 %, `medium` from 60 %, `low` under, `none` unknown. */
export function confidenceLevel(
  confidence: number | undefined,
): "high" | "medium" | "low" | "none" {
  if (confidence === undefined || Number.isNaN(confidence)) return "none";
  return confidence >= 0.85 ? "high" : confidence >= 0.6 ? "medium" : "low";
}

/** A box kept inside its page and at least a hair wide, so a bad reading cannot leave the sheet. */
export function clampFieldBox(box: FieldBox): FieldBox {
  const x = Math.min(1, Math.max(0, box.x));
  const y = Math.min(1, Math.max(0, box.y));
  return {
    x,
    y,
    w: Math.max(0.002, Math.min(1 - x, box.w)),
    h: Math.max(0.002, Math.min(1 - y, box.h)),
  };
}

/* ---------------------------------------------------------------- reading and writing amounts */

/**
 * The minor units a typed amount means (`12,50`, `1 234.5`, `1.234,50`), or `null` for no amount.
 * A lone separator followed by one or two digits is the decimal sign, otherwise it groups.
 */
export function parseMinor(input: string, digits = 2): Minor | null {
  let text = input
    .trim()
    .replace(/[\s  ']/g, "")
    .replace(/−/g, "-");
  if (!/^-?[\d.,]+$/.test(text) || !/\d/.test(text)) return null;
  const negative = text.startsWith("-");
  text = text.replace("-", "");
  const last = Math.max(text.lastIndexOf("."), text.lastIndexOf(","));
  let whole = text;
  let frac = "";
  if (last >= 0) {
    const after = text.length - last - 1;
    // `1,234` groups (more digits than the currency has); `1,23`, `1.5` and `1.234,5` end in decimals.
    if (after >= 1 && after <= digits) {
      whole = text.slice(0, last);
      frac = text.slice(last + 1);
    }
  }
  whole = whole.replace(/[.,]/g, "");
  if (!/^\d*$/.test(whole) || !/^\d*$/.test(frac)) return null;
  const value = Number(`${whole || "0"}.${(frac + "0".repeat(digits)).slice(0, digits)}`);
  const minor = roundMinor(value * 10 ** digits);
  return negative ? -minor : minor;
}
