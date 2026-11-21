// The records of a table as a sheet: one column per field, typed cells, edited in place. The
// keyboard works as in a spreadsheet: arrows move, Enter or F2 edits, typing replaces, Escape
// cancels, Tab and Enter commit and move on, Delete clears. Selects and relations open their
// picker in the cell; a checkbox toggles with Space.

import { Key01Icon, Maximize01Icon, MoreHorizontalIcon, PlusSignIcon } from "@forgeron/icons";
import type { KeyboardEvent, ReactNode } from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cx } from "../cx";
import { useCollection } from "../hooks/use-collection";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import { SelectMenu } from "../overlays";
import { LabelPicker } from "../pickers";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "../table";
import { ActionMenu, type ActionMenuEntry } from "../action-menu";
import { FieldTypeGlyph } from "./datahub-field-type";
import { RelationPicker } from "./datahub-relation-picker";
import { RecordFieldMark } from "./records-fields";
import {
  editText,
  fieldsFromSchema,
  listOf,
  parseValue,
  type CellValue,
  type DataField,
  type DataRecord,
  type FieldType,
  type RelationSources,
} from "./datahub-model";
import type { RecordFields } from "./records-model";

export interface GridCellRef {
  record: string;
  field: string;
}

export interface RecordGridSort {
  field: string;
  direction: "asc" | "desc";
}

export interface RecordGridProps {
  /** Names the grid for assistive technology: the table name. */
  label: string;
  fields: ReadonlyArray<DataField>;
  records: ReadonlyArray<DataRecord>;
  /** The records relation fields point at, by table name: their labels, and the picker. */
  relations?: RelationSources;
  /** A value changed in a cell. Turns editing on; absent, the grid is read-only. */
  onChange?: (recordId: string, fieldId: string, value: CellValue) => void;
  /** A checkbox per row and in the header; Shift+Space toggles the current row. */
  selectable?: boolean;
  selection?: ReadonlyArray<string>;
  defaultSelection?: ReadonlyArray<string>;
  onSelectionChange?: (ids: string[]) => void;
  /** An expand button per row; Shift+Enter on a cell. */
  onOpenRecord?: (id: string) => void;
  /** A "New record" row at the end. */
  onAddRecord?: () => void;
  /** A + after the last column. */
  onAddField?: () => void;
  /** The order shown in the headers. Clicking a header cycles ascending, descending, none. */
  sort?: RecordGridSort | null;
  onSortChange?: (sort: RecordGridSort | null) => void;
  /** The actions of a column, behind a ⋯ in its header. */
  fieldMenu?: (field: DataField) => ReadonlyArray<ActionMenuEntry>;
  onFieldAction?: (fieldId: string, actionId: string) => void;
  /** The current cell. Controlled or not. */
  active?: GridCellRef | null;
  defaultActive?: GridCellRef | null;
  onActiveChange?: (cell: GridCellRef) => void;
  /** Column widths in px, by field id; by type otherwise. */
  widths?: Readonly<Record<string, number>>;
  /** Writes NULL in empty cells, as a database editor does. */
  showNull?: boolean;
  /** Marks the cells changed since the grid was shown, with an ember corner. On by default. */
  markEdited?: boolean;
  empty?: ReactNode;
  className?: string;
}

const WIDTH: Partial<Record<FieldType, number>> = {
  number: 112,
  boolean: 88,
  date: 120,
  datetime: 160,
  longText: 280,
  json: 240,
  select: 152,
  email: 220,
  url: 220,
};
const widthOf = (field: DataField) => (field.primary ? 112 : (WIDTH[field.type] ?? 192));

const MONO: ReadonlySet<FieldType> = new Set([
  "number",
  "date",
  "datetime",
  "json",
  "email",
  "url",
]);
const PICKER: ReadonlySet<FieldType> = new Set(["select", "multiSelect", "relation"]);
const TYPED: ReadonlySet<FieldType> = new Set([
  "text",
  "longText",
  "number",
  "date",
  "datetime",
  "email",
  "url",
  "json",
]);

const NO_CONTEXT = {};

interface Editing {
  record: string;
  field: string;
  draft: string;
  error: string | null;
}

/** The value of a cell, read: the mark of its kind (records-fields), or NULL when unset. */
function CellView({
  fields,
  field,
  record,
  showNull,
}: {
  fields: RecordFields<DataRecord>;
  field: DataField;
  record: DataRecord;
  showNull: boolean;
}) {
  if (fields.isEmpty(record, field.id) && field.type !== "boolean")
    return showNull && (record.values[field.id] ?? null) === null ? (
      <span className="fg-cell-null">NULL</span>
    ) : null;
  return (
    <RecordFieldMark
      fields={fields}
      name={field.id}
      record={record}
      context={NO_CONTEXT}
      view="cell"
    />
  );
}

