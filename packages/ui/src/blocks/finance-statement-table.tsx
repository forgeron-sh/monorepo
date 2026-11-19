// A ledger: entries in sections with the balance running after each, a subtotal closing every
// section and a total at the end. Built on the look of the data grid; signed amounts carry their
// sign in text as well as their tone. Exports through a hook (CSV by default).

import { Download03Icon } from "@forgeron/icons";
import type { ReactNode } from "react";
import { Button } from "../button";
import { cx } from "../cx";
import { Icon } from "../icon";
import { formatMoney, minorDigits } from "../numbers";
import { AmountBadge } from "./finance-parts";
import {
  buildStatement,
  statementToCsv,
  type Minor,
  type StatementEntry,
  type StatementOptions,
  type StatementRow,
} from "./finance-model";

export interface StatementTableProps extends StatementOptions {
  /** Names the table. Default "Statement". */
  label?: string;
  entries: ReadonlyArray<StatementEntry>;
  currency: string;
  locale?: string;
  /** Hides the running balance column. Default `true` (shown). */
  showBalance?: boolean;
  showReference?: boolean;
  /** Money out is the normal thing (expenses): swaps the colours, the signs stay. */
  invert?: boolean;
  /** An entry is a button: Enter or a click opens it. */
  onOpenEntry?: (entry: StatementEntry) => void;
  /** Adds an Export button. Hears the rows and the CSV of them; saving the file is yours. */
  onExport?: (payload: { rows: StatementRow[]; csv: string }) => void;
  exportLabel?: string;
  openingLabel?: string;
  empty?: ReactNode;
  className?: string;
  toolbar?: ReactNode;
}

/** A ledger with a running balance, sections, subtotals and a total. */
export function StatementTable({
  label = "Statement",
  entries,
  currency,
  locale,
  opening = 0,
  grouped,
  sort,
  totalLabel,
  subtotalLabel,
  showBalance = true,
  showReference = true,
  invert = false,
  onOpenEntry,
  onExport,
  exportLabel = "Export CSV",
  openingLabel = "Opening balance",
  empty = "No entry",
  className,
  toolbar,
}: StatementTableProps) {
  const rows = buildStatement(entries, {
    opening,
    ...(grouped !== undefined ? { grouped } : {}),
    ...(sort ? { sort } : {}),
    ...(totalLabel ? { totalLabel } : {}),
    ...(subtotalLabel ? { subtotalLabel } : {}),
  });
  const span = 3 + (showReference ? 1 : 0) + (showBalance ? 1 : 0);
  const money = (n: Minor) => formatMoney(n, currency, locale);
  const balanceCell = (n: Minor) => <td className="fg-fin-end fg-fin-bal">{money(n)}</td>;
  return (
    <div className={cx("fg-fin-stmt", className)}>
      {onExport || toolbar ? (
        <div className="fg-fin-stmt-bar">
          {toolbar}
          <span className="fg-fin-gap" />
          {onExport ? (
            <Button
              size="sm"
              onClick={() => {
                const csv = statementToCsv(rows, { digits: minorDigits(currency), openingLabel });
                onExport({ rows, csv });
              }}
            >
              <Icon icon={Download03Icon} size={12} variant="mono" />
              {exportLabel}
            </Button>
          ) : null}
        </div>
      ) : null}
      <div className="fg-grid-wrap fg-fin-stmt-wrap" tabIndex={0} role="region" aria-label={label}>
        <table className="fg-grid fg-fin-stmt-table">
          <thead>
            <tr>
              <th scope="col">
                <span className="fg-grid-sort fg-grid-plain">Date</span>
              </th>
              <th scope="col">
                <span className="fg-grid-sort fg-grid-plain">Description</span>
              </th>
              {showReference ? (
                <th scope="col">
                  <span className="fg-grid-sort fg-grid-plain">Reference</span>
                </th>
              ) : null}
              <th scope="col" className="fg-end">
                <span className="fg-grid-sort fg-grid-plain fg-fin-endhead">Amount</span>
              </th>
              {showBalance ? (
                <th scope="col" className="fg-end">
                  <span className="fg-grid-sort fg-grid-plain fg-fin-endhead">Balance</span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td className="fg-table-empty" colSpan={span}>
                  {empty}
                </td>
              </tr>
            ) : null}
            {entries.length > 0 &&
              rows.map((row, i) => {
                if (row.kind === "opening")
                  return (
                    <tr key={i} className="fg-fin-r-opening">
                      <th scope="row" colSpan={2 + (showReference ? 1 : 0) + 1}>
                        {openingLabel}
                      </th>
                      {showBalance ? balanceCell(row.balance) : null}
                    </tr>
                  );
                if (row.kind === "group")
                  return (
                    <tr key={i} className="fg-fin-r-group">
                      <th scope="rowgroup" colSpan={span}>
                        {row.label || "Other"}
                      </th>
                    </tr>
                  );
                if (row.kind === "entry") {
                  const e = row.entry;
                  const open = onOpenEntry;
                  return (
                    <tr
                      key={i}
                      className={cx(open && "fg-table-click")}
                      tabIndex={open ? 0 : undefined}
                      onClick={open ? () => open(e) : undefined}
                      onKeyDown={
                        open
                          ? (ev) => {
                              if (ev.key === "Enter" || ev.key === " ") {
                                ev.preventDefault();
                                open(e);
                              }
                            }
                          : undefined
                      }
                    >
                      <td className="fg-fin-date">{e.date}</td>
                      <td className="fg-fin-desc-cell">{e.description}</td>
                      {showReference ? <td className="fg-fin-ref">{e.reference ?? ""}</td> : null}
                      <td className="fg-end">
                        <AmountBadge
                          amount={e.amount}
                          currency={currency}
                          invert={invert}
                          {...(locale ? { locale } : {})}
                        />
                      </td>
                      {showBalance ? balanceCell(row.balance) : null}
                    </tr>
                  );
                }
                return (
                  <tr
                    key={i}
                    className={row.kind === "total" ? "fg-fin-r-total" : "fg-fin-r-subtotal"}
                  >
                    <th scope="row" colSpan={2 + (showReference ? 1 : 0)}>
                      {row.label}
                    </th>
                    <td className="fg-end">
                      <AmountBadge
                        amount={row.amount}
                        currency={currency}
                        invert={invert}
                        {...(locale ? { locale } : {})}
                      />
                    </td>
                    {showBalance ? balanceCell(row.balance) : null}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
