// Who may do what: subjects (people, teams) down the side, permissions (an action on a resource)
// across the top, and in each cell one of three states: allow, deny, or inherit. A click, Space or
// Enter cycles a cell; a header sets the whole row or column; the keys A, D and I set a cell. It
// is a grid for the keyboard (arrows, Home, End, Page keys), its headers stay in view, and a text
// summary says the same in words. There is no role here: a subject holds states, and what it does
// not hold it inherits.

import {
  Cancel01Icon,
  MinusSignIcon,
  Tick02Icon,
  ArrowDown01Icon,
  ArrowRight01Icon,
} from "@forgeron/icons";
import type { KeyboardEvent } from "react";
import { useId, useRef, useState } from "react";
import { Avatar } from "../avatar";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
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
  className?: string;
}

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
  className,
}: PermissionMatrixProps) {
  const [grid, setGrid] = useControllableState<PermissionValue>({ value, defaultValue, onChange });
  const names = { ...PERMISSION_NAMES, ...stateNames };
  const id = useId();
  const table = useRef<HTMLTableElement>(null);
  const [pos, setPos] = useState({ row: 1, col: 1 });
  const [open, setOpen] = useState(summaryOpen);
  const [said, setSaid] = useState("");
  const size = { rows: subjects.length + 1, cols: columns.length + 1 };
  const at = {
    row: Math.min(pos.row, Math.max(size.rows - 1, 0)),
    col: Math.min(pos.col, Math.max(size.cols - 1, 0)),
  };
  const changes = saved ? permissionDiff(saved, grid, subjects, columns) : [];
  const changed = new Set(changes.map((c) => `${c.subjectId}\u0000${c.columnId}`));
  const subjectName = (sid: string) => subjects.find((s) => s.id === sid)?.name ?? sid;
  const column = (cid: string) => columns.find((c) => c.id === cid);
  const colName = (cid: string) => {
    const c = column(cid);
    return c ? (c.group ? `${c.group} ${c.label}` : c.label) : cid;
  };

  const focusCell = (row: number, col: number) => {
    setPos({ row, col });
    table.current?.querySelector<HTMLElement>(`[data-r="${row}"][data-c="${col}"]`)?.focus();
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

  const onKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-r]");
    if (!target || event.altKey || event.metaKey) return;
    const row = Number(target.dataset.r);
    const col = Number(target.dataset.c);
    const move = gridMove({ row, col }, event.key, size, event.ctrlKey);
    if (move) {
      event.preventDefault();
      if (move.row === 0 && move.col === 0) return;
      focusCell(move.row, move.col);
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

  const summary = permissionSummary(grid, subjects, columns);

  return (
    <div className={cx("fg-adm fg-adm-pm", className)}>
      <div className="fg-adm-pm-bar">
        <ul className="fg-adm-legend" aria-label="Legend">
          {(["allow", "deny", "inherit"] as const).map((s) => (
            <li key={s}>
              <Mark state={s} />
              {names[s]}
            </li>
          ))}
        </ul>
        <span className="fg-adm-pm-changes" role="status">
          {changes.length ? `${adminPlural(changes.length, "unsaved change")}` : ""}
        </span>
      </div>
      <div className="fg-adm-pm-scroll" style={{ maxHeight }}>
        <table
          ref={table}
          role="grid"
          aria-label={label}
          aria-readonly={readOnly || undefined}
          aria-rowcount={size.rows}
          aria-colcount={size.cols}
          aria-describedby={`${id}-keys`}
          className="fg-adm-pm-table"
          onKeyDown={onKeyDown}
        >
          <thead>
            <tr>
              <th className="fg-adm-pm-corner" scope="col">
                {subjectLabel}
              </th>
              {columns.map((c, i) => {
                const shared = sharedState(grid, columnCells(c.id, subjects));
                return (
                  <th
                    key={c.id}
                    scope="col"
                    data-r={0}
                    data-c={i + 1}
                    tabIndex={at.row === 0 && at.col === i + 1 ? 0 : -1}
                    aria-label={`${colName(c.id)}, column${readOnly ? "" : ", Enter sets all"}`}
                    className="fg-adm-pm-colhead"
                    onFocus={() => setPos({ row: 0, col: i + 1 })}
                    onClick={() => activate(0, i + 1)}
                  >
                    {c.group ? <span className="fg-adm-pm-group">{c.group}</span> : null}
                    <span className="fg-adm-pm-action">
                      {c.label}
                      <Mark state={shared} />
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {subjects.map((s, r) => {
              const shared = sharedState(grid, rowCells(s.id, columns));
              return (
                <tr key={s.id}>
                  <th
                    scope="row"
                    data-r={r + 1}
                    data-c={0}
                    tabIndex={at.row === r + 1 && at.col === 0 ? 0 : -1}
                    aria-label={`${s.name}${s.kind ? `, ${s.kind}` : ""}${readOnly ? "" : ", Enter sets all"}`}
                    className="fg-adm-pm-rowhead"
                    onFocus={() => setPos({ row: r + 1, col: 0 })}
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
                  </th>
                  {columns.map((c, i) => {
                    const state = permissionAt(grid, s.id, c.id);
                    const ghost = state === "inherit" ? inherited?.(s.id, c.id) : undefined;
                    const isChanged = changed.has(`${s.id}\u0000${c.id}`);
                    return (
                      <td
                        key={c.id}
                        role="gridcell"
                        data-r={r + 1}
                        data-c={i + 1}
                        data-state={state}
                        data-changed={isChanged || undefined}
                        tabIndex={at.row === r + 1 && at.col === i + 1 ? 0 : -1}
                        aria-readonly={readOnly || undefined}
                        aria-label={`${s.name}, ${colName(c.id)}: ${names[state]}${
                          ghost ? ` (${names[ghost].toLowerCase()})` : ""
                        }${isChanged ? ", unsaved change" : ""}`}
                        className={cx(
                          "fg-adm-pm-cell",
                          isChanged && "fg-adm-pm-changed",
                          readOnly && "fg-adm-pm-ro",
                        )}
                        onFocus={() => setPos({ row: r + 1, col: i + 1 })}
                        onClick={() => activate(r + 1, i + 1)}
                      >
                        <Mark state={state} ghost={ghost} />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p id={`${id}-keys`} className="fg-adm-pm-keys">
        {readOnly
          ? "Read only. Arrows move between cells."
          : "Arrows move. Space or Enter cycles a cell, or sets a whole row or column from its header. A allows, D denies, I inherits."}
      </p>
      <div className="fg-adm-pm-summary">
        <button
          type="button"
          className="fg-adm-disclosure"
          aria-expanded={open}
          aria-controls={`${id}-summary`}
          onClick={() => setOpen(!open)}
        >
          <Icon icon={open ? ArrowDown01Icon : ArrowRight01Icon} size={12} variant="mono" />
          Text summary
        </button>
        {open ? (
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
                      {subjectName(c.subjectId)}, {colName(c.columnId)}:{" "}
                      {names[c.from].toLowerCase()} to {names[c.to].toLowerCase()}.
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
      <span className="fg-sr" role="status" aria-live="polite">
        {said}
      </span>
    </div>
  );
}
