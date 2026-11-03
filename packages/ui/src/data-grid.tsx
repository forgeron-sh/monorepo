import type { ReactNode } from "react";
import { cx } from "./cx";

export type ConstraintKind = "primary" | "notNull" | "unique" | "foreignKey" | "masked";

const CHIP_LABEL: Record<ConstraintKind, string> = {
  primary: "Primary",
  notNull: "Not null",
  unique: "Unique",
  foreignKey: "Foreign key",
  masked: "Masked",
};

export interface ConstraintChipProps {
  kind: ConstraintKind;
  /** More about the constraint (the table a foreign key points at), as a tooltip. */
  title?: string;
  className?: string;
}

/** A constraint of a column, in words: `Primary`, `Not null`, `Unique`, `Foreign key`, `Masked`. */
export function ConstraintChip({ kind, title, className }: ConstraintChipProps) {
  return (
    <span className={cx("fg-chip", `fg-chip-${kind}`, className)} title={title}>
      {CHIP_LABEL[kind]}
    </span>
  );
}

/** A value of a cell. A masked cell says why instead of showing a value. */
export type GridCell = string | number | null | { masked: string };

export interface GridColumn {
  name: string;
  /** The declared type, in mono under the name. */
  type: string;
  chips?: ReadonlyArray<{ kind: ConstraintKind; title?: string }>;
  /** Why the column is masked; when set, its cells are not values. */
  masked?: string | null;
  numeric?: boolean;
}

export interface GridSort {
  column: string;
  descending: boolean;
}

export interface DataGridProps {
  /** Names the grid for assistive technology. */
  label: string;
  columns: ReadonlyArray<GridColumn>;
  rows: ReadonlyArray<ReadonlyArray<GridCell>>;
  sort?: GridSort;
  /** Sorting by a column; absent, headers are plain. */
  onSort?: (column: string) => void;
  /** A row is a button: Enter or a click opens it. */
  onOpenRow?: (index: number) => void;
  /** Double click on a cell: its text, to copy. */
  onCopyCell?: (text: string, column: string) => void;
  selectedRow?: number;
  empty?: ReactNode;
  className?: string;
}

export const cellText = (cell: GridCell) =>
  cell === null ? "" : typeof cell === "object" ? "" : String(cell);

function Cell({ cell }: { cell: GridCell }) {
  if (cell !== null && typeof cell === "object") {
    return (
      <span className="fg-cell-masked" title={cell.masked}>
        masked
      </span>
    );
  }
  if (cell === null) return <span className="fg-cell-null">NULL</span>;
  return <span className="fg-cell-text">{String(cell)}</span>;
}

/**
 * A data grid: typed headers (name, type, constraint chips), sortable columns, rows that open on
 * Enter. Stateless: the sort, the selection and the data belong to the page.
 */
export function DataGrid({
  label,
  columns,
  rows,
  sort,
  onSort,
  onOpenRow,
  onCopyCell,
  selectedRow,
  empty = "No rows",
  className,
}: DataGridProps) {
  return (
    <div className={cx("fg-grid-wrap", className)} tabIndex={0} role="region" aria-label={label}>
      <table className="fg-grid">
        <thead>
          <tr>
            {columns.map((column) => {
              const sorted = sort?.column === column.name;
              const head = (
                <>
                  <span className="fg-grid-name">{column.name}</span>
                  <span className="fg-grid-type">{column.type || "any"}</span>
                  {column.chips?.length || column.masked ? (
                    <span className="fg-grid-chips">
                      {column.chips?.map((chip) => (
                        <ConstraintChip key={chip.kind} kind={chip.kind} title={chip.title} />
                      ))}
                      {column.masked ? (
                        <ConstraintChip kind="masked" title={column.masked} />
                      ) : null}
                    </span>
                  ) : null}
                </>
              );
              return (
                <th
                  key={column.name}
                  scope="col"
                  className={cx(column.numeric && "fg-end")}
                  aria-sort={sorted ? (sort!.descending ? "descending" : "ascending") : undefined}
                >
                  {onSort && !column.masked ? (
                    <button
                      type="button"
                      className="fg-grid-sort"
                      onClick={() => onSort(column.name)}
                    >
                      <span className="fg-grid-head">{head}</span>
                      <span className="fg-grid-arrow" aria-hidden="true">
                        {sorted ? (sort!.descending ? "↓" : "↑") : ""}
                      </span>
                    </button>
                  ) : (
                    <span className="fg-grid-sort fg-grid-plain">
                      <span className="fg-grid-head">{head}</span>
                    </span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="fg-table-empty" colSpan={Math.max(columns.length, 1)}>
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr
                key={index}
                className={cx(
                  onOpenRow && "fg-table-click",
                  selectedRow === index && "fg-grid-selected",
                )}
                tabIndex={onOpenRow ? 0 : undefined}
                aria-selected={selectedRow === undefined ? undefined : selectedRow === index}
                onClick={onOpenRow ? () => onOpenRow(index) : undefined}
                onKeyDown={
                  onOpenRow
                    ? (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onOpenRow(index);
                        }
                      }
                    : undefined
                }
              >
                {columns.map((column, at) => (
                  <td
                    key={column.name}
                    className={cx(column.numeric && "fg-end")}
                    onDoubleClick={
                      onCopyCell
                        ? () => onCopyCell(cellText(row[at] ?? null), column.name)
                        : undefined
                    }
                  >
                    <Cell cell={row[at] ?? null} />
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

export interface PagerProps {
  /** 1-based. */
  page: number;
  pageSize: number;
  /** Rows on this page. */
  count: number;
  /** All rows that match, when known. */
  total?: number;
  hasMore: boolean;
  onPage: (page: number) => void;
  /** When the next page is past what the server pages, a way to narrow instead. */
  limitNote?: ReactNode;
  className?: string;
}

/** Previous and next, and where the page sits: "51–100 of 120". */
export function Pager({
  page,
  pageSize,
  count,
  total,
  hasMore,
  onPage,
  limitNote,
  className,
}: PagerProps) {
  const from = count === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = (page - 1) * pageSize + count;
  return (
    <nav className={cx("fg-pager", className)} aria-label="Pages">
      <span className="fg-pager-range" aria-live="polite">
        {from}–{to}
        {total !== undefined && total >= 0 ? ` of ${total}` : ""}
      </span>
      {limitNote ? <span className="fg-pager-note">{limitNote}</span> : null}
      <span className="fg-pager-buttons">
        <button
          type="button"
          className="fg-btn fg-btn-secondary fg-btn-sm"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </button>
        <button
          type="button"
          className="fg-btn fg-btn-secondary fg-btn-sm"
          disabled={!hasMore}
          onClick={() => onPage(page + 1)}
        >
          Next
        </button>
      </span>
    </nav>
  );
}
