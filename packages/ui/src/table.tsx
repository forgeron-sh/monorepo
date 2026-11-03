import type { Key, ReactNode } from "react";
import { cx } from "./cx";

export interface TableColumn<Row> {
  /** Identifies the column; also the default cell content (`row[key]`). */
  key: string;
  header: ReactNode;
  align?: "start" | "end";
  /** Mono font (identifiers, amounts). */
  mono?: boolean;
  render?: (row: Row) => ReactNode;
}

export interface TableProps<Row> {
  columns: ReadonlyArray<TableColumn<Row>>;
  rows: ReadonlyArray<Row>;
  rowKey: (row: Row) => Key;
  /** Makes rows keyboard-focusable buttons. */
  onRowClick?: (row: Row) => void;
  /** Shown when `rows` is empty. */
  empty?: ReactNode;
  className?: string;
}

/** Data table, 44px rows, header in `Label` style. */
export function Table<Row>({
  columns,
  rows,
  rowKey,
  onRowClick,
  empty = "Nothing to show",
  className,
}: TableProps<Row>) {
  return (
    <div className={cx("fg-table-wrap", className)}>
      <table className="fg-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className={cx(c.align === "end" && "fg-end")}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="fg-table-empty" colSpan={columns.length}>
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={rowKey(row)}
                className={cx(onRowClick && "fg-table-click")}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cx(c.align === "end" && "fg-end", c.mono && "fg-mono")}
                  >
                    {c.render ? c.render(row) : (cell(row, c.key) as ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function cell(row: unknown, key: string): unknown {
  const value = (row as Record<string, unknown>)[key];
  return typeof value === "string" || typeof value === "number" ? value : undefined;
}
