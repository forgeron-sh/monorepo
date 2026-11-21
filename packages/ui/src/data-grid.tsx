import type {
  HTMLAttributes,
  KeyboardEvent,
  ReactNode,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";
import { cx } from "./cx";
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "./pagination";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

export type ConstraintKind = "primary" | "notNull" | "unique" | "foreignKey" | "masked";

const CHIP_LABEL: Record<ConstraintKind, string> = {
  primary: "Primary",
  notNull: "Not null",
  unique: "Unique",
  foreignKey: "Foreign key",
  masked: "Masked",
};

export interface ConstraintChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, "className"> {
  kind: ConstraintKind;
  /** More about the constraint (the table a foreign key points at), as a tooltip. */
  title?: string;
  className?: string;
}

/** A constraint of a column, in words: `Primary`, `Not null`, `Unique`, `Foreign key`, `Masked`. */
export function ConstraintChip({ kind, title, className, ...rest }: ConstraintChipProps) {
  return (
    <span
      data-slot="constraint-chip"
      {...rest}
      className={cx("fg-chip", `fg-chip-${kind}`, className)}
      title={title}
    >
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

export interface DataGridProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "className" | "role" | "children"
> {
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

/** `columns` stays undefined: with columns, `DataGrid` is the data one. */
export type DataGridRootProps = Omit<HTMLAttributes<HTMLDivElement>, "role"> & {
  columns?: undefined;
  /** Names the grid for assistive technology. */
  label?: string;
};

export const cellText = (cell: GridCell) =>
  cell === null ? "" : typeof cell === "object" ? "" : String(cell);

/** The value of a cell: NULL and masked say what they are, never a value. */
export function DataGridValue({
  cell,
  className,
  ...rest
}: { cell: GridCell } & Omit<HTMLAttributes<HTMLSpanElement>, "children">) {
  if (cell !== null && typeof cell === "object") {
    return (
      <span
        data-slot="data-grid-value"
        {...rest}
        className={cx("fg-cell-masked", className)}
        title={cell.masked}
      >
        masked
      </span>
    );
  }
  if (cell === null) {
    return (
      <span data-slot="data-grid-value" {...rest} className={cx("fg-cell-null", className)}>
        NULL
      </span>
    );
  }
  return (
    <span data-slot="data-grid-value" {...rest} className={cx("fg-cell-text", className)}>
      {String(cell)}
    </span>
  );
}

/**
 * A data grid. With `columns` and `rows`: typed headers (name, type, constraint chips), sortable
 * columns, rows that open on Enter; stateless, the sort, the selection and the data belong to the
 * page. Without `columns`: the root of the parts (`DataGridHeader`, `DataGridHeaderCell`,
 * `DataGridBody`, `DataGridRow`, `DataGridCell`, `DataGridEmpty`), a focusable scrolling region
 * over a table.
 */
export function DataGrid(props: DataGridProps | DataGridRootProps) {
  return props.columns !== undefined ? (
    <DataGridTable {...(props as DataGridProps)} />
  ) : (
    <DataGridRoot {...(props as DataGridRootProps)} />
  );
}

function DataGridRoot({
  label,
  className,
  children,
  columns: _columns,
  ...rest
}: DataGridRootProps) {
  return (
    <div
      tabIndex={0}
      data-slot="data-grid"
      {...rest}
      role="region"
      aria-label={label ?? rest["aria-label"]}
      className={cx("fg-grid-wrap", className)}
    >
      <table className="fg-grid">{children}</table>
    </div>
  );
}

/** The header row: put `DataGridHeaderCell`s in it. */
export function DataGridHeader({ className, ...rest }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <TableHeader>
      <TableRow data-slot="data-grid-header" {...rest} className={className} />
    </TableHeader>
  );
}

export function DataGridBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <TableBody data-slot="data-grid-body" {...props} />;
}

export type DataGridHeaderCellProps = Omit<ThHTMLAttributes<HTMLTableCellElement>, "onClick"> & {
  /** The direction this column is sorted in; absent or `false`, not sorted. */
  sorted?: "ascending" | "descending" | false;
  /** Makes the header a button that asks for this column's sort. */
  onSort?: () => void;
  numeric?: boolean;
};

/** A column header: a sort button when `onSort` is set, plain otherwise. */
export function DataGridHeaderCell({
  sorted,
  onSort,
  numeric,
  className,
  children,
  ...rest
}: DataGridHeaderCellProps) {
  return (
    <TableHead
      scope="col"
      aria-sort={sorted || undefined}
      data-slot="data-grid-header-cell"
      {...rest}
      className={cx(numeric && "fg-end", className)}
    >
      {onSort ? (
        <button type="button" className="fg-grid-sort" onClick={onSort}>
          <span className="fg-grid-head">{children}</span>
          <span className="fg-grid-arrow" aria-hidden="true">
            {sorted === "descending" ? "↓" : sorted === "ascending" ? "↑" : ""}
          </span>
        </button>
      ) : (
        <span className="fg-grid-sort fg-grid-plain">
          <span className="fg-grid-head">{children}</span>
        </span>
      )}
    </TableHead>
  );
}

/** What a header says about a column: its name, its type and its constraint chips. */
export function DataGridColumnHead({ column }: { column: GridColumn }) {
  return (
    <>
      <span className="fg-grid-name">{column.name}</span>
      <span className="fg-grid-type">{column.type || "any"}</span>
      {column.chips?.length || column.masked ? (
        <span className="fg-grid-chips">
          {column.chips?.map((chip) => (
            <ConstraintChip key={chip.kind} kind={chip.kind} title={chip.title} />
          ))}
          {column.masked ? <ConstraintChip kind="masked" title={column.masked} /> : null}
        </span>
      ) : null}
    </>
  );
}

export type DataGridRowProps = HTMLAttributes<HTMLTableRowElement> & {
  /** Makes the row a button: a click, Enter or Space opens it. */
  onOpen?: () => void;
  selected?: boolean;
};

/** A row; focusable and opening when `onOpen` is set. */
export function DataGridRow({
  onOpen,
  selected,
  className,
  onClick,
  onKeyDown,
  ...rest
}: DataGridRowProps) {
  return (
    <TableRow
      tabIndex={onOpen ? 0 : undefined}
      aria-selected={selected}
      data-slot="data-grid-row"
      {...rest}
      className={cx(onOpen && "fg-table-click", selected && "fg-grid-selected", className)}
      onClick={(event) => {
        onClick?.(event);
        onOpen?.();
      }}
      onKeyDown={(event: KeyboardEvent<HTMLTableRowElement>) => {
        onKeyDown?.(event);
        if (onOpen && !event.defaultPrevented && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onOpen();
        }
      }}
    />
  );
}

export type DataGridCellProps = Omit<TdHTMLAttributes<HTMLTableCellElement>, "onDoubleClick"> & {
  numeric?: boolean;
  /** Double click: the cell's text, to copy. */
  onCopyText?: (text: string) => void;
  /** The value, when it is not `children`: draws it with `DataGridValue`. */
  cell?: GridCell;
};

export function DataGridCell({
  numeric,
  onCopyText,
  cell,
  className,
  children,
  ...rest
}: DataGridCellProps) {
  return (
    <TableCell
      data-slot="data-grid-cell"
      {...rest}
      className={cx(numeric && "fg-end", className)}
      onDoubleClick={
        onCopyText ? () => onCopyText(cell === undefined ? "" : cellText(cell)) : undefined
      }
    >
      {cell !== undefined ? <DataGridValue cell={cell} /> : children}
    </TableCell>
  );
}

export type DataGridEmptyProps = TdHTMLAttributes<HTMLTableCellElement>;

/** The row shown when there is no row: one cell across the grid. */
export function DataGridEmpty({ colSpan = 1000, className, ...rest }: DataGridEmptyProps) {
  return (
    <TableRow>
      <TableCell
        data-slot="data-grid-empty"
        {...rest}
        colSpan={colSpan}
        className={cx("fg-table-empty", className)}
      />
    </TableRow>
  );
}

function DataGridTable({
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
  ...rest
}: DataGridProps) {
  return (
    <DataGridRoot {...rest} label={label} className={className}>
      <DataGridHeader>
        {columns.map((column) => {
          const sorted = sort?.column === column.name;
          return (
            <DataGridHeaderCell
              key={column.name}
              numeric={column.numeric}
              sorted={sorted ? (sort!.descending ? "descending" : "ascending") : false}
              onSort={onSort && !column.masked ? () => onSort(column.name) : undefined}
            >
              <DataGridColumnHead column={column} />
            </DataGridHeaderCell>
          );
        })}
      </DataGridHeader>
      <DataGridBody>
        {rows.length === 0 ? (
          <DataGridEmpty colSpan={Math.max(columns.length, 1)}>{empty}</DataGridEmpty>
        ) : (
          rows.map((row, index) => (
            <DataGridRow
              key={index}
              onOpen={onOpenRow ? () => onOpenRow(index) : undefined}
              selected={selectedRow === undefined ? undefined : selectedRow === index}
            >
              {columns.map((column, at) => (
                <DataGridCell
                  key={column.name}
                  numeric={column.numeric}
                  cell={row[at] ?? null}
                  onCopyText={onCopyCell ? (text) => onCopyCell(text, column.name) : undefined}
                />
              ))}
            </DataGridRow>
          ))
        )}
      </DataGridBody>
    </DataGridRoot>
  );
}

export interface PagerProps extends Omit<
  HTMLAttributes<HTMLElement>,
  "className" | "children" | "onChange"
> {
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
  ...rest
}: PagerProps) {
  const from = count === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = (page - 1) * pageSize + count;
  return (
    <Pagination
      data-slot="pager"
      {...rest}
      className={cx("fg-pager", className)}
      aria-label="Pages"
    >
      <span className="fg-pager-range" aria-live="polite">
        {from}–{to}
        {total !== undefined && total >= 0 ? ` of ${total}` : ""}
      </span>
      {limitNote ? <span className="fg-pager-note">{limitNote}</span> : null}
      <PaginationContent className="fg-pager-buttons">
        <PaginationItem>
          <PaginationLink asChild size="sm">
            <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>
              Previous
            </button>
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink asChild size="sm">
            <button type="button" disabled={!hasMore} onClick={() => onPage(page + 1)}>
              Next
            </button>
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
