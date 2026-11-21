// Who may do what: subjects (people, teams) down the side, permissions (an action on a resource)
// across the top, and in each cell one of three states: allow, deny, or inherit. A click, Space or
// Enter cycles a cell; a header sets the whole row or column; the keys A, D and I set a cell. It
// is a grid for the keyboard (arrows, Home, End, Page keys), its headers stay in view, and a text
// summary says the same in words. There is no role here: a subject holds states, and what it does
// not hold it inherits.
//
// A root with parts. Without children it draws the usual block; with children, they place its
// regions: `PermissionMatrixBar` (`PermissionMatrixLegend`, `PermissionMatrixChanges`),
// `PermissionMatrixGrid`, `PermissionMatrixKeys`, `PermissionMatrixSummary`.

import {
  Cancel01Icon,
  MinusSignIcon,
  Tick02Icon,
  ArrowDown01Icon,
  ArrowRight01Icon,
} from "@forgeron/icons";
import type { ComponentProps, KeyboardEvent, ReactNode } from "react";
import { createContext, useContext, useId, useState } from "react";
import { Avatar } from "../avatar";
import { cx } from "../cx";
import { useCollection } from "../hooks/use-collection";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "../table";
import {
  bulkTarget,
  columnCells,
  gridMove,
  nextPermissionState,
  PERMISSION_NAMES,
  permissionAt,
  permissionDiff,
  permissionSummary,
  rowCells,
  setPermission,
  setPermissions,
  sharedState,
  adminPlural,
  type PermissionColumn,
  type PermissionState,
  type PermissionSubject,
  type PermissionValue,
} from "./admin-model";

export interface PermissionMatrixProps {
  /** Names the grid for assistive technology: "Permissions of the workspace". */
  label: string;
  subjects: ReadonlyArray<PermissionSubject>;
  columns: ReadonlyArray<PermissionColumn>;
  /** The states that are not inherited, by cell (`permissionKey`). Absent cells inherit. */
  value?: PermissionValue;
  defaultValue?: PermissionValue;
  onChange?: (value: PermissionValue) => void;
  /** The saved value: cells that differ from it are marked as unsaved changes. */
  saved?: PermissionValue;
  /** Shows the grid and no way to change it. */
  readOnly?: boolean;
  /**
   * What an inherited cell comes to (from a team, a default): shown faded in the cell. Return
   * nothing when the cell resolves to nothing.
   */
  inherited?: (subjectId: string, columnId: string) => "allow" | "deny" | undefined;
  /** Height in px after which the grid scrolls, its headers staying in view. Default 420. */
  maxHeight?: number;
  /** The text summary starts open. */
  summaryOpen?: boolean;
  /** The header of the first column. Default "People and teams". */
  subjectLabel?: string;
  /** The words for the three states. */
  stateNames?: Partial<Record<PermissionState, string>>;
  /** The regions of the block; without them, the bar, the grid, the keys and the summary. */
  children?: ReactNode;
  className?: string;
}

const cellId = (row: number, col: number) => `${row}:${col}`;

const ICONS = { allow: Tick02Icon, deny: Cancel01Icon, inherit: MinusSignIcon } as const;

function Mark({
  state,
  ghost,
}: {
  state: PermissionState | "mixed";
  ghost?: "allow" | "deny" | undefined;
}) {
  const shown = state === "inherit" && ghost ? ghost : state;
  if (shown === "mixed")
    return <span className="fg-adm-mark fg-adm-mark-mixed" aria-hidden="true" />;
  return (
    <span
      className={cx(
        "fg-adm-mark",
        `fg-adm-mark-${shown}`,
        state === "inherit" && "fg-adm-mark-ghost",
      )}
      aria-hidden="true"
    >
      {state === "inherit" && !ghost ? (
        <span className="fg-adm-dot" />
      ) : (
        <Icon icon={ICONS[shown]} size={12} variant="mono" />
      )}
    </span>
  );
}

interface MatrixContext {
  label: string;
  subjects: ReadonlyArray<PermissionSubject>;
  columns: ReadonlyArray<PermissionColumn>;
  grid: PermissionValue;
  readOnly: boolean;
  inherited: PermissionMatrixProps["inherited"];
  maxHeight: number;
  subjectLabel: string;
  names: Record<PermissionState, string>;
  id: string;
  size: { rows: number; cols: number };
  collection: ReturnType<typeof useCollection<{ row: number; col: number }>>;
  item: (row: number, col: number) => ReturnType<MatrixContext["collection"]["getItemProps"]>;
  changes: ReturnType<typeof permissionDiff>;
  changed: ReadonlySet<string>;
  subjectName: (id: string) => string;
  colName: (id: string) => string;
  activate: (row: number, col: number) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  summaryOpen: boolean;
  setSummaryOpen: (open: boolean) => void;
  said: string;
}

