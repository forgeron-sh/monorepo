import type {
  HTMLAttributes,
  Key,
  ReactNode,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";
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
  /** Names the table for assistive technology, when no heading does. */
  label?: string;
  className?: string;
}

/** `columns` stays undefined: with columns, `Table` is the data one. */
export type TableRootProps = TableHTMLAttributes<HTMLTableElement> & {
  columns?: undefined;
  /** Classes of the scrolling frame around the `<table>`. */
  containerClassName?: string;
};

/**
 * With `columns` and `rows`: a data table, 44px rows, a mono header; a clickable row is a button on
 * Enter and Space. Without: the root of shadcn's parts (`TableHeader`, `TableBody`, `TableRow`,
 * `TableHead`, `TableCell`…), D-156.
 */
export function Table<Row>(props: TableProps<Row> | TableRootProps) {
  return props.columns !== undefined ? (
    <DataTable {...(props as TableProps<Row>)} />
  ) : (
    <TableRoot {...(props as TableRootProps)} />
  );
}

function TableRoot({ className, containerClassName, columns: _columns, ...rest }: TableRootProps) {
  return (
    <div className={cx("fg-table-wrap", containerClassName)}>
      <table {...rest} className={cx("fg-table", className)} />
    </div>
  );
}

type RowProps = HTMLAttributes<HTMLTableRowElement>;
type SectionProps = HTMLAttributes<HTMLTableSectionElement>;

export function TableHeader({ className, ...rest }: SectionProps) {
  return <thead {...rest} className={cx("fg-table-header", className)} />;
}
export function TableBody({ className, ...rest }: SectionProps) {
  return <tbody {...rest} className={cx("fg-table-body", className)} />;
}
export function TableFooter({ className, ...rest }: SectionProps) {
  return <tfoot {...rest} className={cx("fg-table-footer", className)} />;
}
export function TableRow({ className, ...rest }: RowProps) {
  return <tr {...rest} className={cx("fg-table-row", className)} />;
}
export function TableHead({ className, ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th {...rest} className={cx("fg-table-head", className)} />;
}
export function TableCell({ className, ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td {...rest} className={cx("fg-table-cell", className)} />;
}
export function TableCaption({ className, ...rest }: HTMLAttributes<HTMLTableCaptionElement>) {
  return <caption {...rest} className={cx("fg-table-caption", className)} />;
}

function DataTable<Row>({
  columns,
  rows,
  rowKey,
  onRowClick,
  empty = "Nothing to show",
  label,
  className,
}: TableProps<Row>) {
  return (
    <div className={cx("fg-table-wrap", className)}>
      <table className="fg-table" aria-label={label}>
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