/**
 * An editable sheet of records: typed headers, typed cells, keyboard of a spreadsheet. Stateless
 * about the data: each change goes to `onChange`, the caller writes it and passes new records.
 */
export function RecordGrid({
  label,
  fields,
  records,
  relations,
  onChange,
  selectable = false,
  selection,
  defaultSelection = [],
  onSelectionChange,
  onOpenRecord,
  onAddRecord,
  onAddField,
  sort,
  onSortChange,
  fieldMenu,
  onFieldAction,
  active: activeProp,
  defaultActive = null,
  onActiveChange,
  widths,
  showNull = false,
  markEdited = true,
  empty = "No records yet",
  className,
}: RecordGridProps) {
  const id = useId();
  const table = useRef<HTMLTableElement>(null);
  const wantFocus = useRef(false);
  // Set once an edit is committed or cancelled: the blur that follows must not commit it again.
  const closed = useRef(false);
  const [active, setActive] = useControllableState<GridCellRef | null>({
    value: activeProp,
    defaultValue: defaultActive,
    onChange: onActiveChange
      ? (cell) => {
          if (cell) onActiveChange(cell);
        }
      : undefined,
  });
  // The records model of the table: what a cell reads and says, and the order of its values.
  const model = useMemo(() => fieldsFromSchema(fields, relations), [fields, relations]);
  // The checkboxes and Shift+Space are the selection; the clicks on cells are not.
  const rows = useCollection({
    items: records,
    getId: (r) => r.id,
    selectionMode: selectable ? "multiple" : "none",
    ...(selection ? { selected: selection } : {}),
    defaultSelected: defaultSelection,
    ...(onSelectionChange ? { onSelectedChange: onSelectionChange } : {}),
  });
  const selected = rows.selected;
  const [editing, setEditing] = useState<Editing | null>(null);
  const [edited, setEdited] = useState<ReadonlySet<string>>(() => new Set());
  const [said, setSaid] = useState("");
  const [menuFor, setMenuFor] = useState<string | null>(null);

  // Focus follows the current cell after a move made here, never on the caller's own updates.
  useEffect(() => {
    if (!wantFocus.current || editing) return;
    wantFocus.current = false;
    table.current
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.focus({ preventScroll: false });
  });

  const rowAt = active ? records.findIndex((r) => r.id === active.record) : -1;
  const colAt = active ? fields.findIndex((f) => f.id === active.field) : -1;
  const r0 = rowAt < 0 ? 0 : rowAt;
  const c0 = colAt < 0 ? 0 : colAt;
  const editable = (field: DataField) => Boolean(onChange) && !field.readOnly && !field.primary;

  const go = (row: number, col: number) => {
    if (records.length === 0 || fields.length === 0) return;
    const r = Math.max(0, Math.min(records.length - 1, row));
    const c = Math.max(0, Math.min(fields.length - 1, col));
    wantFocus.current = true;
    setActive({ record: records[r]!.id, field: fields[c]!.id });
  };

  const write = (recordId: string, field: DataField, value: CellValue) => {
    const record = records.find((r) => r.id === recordId);
    const before = record?.values[field.id] ?? null;
    if (editText(before) === editText(value) && typeof before === typeof value) return;
    onChange?.(recordId, field.id, value);
    if (markEdited) setEdited((s) => new Set(s).add(`${recordId}\u0000${field.id}`));
  };

  const start = (record: DataRecord, field: DataField, draft?: string) => {
    if (!editable(field)) {
      setSaid(field.primary ? `${field.name} is the primary key` : `${field.name} is read only`);
      return;
    }
    if (field.type === "boolean") {
      write(record.id, field, record.values[field.id] !== true);
      return;
    }
    if (field.type === "file") {
      if (onOpenRecord) onOpenRecord(record.id);
      else setSaid("Files are added from the record");
      return;
    }
    closed.current = false;
    setEditing({
      record: record.id,
      field: field.id,
      draft: draft ?? editText(record.values[field.id] ?? null),
      error: null,
    });
  };

  const stop = () => {
    closed.current = true;
    wantFocus.current = true;
    setEditing(null);
  };

  /** Writes the draft; false (and the problem shown) when it is not a value of the field. */
  const commit = (): boolean => {
    if (!editing) return true;
    const field = fields.find((f) => f.id === editing.field);
    if (!field) return true;
    const parsed = parseValue(field, editing.draft, relations);
    if ("error" in parsed) {
      setEditing({ ...editing, error: parsed.error });
      setSaid(`${field.name}: ${parsed.error}`);
      return false;
    }
    write(editing.record, field, parsed.value);
    stop();
    return true;
  };

  const clear = (record: DataRecord, field: DataField) => {
    if (!editable(field) || field.type === "boolean") return;
    if (field.required) {
      setSaid(`${field.name} is required`);
      return;
    }
    write(record.id, field, null);
  };

  const toggleRow = (recordId: string) => rows.toggle(recordId);

  const onGridKey = (event: KeyboardEvent<HTMLTableElement>) => {
    if (editing || records.length === 0) return;
    const target = event.target as HTMLElement;
    if (!target.matches("td[data-cell]")) return;
    const record = records[r0]!;
    const field = fields[c0]!;
    const mod = event.metaKey || event.ctrlKey;
    const k = event.key;
    let handled = true;
    if (k === "ArrowDown") go(mod ? records.length - 1 : r0 + 1, c0);
    else if (k === "ArrowUp") go(mod ? 0 : r0 - 1, c0);
    else if (k === "ArrowRight") go(r0, mod ? fields.length - 1 : c0 + 1);
    else if (k === "ArrowLeft") go(r0, mod ? 0 : c0 - 1);
    else if (k === "Home") go(mod ? 0 : r0, 0);
    else if (k === "End") go(mod ? records.length - 1 : r0, fields.length - 1);
    else if (k === "PageDown") go(r0 + 10, c0);
    else if (k === "PageUp") go(r0 - 10, c0);
    else if (k === "Tab") {
      const step = event.shiftKey ? -1 : 1;
      const flat = r0 * fields.length + c0 + step;
      if (flat < 0 || flat >= records.length * fields.length) handled = false;
      else go(Math.floor(flat / fields.length), flat % fields.length);
    } else if (k === "Enter" && event.shiftKey) {
      if (onOpenRecord) onOpenRecord(record.id);
      else handled = false;
    } else if (k === "Enter" || k === "F2") start(record, field);
    else if (k === " " && event.shiftKey && selectable) toggleRow(record.id);
    else if (k === " " && field.type === "boolean") start(record, field);
    else if (k === "Delete" || k === "Backspace") clear(record, field);
    else if (mod && k.toLowerCase() === "c") {
      void navigator.clipboard?.writeText(model.text(record, field.id));
      setSaid("Copied");
    } else if (k.length === 1 && !mod && !event.altKey && TYPED.has(field.type))
      start(record, field, k);
    else if (k.length === 1 && !mod && !event.altKey && PICKER.has(field.type))
      start(record, field);
    else handled = false;
    if (handled) event.preventDefault();
  };

  const onEditorKey = (event: KeyboardEvent<HTMLInputElement>) => {
    const k = event.key;
    if (k === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      stop();
    } else if (k === "Enter") {
      event.preventDefault();
      if (commit()) go(r0 + (event.shiftKey ? -1 : 1), c0);
    } else if (k === "Tab") {
      event.preventDefault();
      if (commit()) go(r0, c0 + (event.shiftKey ? -1 : 1));
    }
  };

  const cycleSort = (field: DataField) => {
    if (!onSortChange) return;
    if (sort?.field !== field.id) onSortChange({ field: field.id, direction: "asc" });
    else if (sort.direction === "asc") onSortChange({ field: field.id, direction: "desc" });
    else onSortChange(null);
  };

  const allSelected = records.length > 0 && records.every((r) => selected.includes(r.id));
  const gutter = selectable || Boolean(onOpenRecord);
  const columns = fields.length + (gutter ? 1 : 0) + (onAddField ? 1 : 0);

  const editorFor = (record: DataRecord, field: DataField) => {
    const value = record.values[field.id] ?? null;
    if (field.type === "select")
      return (
        <SelectMenu
          label={field.name}
          variant="chip"
          open
          onOpenChange={(open) => {
            if (!open) stop();
          }}
          options={[
            ...(field.required ? [] : [{ value: "__none__", label: "None" }]),
            ...(field.choices ?? []).map((c) => ({
              value: c.value,
              label: c.label,
              glyph: (
                <span
                  className="fg-swatch-mark"
                  style={{ background: c.color ?? "var(--ink-dim)" }}
                />
              ),
            })),
          ]}
          value={typeof value === "string" ? value : null}
          onChange={(next) => write(record.id, field, !next || next === "__none__" ? null : next)}
          className="fg-dh-cellpick"
        />
      );
    if (field.type === "multiSelect")
      return (
        <LabelPicker
          labels={(field.choices ?? []).map((c) => ({
            value: c.value,
            label: c.label,
            color: c.color ?? "var(--ink-dim)",
          }))}
          open
          onOpenChange={(open) => {
            if (!open) stop();
          }}
          value={listOf(value)}
          onChange={(next) => write(record.id, field, next.length ? next : null)}
          className="fg-dh-cellpick"
        />
      );
    if (field.type === "relation")
      return (
        <RelationPicker
          label={field.name}
          variant="chip"
          targets={relations?.[field.relation?.table ?? ""] ?? []}
          multiple={field.relation?.multiple ?? false}
          open
          onOpenChange={(open) => {
            if (!open) stop();
          }}
          value={listOf(value)}
          onChange={(next) => write(record.id, field, next.length ? next : null)}
          className="fg-dh-cellpick"
        />
      );
    const error = editing?.error;
    return (
      <>
        <input
          ref={(input) => {
            if (input && document.activeElement !== input) {
              input.focus({ preventScroll: true });
              const end = input.value.length;
              input.setSelectionRange(end, end);
            }
          }}
          className={cx("fg-dh-cellinput", MONO.has(field.type) && "fg-dh-mono")}
          aria-label={field.name}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          inputMode={field.type === "number" ? "decimal" : undefined}
          placeholder={
            field.type === "date"
              ? "YYYY-MM-DD"
              : field.type === "datetime"
                ? "YYYY-MM-DD HH:MM"
                : undefined
          }
          spellCheck={field.type === "text" || field.type === "longText"}
          value={editing?.draft ?? ""}
          onChange={(event) =>
            setEditing((e) => (e ? { ...e, draft: event.target.value, error: null } : e))
          }
          onKeyDown={onEditorKey}
          onBlur={() => {
            // Leaving the cell keeps a valid value and drops one that is not.
            if (closed.current || !editing) return;
            if (!commit()) {
              closed.current = true;
              setEditing(null);
            }
          }}
        />
        {error ? (
          <span id={`${id}-error`} className="fg-dh-cellerror" role="alert">
            {error}
          </span>
        ) : null}
      </>
    );
  };

  return (
    <div className={cx("fg-dh-grid-wrap", className)}>
      <table
        ref={table}
        role="grid"
        aria-label={label}
        aria-rowcount={records.length + 1}
        aria-colcount={fields.length}
        aria-readonly={onChange ? undefined : true}
        className="fg-dh-grid"
        onKeyDown={onGridKey}
      >
        <colgroup>
          {gutter ? <col style={{ width: selectable && onOpenRecord ? 64 : 40 }} /> : null}
          {fields.map((f) => (
            <col key={f.id} style={{ width: widths?.[f.id] ?? widthOf(f) }} />
          ))}
          {onAddField ? <col style={{ width: 40 }} /> : null}
        </colgroup>
        <TableHeader>
          <TableRow aria-rowindex={1}>
            {gutter ? (
              <TableHead className="fg-dh-gutter" scope="col">
                {selectable ? (
                  <input
                    type="checkbox"
                    className="fg-check-input"
                    aria-label={allSelected ? "Unselect all records" : "Select all records"}
                    checked={allSelected}
                    ref={(input) => {
                      if (input)
                        input.indeterminate =
                          !allSelected && records.some((r) => selected.includes(r.id));
                    }}
                    onChange={() => (allSelected ? rows.clear() : rows.selectAll())}
                  />
                ) : (
                  <span className="fg-sr">Row</span>
                )}
              </TableHead>
            ) : null}
            {fields.map((field, c) => {
              const sorted = sort?.field === field.id ? sort.direction : null;
              const menu = fieldMenu?.(field);
              const head = (
                <>
                  {field.primary ? (
                    <Icon icon={Key01Icon} size={12} variant="mono" title="Primary key" />
                  ) : (
                    <FieldTypeGlyph type={field.type} />
                  )}
                  <span className="fg-dh-th-name">{field.name}</span>
                  {sorted ? (
                    <span className="fg-dh-th-sort" aria-hidden="true">
                      {sorted === "asc" ? "↑" : "↓"}
                    </span>
                  ) : null}
                </>
              );
              return (
                <TableHead
                  key={field.id}
                  scope="col"
                  aria-colindex={c + 1}
                  aria-sort={sorted ? (sorted === "asc" ? "ascending" : "descending") : undefined}
                  className={cx(field.type === "number" && "fg-dh-end")}
                >
                  <div className="fg-dh-th">
                    {onSortChange ? (
                      <button
                        type="button"
                        className="fg-dh-th-main"
                        onClick={() => cycleSort(field)}
                        title={`Sort by ${field.name}`}
                      >
                        {head}
                      </button>
                    ) : (
                      <span className="fg-dh-th-main">{head}</span>
                    )}
                    {menu && menu.length ? (
                      <ActionMenu
                        label={`Actions of ${field.name}`}
                        items={menu}
                        open={menuFor === field.id}
                        onOpenChange={(open) => setMenuFor(open ? field.id : null)}
                        onSelect={(actionId) => onFieldAction?.(field.id, actionId)}
                        align="end"
                        trigger={
                          <IconButton
                            icon={MoreHorizontalIcon}
                            size="sm"
                            label={`Actions of ${field.name}`}
                            className="fg-dh-th-more"
                          />
                        }
                      />
                    ) : null}
                  </div>
                </TableHead>
              );
            })}
            {onAddField ? (
              <TableHead className="fg-dh-addcol" scope="col">
                <IconButton
                  icon={PlusSignIcon}
                  size="sm"
                  label="Add a field"
                  onClick={onAddField}
                />
              </TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.length === 0 ? (
            <TableRow>
              <TableCell className="fg-dh-grid-empty" colSpan={Math.max(columns, 1)}>
                {empty}
              </TableCell>
            </TableRow>
          ) : (
            records.map((record, r) => {
              const isSelected = selected.includes(record.id);
              return (
                <TableRow
                  key={record.id}
                  aria-rowindex={r + 2}
                  aria-selected={selectable ? isSelected : undefined}
                  className={cx(isSelected && "fg-dh-row-selected")}
                >
                  {gutter ? (
                    <TableCell className="fg-dh-gutter">
                      <span className="fg-dh-gutter-in">
                        {selectable ? (
                          <input
                            type="checkbox"
                            tabIndex={-1}
                            className="fg-check-input"
                            aria-label={`Select record ${record.id}`}
                            checked={isSelected}
                            onChange={() => toggleRow(record.id)}
                          />
                        ) : null}
                        {onOpenRecord ? (
                          <button
                            type="button"
                            tabIndex={-1}
                            className="fg-dh-expand"
                            aria-label={`Open record ${record.id}`}
                            title="Open the record (Shift+Enter)"
                            onClick={() => onOpenRecord(record.id)}
                          >
                            <Icon icon={Maximize01Icon} size={12} variant="mono" />
                          </button>
                        ) : null}
                      </span>
                    </TableCell>
                  ) : null}
                  {fields.map((field, c) => {
                    const isActive = r === r0 && c === c0;
                    const isEditing = editing?.record === record.id && editing.field === field.id;
                    return (
                      <TableCell
                        key={field.id}
                        data-cell=""
                        data-active={isActive ? "true" : undefined}
                        aria-colindex={c + 1}
                        aria-readonly={editable(field) ? undefined : true}
                        tabIndex={isActive && !isEditing ? 0 : -1}
                        className={cx(
                          "fg-dh-cell",
                          MONO.has(field.type) && "fg-dh-mono",
                          field.primary && "fg-dh-mono fg-dh-pk",
                          field.type === "number" && "fg-dh-end",
                          isActive && "fg-dh-active",
                          isEditing && "fg-dh-editing",
                          edited.has(`${record.id}\u0000${field.id}`) && "fg-dh-edited",
                        )}
                        onMouseDown={() => {
                          if (!isActive) setActive({ record: record.id, field: field.id });
                        }}
                        onFocus={() => {
                          if (!isActive) setActive({ record: record.id, field: field.id });
                        }}
                        onDoubleClick={() => {
                          if (!isEditing) start(record, field);
                        }}
                      >
                        {isEditing ? (
                          editorFor(record, field)
                        ) : (
                          <CellView
                            fields={model}
                            field={field}
                            record={record}
                            showNull={showNull}
                          />
                        )}
                      </TableCell>
                    );
                  })}
                  {onAddField ? <TableCell className="fg-dh-addcol" /> : null}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </table>
      {onAddRecord ? (
        <button type="button" className="fg-dh-addrow" onClick={onAddRecord}>
          <Icon icon={PlusSignIcon} size={12} variant="mono" />
          New record
        </button>
      ) : null}
      <span className="fg-sr" aria-live="polite">
        {said}
      </span>
    </div>
  );
}