const Ctx = createContext<MatrixContext | null>(null);

/** The grid and what it knows, for a part of your own inside a `PermissionMatrix`. */
export function usePermissionMatrix(part = "usePermissionMatrix"): MatrixContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error(`<${part}> goes inside a <PermissionMatrix>.`);
  return ctx;
}

/** A grid of subjects by permissions: allow, deny or inherit, in bulk by row and column. */
export function PermissionMatrix({
  label,
  subjects,
  columns,
  value,
  defaultValue = {},
  onChange,
  saved,
  readOnly = false,
  inherited,
  maxHeight = 420,
  summaryOpen = false,
  subjectLabel = "People and teams",
  stateNames,
  children,
  className,
}: PermissionMatrixProps) {
  const [grid, setGrid] = useControllableState<PermissionValue>({ value, defaultValue, onChange });
  const names = { ...PERMISSION_NAMES, ...stateNames };
  const id = useId();
  const [open, setOpen] = useState(summaryOpen);
  const [said, setSaid] = useState("");
  const size = { rows: subjects.length + 1, cols: columns.length + 1 };
  // Every header and cell but the corner is an item of the collection: it keeps the one tab stop
  // and moves the focus, while `gridMove` says where an arrow, Home or a Page key goes.
  const [focused, setFocused] = useState<string | null>(cellId(1, 1));
  const cells = Array.from({ length: size.rows * size.cols }, (_, i) => ({
    row: Math.floor(i / size.cols),
    col: i % size.cols,
  })).filter((c) => c.row > 0 || c.col > 0);
  const collection = useCollection({
    items: cells,
    getId: (c) => cellId(c.row, c.col),
    selectionMode: "none",
    orientation: "grid",
    columns: size.cols,
    focused,
    onFocusedChange: setFocused,
  });
  const item = (row: number, col: number) => collection.getItemProps(cellId(row, col));
  const changes = saved ? permissionDiff(saved, grid, subjects, columns) : [];
  const changed = new Set(changes.map((c) => `${c.subjectId}\u0000${c.columnId}`));
  const subjectName = (sid: string) => subjects.find((s) => s.id === sid)?.name ?? sid;
  const column = (cid: string) => columns.find((c) => c.id === cid);
  const colName = (cid: string) => {
    const c = column(cid);
    return c ? (c.group ? `${c.group} ${c.label}` : c.label) : cid;
  };

  const setCell = (sid: string, cid: string, state: PermissionState) => {
    if (readOnly) return;
    setGrid(setPermission(grid, sid, cid, state));
    setSaid(`${subjectName(sid)}, ${colName(cid)}: ${names[state].toLowerCase()}.`);
  };

  const setMany = (cells: Array<[string, string]>, what: string) => {
    if (readOnly || cells.length === 0) return;
    const target = bulkTarget(sharedState(grid, cells));
    setGrid(setPermissions(grid, cells, target));
    setSaid(`${what}: ${names[target].toLowerCase()}.`);
  };

  const activate = (row: number, col: number) => {
    if (row === 0 && col > 0) {
      const c = columns[col - 1]!;
      setMany(columnCells(c.id, subjects), colName(c.id));
    } else if (col === 0 && row > 0) {
      const s = subjects[row - 1]!;
      setMany(rowCells(s.id, columns), s.name);
    } else if (row > 0 && col > 0) {
      const s = subjects[row - 1]!;
      const c = columns[col - 1]!;
      setCell(s.id, c.id, nextPermissionState(permissionAt(grid, s.id, c.id)));
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-r]");
    if (!target || event.altKey || event.metaKey) return;
    const row = Number(target.dataset.r);
    const col = Number(target.dataset.c);
    const move = gridMove({ row, col }, event.key, size, event.ctrlKey);
    if (move) {
      event.preventDefault();
      if (move.row === 0 && move.col === 0) return;
      collection.focus(cellId(move.row, move.col));
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activate(row, col);
      return;
    }
    if (row > 0 && col > 0) {
      const s = subjects[row - 1]!;
      const c = columns[col - 1]!;
      const k = event.key.toLowerCase();
      const state: PermissionState | null =
        k === "a"
          ? "allow"
          : k === "d"
            ? "deny"
            : k === "i" || k === "backspace" || k === "delete"
              ? "inherit"
              : null;
      if (state) {
        event.preventDefault();
        setCell(s.id, c.id, state);
      }
    }
  };

  const ctx: MatrixContext = {
    label,
    subjects,
    columns,
    grid,
    readOnly,
    inherited,
    maxHeight,
    subjectLabel,
    names,
    id,
    size,
    collection,
    item,
    changes,
    changed,
    subjectName,
    colName,
    activate,
    onKeyDown,
    summaryOpen: open,
    setSummaryOpen: setOpen,
    said,
  };

  return (
    <Ctx.Provider value={ctx}>
      <div data-slot="permission-matrix" className={cx("fg-adm fg-adm-pm", className)}>
        {children ?? (
          <>
            <PermissionMatrixBar />
            <PermissionMatrixGrid />
            <PermissionMatrixKeys />
            <PermissionMatrixSummary />
            <PermissionMatrixStatus />
          </>
        )}
      </div>
    </Ctx.Provider>
  );
}

