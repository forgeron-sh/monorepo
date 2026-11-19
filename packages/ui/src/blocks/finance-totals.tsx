// The totals of a document: subtotal, discounts, tax by rate, total, amount paid and balance due.
// Standalone: give it the `totals` you computed, or the `lines` and it works them out.

import type { ReactNode } from "react";
import { cx } from "../cx";
import { formatMoney } from "../numbers";
import {
  computeTotals,
  type LineItem,
  type Minor,
  type Totals,
  type TotalsOptions,
} from "./finance-model";

export interface TotalsLabels {
  subtotal: string;
  discounts: string;
  net: string;
  tax: string;
  total: string;
  paid: string;
  due: string;
  included: string;
}

const DEFAULT_LABELS: TotalsLabels = {
  subtotal: "Subtotal",
  discounts: "Discounts",
  net: "Total excluding tax",
  tax: "Tax",
  total: "Total",
  paid: "Amount paid",
  due: "Balance due",
  included: "Including tax",
};

export interface TotalsSummaryProps extends TotalsOptions {
  /** The amounts, from `computeTotals`. Without them, `lines` are totalled here. */
  totals?: Totals;
  lines?: ReadonlyArray<LineItem>;
  /** An ISO 4217 code. */
  currency: string;
  locale?: string;
  /** Names the block for assistive technology. Default "Totals". */
  label?: string;
  /** The words of the rows, to translate or to rename (`Amount paid` to `Deposit`). */
  labels?: Partial<TotalsLabels>;
  /** The name of a tax line. Default `Tax 20 %`. */
  taxLabel?: (rate: number) => string;
  /** Shows the subtotal and the discounts only when there are some. Default `true`. */
  hideEmpty?: boolean;
  /** Always writes the paid and due rows, even at zero. Default: only once something is paid. */
  alwaysShowDue?: boolean;
  /** Under the rows: a note, a due date, a pay button. */
  footer?: ReactNode;
  className?: string;
}

/**
 * The foot of an invoice, a quote or an order: the figures that add up, tax by rate, the total in
 * bold and the balance due set apart. Amounts are minor units; nothing is worked out in floats.
 */
export function TotalsSummary({
  totals,
  lines,
  currency,
  locale,
  label = "Totals",
  labels,
  taxLabel = (rate) =>
    `Tax ${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(rate)} %`,
  hideEmpty = true,
  alwaysShowDue = false,
  footer,
  className,
  taxMode,
  pricesIncludeTax,
  discount,
  paid,
}: TotalsSummaryProps) {
  const t = labels ? { ...DEFAULT_LABELS, ...labels } : DEFAULT_LABELS;
  const sums: Totals =
    totals ??
    computeTotals(lines ?? [], {
      ...(taxMode ? { taxMode } : {}),
      ...(pricesIncludeTax !== undefined ? { pricesIncludeTax } : {}),
      ...(discount ? { discount } : {}),
      ...(paid !== undefined ? { paid } : {}),
    });
  const money = (n: Minor) => formatMoney(n, currency, locale);
  const row = (key: string, name: string, value: string, mod?: string, note?: string) => (
    <div key={key} className={cx("fg-fin-trow", mod && `fg-fin-trow-${mod}`)}>
      <dt>{name}</dt>
      <dd>
        {note ? <span className="fg-fin-tnote">{note}</span> : null}
        {value}
      </dd>
    </div>
  );
  const rows = [];
  if (!hideEmpty || sums.discounts !== 0)
    rows.push(row("subtotal", t.subtotal, money(sums.subtotal)));
  if (sums.discounts !== 0)
    rows.push(row("discounts", t.discounts, money(-sums.discounts), "discount"));
  if (!sums.pricesIncludeTax) {
    if (sums.taxes.length > 0 && sums.taxes.some((x) => x.amount !== 0 || x.rate !== 0))
      rows.push(row("net", t.net, money(sums.net)));
    for (const x of sums.taxes)
      if (x.rate !== 0 || x.amount !== 0)
        rows.push(
          row(`tax-${x.rate}`, taxLabel(x.rate), money(x.amount), "tax", `on ${money(x.base)}`),
        );
  }
  rows.push(row("total", t.total, money(sums.total), "total"));
  if (sums.pricesIncludeTax)
    for (const x of sums.taxes)
      if (x.rate !== 0 || x.amount !== 0)
        rows.push(
          row(`inc-${x.rate}`, `${t.included} ${taxLabel(x.rate)}`, money(x.amount), "tax"),
        );
  if (alwaysShowDue || sums.paid !== 0) {
    rows.push(row("paid", t.paid, money(-sums.paid), "paid"));
    rows.push(row("due", t.due, money(sums.due), sums.due > 0 ? "due" : "settled"));
  }
  return (
    <section className={cx("fg-fin-totals", className)} aria-label={label}>
      <dl className="fg-fin-tlist">{rows}</dl>
      {footer ? <div className="fg-fin-tfoot">{footer}</div> : null}
    </section>
  );
}
