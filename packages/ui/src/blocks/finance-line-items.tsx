// The lines of an invoice, a quote, an order or an expense report as a sheet: description,
// quantity, unit price, tax, discount, the line total worked out, and section rows with their
// subtotal. Every cell is a real input; the keys are a spreadsheet's. Read-only it is the table
// of a printed document.

import { ArrowDown01Icon, ArrowUp01Icon, Delete04Icon, PlusSignIcon } from "@forgeron/icons";
import type { KeyboardEvent, ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "../button";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import { formatMoney, minorDigits, parseNumber } from "../numbers";
import {
  isBlankLine,
  lineAmounts,
  moveLine,
  newLine,
  sectionSubtotals,
  toMinor,
  type LineItem,
} from "./finance-model";
import { ProductPicker, type ProductOption } from "./finance-product-picker";

type Col = "description" | "quantity" | "unitPrice" | "taxRate" | "discount";
const COLS: ReadonlyArray<Col> = ["description", "quantity", "unitPrice", "taxRate", "discount"];

let counter = 0;
const freshId = (taken: ReadonlyArray<LineItem>) => {
  let id: string;
  do id = `line-${++counter}`;
  while (taken.some((l) => l.id === id));
  return id;
};

export interface LineItemsEditorProps {
  /** Names the sheet. Default "Line items". */
  label?: string;
  value?: LineItem[];
  defaultValue?: LineItem[];
  /** Hears the whole list after every change. */
  onChange?: (lines: LineItem[]) => void;
  /** An ISO 4217 code: prices and totals are in it. */
  currency: string;
  locale?: string;
  /** The catalogue: a button in each description picks a product and fills the line. */
  products?: ReadonlyArray<ProductOption>;
  /** The rates offered while typing a tax cell (`[0, 5.5, 20]`). */
  taxRates?: ReadonlyArray<number>;
  /** The tax rate a new line starts with. */
  defaultTaxRate?: number;
  /** The tax and discount columns. Default `true`. */
  showTax?: boolean;
  showDiscount?: boolean;
  /** Lets lines be grouped under heading rows, each with its subtotal. Default `true`. */
  sections?: boolean;
  /** Text only, no controls: the table of a printed document. */
  readOnly?: boolean;
  disabled?: boolean;
  addLabel?: string;
  addSectionLabel?: string;
  /** Shown with no line. */
  empty?: ReactNode;
  className?: string;
}

const fmt = (locale: string | undefined, digits: number, min = 0) =>
  new Intl.NumberFormat(locale, { minimumFractionDigits: min, maximumFractionDigits: digits });

/** One input of the sheet: edits a draft, writes it on Enter or when left, Escape drops it. */
function Cell({
  line,
  col,
  label,
  value,
  onCommit,
  align,
  list,
  inputMode,
  placeholder,
  disabled,
}: {
  line: string;
  col: Col;
  label: string;
  value: string;
  onCommit: (text: string) => void;
  align?: "end";
  list?: string;
  inputMode?: "decimal" | "text";
  placeholder?: string;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const done = () => {
    if (draft !== null) {
      onCommit(draft);
      setDraft(null);
    }
  };
  return (
    <input
      type="text"
      data-line={line}
      data-col={col}
      aria-label={label}
      className={cx("fg-fin-cell", align === "end" && "fg-fin-cell-end")}
      value={draft ?? value}
      inputMode={inputMode ?? "text"}
      autoComplete="off"
      {...(list ? { list } : {})}
      {...(placeholder ? { placeholder } : {})}
      disabled={disabled}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={done}
      onKeyDown={(event) => {
        if (event.key === "Enter") done();
        else if (event.key === "Escape" && draft !== null) {
          event.stopPropagation();
          setDraft(null);
        }
      }}
    />
  );
}

/**
 * Editable lines with computed totals. Arrows move between cells (Left and Right at the edge of the
 * text), Enter goes down a line and adds one at the end, Alt with Up or Down moves the line,
 * Mod+Enter inserts a line below, Mod+Shift+Backspace removes it.
 */
export function LineItemsEditor({
  label = "Line items",
  value,
  defaultValue = [],
  onChange,
  currency,
  locale,
  products,
  taxRates,
  defaultTaxRate,
  showTax = true,
  showDiscount = true,
  sections = true,
  readOnly = false,
  disabled = false,
  addLabel = "Add line",
  addSectionLabel = "Add section",
  empty = "No line yet",
  className,
}: LineItemsEditorProps) {
  const [lines, setLines] = useControllableState<LineItem[]>({ value, defaultValue, onChange });
  const root = useRef<HTMLDivElement>(null);
  const pending = useRef<{ id: string; col: Col } | null>(null);
  const hintId = useId();
  const listId = useId();
  const digits = minorDigits(currency);
  const money = fmt(locale, digits, digits);
  const qtyFmt = fmt(locale, 4);
  const pctFmt = fmt(locale, 2);
  const subtotals = sectionSubtotals(lines);
  const editable = !readOnly && !disabled;

  const cells = () => [
    ...(root.current?.querySelectorAll<HTMLInputElement>("input[data-line]") ?? []),
  ];
  const cellOf = (id: string, col: Col) =>
    cells().find((c) => c.dataset.line === id && c.dataset.col === col);
  useEffect(() => {
    const want = pending.current;
    if (!want) return;
    const el = cellOf(want.id, want.col);
    if (el) {
      pending.current = null;
      el.focus();
      el.select();
    }
  });

  const update = (id: string, patch: Partial<LineItem>) =>
    setLines((all) => all.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const insertAt = (at: number, kind: "item" | "section" = "item") => {
    const line = newLine(freshId(lines), kind, defaultTaxRate);
    setLines((all) => [...all.slice(0, at), line, ...all.slice(at)]);
    pending.current = { id: line.id, col: "description" };
  };
  const removeAt = (at: number, col: Col = "description") => {
    const next = lines[at + 1] ?? lines[at - 1];
    setLines((all) => all.filter((_, i) => i !== at));
    if (next) pending.current = { id: next.id, col: next.kind === "section" ? "description" : col };
  };

  const focusRel = (at: number, dir: 1 | -1, col: Col) => {
    const target = lines[at + dir];
    if (!target) return false;
    const c = target.kind === "section" ? "description" : col;
    cellOf(target.id, c)?.focus();
    cellOf(target.id, c)?.select();
    return true;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTableSectionElement>) => {
    const target = event.target as HTMLElement;
    if (!(target instanceof HTMLInputElement) || !target.dataset.line) return;
    const id = target.dataset.line;
    const col = target.dataset.col as Col;
    const at = lines.findIndex((l) => l.id === id);
    if (at < 0) return;
    const mod = event.metaKey || event.ctrlKey;
    const key = event.key;
    if (event.altKey && (key === "ArrowUp" || key === "ArrowDown")) {
      event.preventDefault();
      setLines(moveLine(lines, at, key === "ArrowUp" ? -1 : 1));
      pending.current = { id, col };
    } else if (mod && event.shiftKey && (key === "Backspace" || key === "Delete")) {
      event.preventDefault();
      removeAt(at, col);
    } else if (mod && key === "Enter") {
      event.preventDefault();
      insertAt(at + 1);
    } else if (!mod && !event.altKey && (key === "ArrowDown" || key === "ArrowUp")) {
      event.preventDefault();
      focusRel(at, key === "ArrowDown" ? 1 : -1, col);
    } else if (key === "Enter" && !mod) {
      event.preventDefault();
      const dir = event.shiftKey ? -1 : 1;
      if (!focusRel(at, dir, col) && dir === 1 && !isBlankLine(lines[at]!)) insertAt(at + 1);
    } else if ((key === "ArrowLeft" || key === "ArrowRight") && !mod && !event.altKey) {
      const back = key === "ArrowLeft";
      const edge = back
        ? target.selectionStart === 0 && target.selectionEnd === 0
        : target.selectionStart === target.value.length &&
          target.selectionEnd === target.value.length;
      if (!edge) return;
      const row = lines[at]!;
      const order = row.kind === "section" ? (["description"] as Col[]) : visible;
      const next = order[order.indexOf(col) + (back ? -1 : 1)];
      if (!next) return;
      event.preventDefault();
      cellOf(id, next)?.focus();
      cellOf(id, next)?.select();
    }
  };

  const visible = COLS.filter(
    (c) => (c !== "taxRate" || showTax) && (c !== "discount" || showDiscount),
  );
  const span = visible.length + 2 + (editable ? 1 : 0);

  const numberText = (n: number | undefined, f: Intl.NumberFormat) =>
    n === undefined ? "" : f.format(n);
  const parsePercent = (text: string) => {
    if (text.trim() === "") return 0;
    const n = parseNumber(text.replace(/%/g, ""), locale);
    return n === null ? null : Math.min(100, Math.max(0, Math.round(n * 100) / 100));
  };

  return (
    <div className={cx("fg-fin-lines", readOnly && "fg-fin-lines-ro", className)} ref={root}>
      <div className="fg-fin-scroll">
        <table className="fg-fin-table" aria-describedby={editable ? hintId : undefined}>
          <caption className="fg-sr">{label}</caption>
          <thead>
            <tr>
              <th scope="col" className="fg-fin-n">
                <span className="fg-sr">Line</span>
              </th>
              <th scope="col">Description</th>
              <th scope="col" className="fg-fin-end">
                Qty
              </th>
              <th scope="col" className="fg-fin-end">
                Unit price
              </th>
              {showTax ? (
                <th scope="col" className="fg-fin-end">
                  Tax %
                </th>
              ) : null}
              {showDiscount ? (
                <th scope="col" className="fg-fin-end">
                  Disc. %
                </th>
              ) : null}
              <th scope="col" className="fg-fin-end">
                Amount
              </th>
              {editable ? (
                <th scope="col" className="fg-fin-act">
                  <span className="fg-sr">Actions</span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody onKeyDown={editable ? onKeyDown : undefined}>
            {lines.length === 0 ? (
              <tr>
                <td className="fg-fin-empty" colSpan={span}>
                  {empty}
                </td>
              </tr>
            ) : null}
            {lines.map((line, at) => {
              const actions = editable ? (
                <td className="fg-fin-act">
                  <span className="fg-fin-acts">
                    <IconButton
                      icon={ArrowUp01Icon}
                      label={`Move line ${at + 1} up`}
                      size="sm"
                      disabled={at === 0}
                      onClick={() => {
                        setLines(moveLine(lines, at, -1));
                      }}
                    />
                    <IconButton
                      icon={ArrowDown01Icon}
                      label={`Move line ${at + 1} down`}
                      size="sm"
                      disabled={at === lines.length - 1}
                      onClick={() => {
                        setLines(moveLine(lines, at, 1));
                      }}
                    />
                    <IconButton
                      icon={Delete04Icon}
                      label={`Remove line ${at + 1}`}
                      size="sm"
                      onClick={() => removeAt(at)}
                    />
                  </span>
                </td>
              ) : null;
              if (line.kind === "section") {
                return (
                  <tr key={line.id} className="fg-fin-section">
                    <td className="fg-fin-n" />
                    <td colSpan={visible.length}>
                      {editable ? (
                        <Cell
                          line={line.id}
                          col="description"
                          label={`Section title, line ${at + 1}`}
                          value={line.description}
                          placeholder="Section title"
                          onCommit={(text) => update(line.id, { description: text })}
                        />
                      ) : (
                        <strong>{line.description}</strong>
                      )}
                    </td>
                    <td className="fg-fin-end fg-fin-sub">
                      <span className="fg-sr">Section subtotal </span>
                      {formatMoney(subtotals.get(line.id) ?? 0, currency, locale)}
                    </td>
                    {actions}
                  </tr>
                );
              }
              const number = lines.slice(0, at + 1).filter((l) => l.kind !== "section").length;
              const amounts = lineAmounts(line);
              const n = at + 1;
              return (
                <tr key={line.id}>
                  <td className="fg-fin-n">{number}</td>
                  <td className="fg-fin-desc">
                    {editable ? (
                      <span className="fg-fin-descbox">
                        <Cell
                          line={line.id}
                          col="description"
                          label={`Description, line ${n}`}
                          value={line.description}
                          placeholder="Description"
                          onCommit={(text) => update(line.id, { description: text })}
                        />
                        {products && products.length > 0 ? (
                          <ProductPicker
                            products={products}
                            value={line.productId ?? null}
                            currency={currency}
                            {...(locale ? { locale } : {})}
                            label={`Pick a product, line ${n}`}
                            onPick={(p) => {
                              update(line.id, {
                                productId: p.id,
                                description: p.label,
                                ...(p.unitPrice !== undefined ? { unitPrice: p.unitPrice } : {}),
                                ...(p.taxRate !== undefined ? { taxRate: p.taxRate } : {}),
                                ...(p.unit ? { unit: p.unit } : {}),
                              });
                              pending.current = { id: line.id, col: "quantity" };
                            }}
                            onClosed={() => {
                              pending.current ??= { id: line.id, col: "description" };
                            }}
                          />
                        ) : null}
                      </span>
                    ) : (
                      line.description
                    )}
                  </td>
                  <td className="fg-fin-end">
                    {editable ? (
                      <Cell
                        line={line.id}
                        col="quantity"
                        label={`Quantity, line ${n}`}
                        value={numberText(line.quantity ?? 1, qtyFmt)}
                        align="end"
                        inputMode="decimal"
                        onCommit={(text) => {
                          const q = text.trim() === "" ? 0 : parseNumber(text, locale);
                          if (q !== null)
                            update(line.id, { quantity: Math.round(q * 10_000) / 10_000 });
                        }}
                      />
                    ) : (
                      <>
                        {numberText(line.quantity ?? 1, qtyFmt)}
                        {line.unit ? <span className="fg-fin-unit"> {line.unit}</span> : null}
                      </>
                    )}
                  </td>
                  <td className="fg-fin-end">
                    {editable ? (
                      <Cell
                        line={line.id}
                        col="unitPrice"
                        label={`Unit price, line ${n}`}
                        value={money.format((line.unitPrice ?? 0) / 10 ** digits)}
                        align="end"
                        inputMode="decimal"
                        onCommit={(text) => {
                          const major = text.trim() === "" ? 0 : parseNumber(text, locale);
                          if (major !== null)
                            update(line.id, { unitPrice: toMinor(major, digits) });
                        }}
                      />
                    ) : (
                      formatMoney(line.unitPrice ?? 0, currency, locale)
                    )}
                  </td>
                  {showTax ? (
                    <td className="fg-fin-end">
                      {editable ? (
                        <Cell
                          line={line.id}
                          col="taxRate"
                          label={`Tax rate in percent, line ${n}`}
                          value={numberText(line.taxRate ?? 0, pctFmt)}
                          align="end"
                          inputMode="decimal"
                          {...(taxRates ? { list: listId } : {})}
                          onCommit={(text) => {
                            const rate = parsePercent(text);
                            if (rate !== null) update(line.id, { taxRate: rate });
                          }}
                        />
                      ) : (
                        `${numberText(line.taxRate ?? 0, pctFmt)} %`
                      )}
                    </td>
                  ) : null}
                  {showDiscount ? (
                    <td className="fg-fin-end">
                      {editable ? (
                        <Cell
                          line={line.id}
                          col="discount"
                          label={`Discount in percent, line ${n}`}
                          value={numberText(line.discount ?? 0, pctFmt)}
                          align="end"
                          inputMode="decimal"
                          onCommit={(text) => {
                            const d = parsePercent(text);
                            if (d !== null) update(line.id, { discount: d });
                          }}
                        />
                      ) : (line.discount ?? 0) > 0 ? (
                        `${numberText(line.discount, pctFmt)} %`
                      ) : (
                        ""
                      )}
                    </td>
                  ) : null}
                  <td className="fg-fin-end fg-fin-amount-cell">
                    {formatMoney(amounts.net, currency, locale)}
                  </td>
                  {actions}
                </tr>
              );
            })}
          </tbody>
        </table>
        {taxRates ? (
          <datalist id={listId}>
            {taxRates.map((r) => (
              <option key={r} value={pctFmt.format(r)} />
            ))}
          </datalist>
        ) : null}
      </div>
      {editable ? (
        <>
          <p id={hintId} className="fg-sr">
            Arrow keys move between cells. Enter goes to the next line and adds one at the end. Alt
            with Up or Down moves the line. Control or Command with Enter inserts a line below; with
            Shift and Backspace it removes the line.
          </p>
          <div className="fg-fin-add">
            <Button size="sm" variant="ghost" onClick={() => insertAt(lines.length)}>
              <Icon icon={PlusSignIcon} size={12} variant="mono" />
              {addLabel}
            </Button>
            {sections ? (
              <Button size="sm" variant="ghost" onClick={() => insertAt(lines.length, "section")}>
                {addSectionLabel}
              </Button>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