/** The top row: the legend and the count of unsaved changes. Its children replace both. */
export function PermissionMatrixBar({ className, children, ...rest }: ComponentProps<"div">) {
  return (
    <div data-slot="permission-matrix-bar" {...rest} className={cx("fg-adm-pm-bar", className)}>
      {children ?? (
        <>
          <PermissionMatrixLegend />
          <PermissionMatrixChanges />
        </>
      )}
    </div>
  );
}

/** What the three marks mean. */
export function PermissionMatrixLegend({ className, ...rest }: ComponentProps<"ul">) {
  const { names } = usePermissionMatrix("PermissionMatrixLegend");
  return (
    <ul
      data-slot="permission-matrix-legend"
      aria-label="Legend"
      {...rest}
      className={cx("fg-adm-legend", className)}
    >
      {(["allow", "deny", "inherit"] as const).map((s) => (
        <li key={s}>
          <Mark state={s} />
          {names[s]}
        </li>
      ))}
    </ul>
  );
}

/** "2 unsaved changes", said politely. */
export function PermissionMatrixChanges({ className, ...rest }: ComponentProps<"span">) {
  const { changes } = usePermissionMatrix("PermissionMatrixChanges");
  return (
    <span
      data-slot="permission-matrix-changes"
      role="status"
      {...rest}
      className={cx("fg-adm-pm-changes", className)}
    >
      {changes.length ? `${adminPlural(changes.length, "unsaved change")}` : ""}
    </span>
  );
}

/** The grid: a scrolling table whose headers stay in view, for the keyboard. */
export function PermissionMatrixGrid({ className, ...rest }: ComponentProps<"div">) {
  const {
    label,
    subjects,
    columns,
    grid,
    readOnly,
    inherited,
    maxHeight,
    subjectLabel,
    names,
    id,
    size,
    collection,
    item,
    changed,
    colName,
    activate,
    onKeyDown,
  } = usePermissionMatrix("PermissionMatrixGrid");
  return (
    <div
      data-slot="permission-matrix-grid"
      {...rest}
      className={cx("fg-adm-pm-scroll", className)}
      style={{ maxHeight, ...rest.style }}
    >
      <table
        {...collection.getContainerProps({ onKeyDown })}
        role="grid"
        aria-label={label}
        aria-readonly={readOnly || undefined}
        aria-rowcount={size.rows}
        aria-colcount={size.cols}
        aria-describedby={`${id}-keys`}
        className="fg-adm-pm-table"
      >
        <TableHeader>
          <TableRow>
            <TableHead className="fg-adm-pm-corner" scope="col">
              {subjectLabel}
            </TableHead>
            {columns.map((c, i) => {
              const shared = sharedState(grid, columnCells(c.id, subjects));
              return (
                <TableHead
                  key={c.id}
                  scope="col"
                  data-r={0}
                  data-c={i + 1}
                  aria-label={`${colName(c.id)}, column${readOnly ? "" : ", Enter sets all"}`}
                  className="fg-adm-pm-colhead"
                  {...item(0, i + 1)}
                  onClick={() => activate(0, i + 1)}
                >
                  {c.group ? <span className="fg-adm-pm-group">{c.group}</span> : null}
                  <span className="fg-adm-pm-action">
                    {c.label}
                    <Mark state={shared} />
                  </span>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {subjects.map((s, r) => {
            const shared = sharedState(grid, rowCells(s.id, columns));
            return (
              <TableRow key={s.id}>
                <TableHead
                  scope="row"
                  data-r={r + 1}
                  data-c={0}
                  aria-label={`${s.name}${s.kind ? `, ${s.kind}` : ""}${readOnly ? "" : ", Enter sets all"}`}
                  className="fg-adm-pm-rowhead"
                  {...item(r + 1, 0)}
                  onClick={() => activate(r + 1, 0)}
                >
                  <span className="fg-adm-pm-rowinner">
                    <Avatar name={s.name} size={20} />
                    <span className="fg-adm-pm-name">
                      <span>{s.name}</span>
                      {s.hint ? <span className="fg-adm-pm-hint">{s.hint}</span> : null}
                    </span>
                    <Mark state={shared} />
                  </span>
                </TableHead>
                {columns.map((c, i) => {
                  const state = permissionAt(grid, s.id, c.id);
                  const ghost = state === "inherit" ? inherited?.(s.id, c.id) : undefined;
                  const isChanged = changed.has(`${s.id}\u0000${c.id}`);
                  return (
                    <TableCell
                      key={c.id}
                      role="gridcell"
                      data-r={r + 1}
                      data-c={i + 1}
                      data-state={state}
                      data-changed={isChanged || undefined}
                      aria-readonly={readOnly || undefined}
                      aria-label={`${s.name}, ${colName(c.id)}: ${names[state]}${
                        ghost ? ` (${names[ghost].toLowerCase()})` : ""
                      }${isChanged ? ", unsaved change" : ""}`}
                      className={cx(
                        "fg-adm-pm-cell",
                        isChanged && "fg-adm-pm-changed",
                        readOnly && "fg-adm-pm-ro",
                      )}
                      {...item(r + 1, i + 1)}
                      onClick={() => activate(r + 1, i + 1)}
                    >
                      <Mark state={state} ghost={ghost} />
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </table>
    </div>
  );
}

/** What the keys do, in a sentence; the grid is described by it. */
export function PermissionMatrixKeys({ className, ...rest }: ComponentProps<"p">) {
  const { id, readOnly } = usePermissionMatrix("PermissionMatrixKeys");
  return (
    <p
      data-slot="permission-matrix-keys"
      id={`${id}-keys`}
      {...rest}
      className={cx("fg-adm-pm-keys", className)}
    >
      {readOnly
        ? "Read only. Arrows move between cells."
        : "Arrows move. Space or Enter cycles a cell, or sets a whole row or column from its header. A allows, D denies, I inherits."}
    </p>
  );
}

/** The grid said in words, behind a "Text summary" button. */
export function PermissionMatrixSummary({ className, ...rest }: ComponentProps<"div">) {
  const {
    id,
    grid,
    subjects,
    columns,
    changes,
    names,
    summaryOpen,
    setSummaryOpen,
    subjectName,
    colName,
  } = usePermissionMatrix("PermissionMatrixSummary");
  const summary = permissionSummary(grid, subjects, columns);
  return (
    <div
      data-slot="permission-matrix-summary"
      {...rest}
      className={cx("fg-adm-pm-summary", className)}
    >
      <button
        type="button"
        className="fg-adm-disclosure"
        aria-expanded={summaryOpen}
        aria-controls={`${id}-summary`}
        onClick={() => setSummaryOpen(!summaryOpen)}
      >
        <Icon icon={summaryOpen ? ArrowDown01Icon : ArrowRight01Icon} size={12} variant="mono" />
        Text summary
      </button>
      {summaryOpen ? (
        <div id={`${id}-summary`} className="fg-adm-pm-summary-body">
          <ul>
            {summary.map((x) => (
              <li key={x.subjectId}>{x.text}</li>
            ))}
          </ul>
          {changes.length ? (
            <>
              <p className="fg-adm-pm-summary-title">Unsaved changes</p>
              <ul>
                {changes.map((c) => (
                  <li key={`${c.subjectId}${c.columnId}`}>
                    {subjectName(c.subjectId)}, {colName(c.columnId)}: {names[c.from].toLowerCase()}{" "}
                    to {names[c.to].toLowerCase()}.
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** The live line that says what a key changed. */
export function PermissionMatrixStatus({ className, ...rest }: ComponentProps<"span">) {
  const { said } = usePermissionMatrix("PermissionMatrixStatus");
  return (
    <span
      data-slot="permission-matrix-status"
      role="status"
      aria-live="polite"
      {...rest}
      className={cx("fg-sr", className)}
    >
      {said}
    </span>
  );
}
