// Two answers that need more than a control of the atoms, each usable alone in a form of your
// own: a matrix (rows rated against the same columns) and a ranking (items put in order, from the
// keyboard too). The address field is a primitive: `address-field.tsx`.
//
// Both are a root and parts. With no children they draw everything; with children you place the
// parts:
//
//   <MatrixField label="Rate" rows={rows} columns={columns}>
//     <MatrixFieldColumns />
//     <MatrixFieldRows />
//   </MatrixField>
//
//   <RankingField label="Rank" items={items}>
//     <RankingFieldList />
//     <RankingFieldKeep />
//     <RankingFieldStatus />
//   </RankingField>

import { ArrowDown01Icon, ArrowUp01Icon, GripIcon } from "@forgeron/icons";
import { createContext, useContext, useId, type ComponentProps, type ReactNode } from "react";
import { Button } from "../button";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import { useSortable } from "../sortable";
import { type FormMatrixAnswer, type FormOption } from "./forms-model";
import { partContext } from "../part";

/* ---------------------------------------------------------------- MatrixField */

interface MatrixContext {
  uid: string;
  rows: ReadonlyArray<FormOption>;
  columns: ReadonlyArray<FormOption>;
  multiple: boolean;
  disabled: boolean | undefined;
  chosen: (row: string, col: string) => boolean;
  pick: (row: string, col: string, on: boolean) => void;
}

const [MatrixCtx, useMatrix] = partContext<MatrixContext>("MatrixField");

/** The state of the enclosing `MatrixField`: its rows and columns, and what is chosen. */
export { useMatrix as useMatrixField };

export type MatrixFieldColumnsProps = Omit<ComponentProps<"thead">, "ref">;

/** The header row: one heading per column. Its children replace them. */
export function MatrixFieldColumns({ className, children, ...rest }: MatrixFieldColumnsProps) {
  const { columns } = useMatrix();
  return (
    <thead data-slot="matrix-field-columns" {...rest} className={className}>
      <tr>
        <td />
        {children ??
          columns.map((c) => (
            <th key={c.id} scope="col">
              {c.label}
            </th>
          ))}
      </tr>
    </thead>
  );
}

export interface MatrixFieldCellProps extends Omit<ComponentProps<"input">, "ref" | "type" | "id"> {
  row: string;
  column: string;
}

/** One radio (or box) where a row meets a column. */
export function MatrixFieldCell({ row, column, className, ...rest }: MatrixFieldCellProps) {
  const { uid, rows, columns, multiple, disabled, chosen, pick } = useMatrix();
  const r = rows.find((x) => x.id === row);
  const c = columns.find((x) => x.id === column);
  return (
    <td>
      <input
        data-slot="matrix-field-cell"
        type={multiple ? "checkbox" : "radio"}
        name={`${uid}-${row}`}
        aria-label={`${r?.label ?? row}: ${c?.label ?? column}`}
        checked={chosen(row, column)}
        disabled={disabled}
        {...rest}
        className={cx(multiple ? "fg-check-input" : "fg-radio-input", className)}
        onChange={(event) => {
          rest.onChange?.(event);
          pick(row, column, event.target.checked);
        }}
      />
    </td>
  );
}

export interface MatrixFieldRowProps extends Omit<ComponentProps<"tr">, "ref" | "id"> {
  /** The id of the row. */
  row: string;
}

/** One row: its label and a cell per column. Its children replace the cells. */
export function MatrixFieldRow({ row, className, children, ...rest }: MatrixFieldRowProps) {
  const { rows, columns } = useMatrix();
  const r = rows.find((x) => x.id === row);
  return (
    <tr data-slot="matrix-field-row" {...rest} className={className}>
      <th scope="row">{r?.label ?? row}</th>
      {children ?? columns.map((c) => <MatrixFieldCell key={c.id} row={row} column={c.id} />)}
    </tr>
  );
}

export type MatrixFieldRowsProps = Omit<ComponentProps<"tbody">, "ref">;

/** The body: one `MatrixFieldRow` per row. */
export function MatrixFieldRows({ className, children, ...rest }: MatrixFieldRowsProps) {
  const { rows } = useMatrix();
  return (
    <tbody data-slot="matrix-field-rows" {...rest} className={className}>
      {children ?? rows.map((r) => <MatrixFieldRow key={r.id} row={r.id} />)}
    </tbody>
  );
}

export interface MatrixFieldProps extends Omit<
  ComponentProps<"div">,
  "ref" | "onChange" | "defaultValue" | "children"
> {
  /** Names the matrix for assistive technology: the question. */
  label: string;
  rows: ReadonlyArray<FormOption>;
  columns: ReadonlyArray<FormOption>;
  /** The chosen column of each row, by id; a list of columns per row with `multiple`. */
  value?: FormMatrixAnswer;
  defaultValue?: FormMatrixAnswer;
  onChange?: (value: FormMatrixAnswer) => void;
  /** Several columns may be chosen on a row (boxes instead of radios). */
  multiple?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  /** The id of the help or error that describes the matrix. */
  describedBy?: string;
  /** The parts, inside the table: `MatrixFieldColumns` and `MatrixFieldRows`. */
  children?: ReactNode;
}

/** Rows against columns, one radio (or box) per cell. Arrows move along a row, as for any radio group. */
export function MatrixField({
  label,
  rows,
  columns,
  value,
  defaultValue,
  onChange,
  multiple = false,
  disabled,
  invalid,
  describedBy,
  children,
  className,
  ...rest
}: MatrixFieldProps) {
  const uid = useId();
  const [answer, setAnswer] = useControllableState<FormMatrixAnswer>({
    value,
    defaultValue: defaultValue ?? {},
    onChange,
  });
  const chosen = (row: string, col: string) => {
    const x = answer[row];
    return Array.isArray(x) ? x.includes(col) : x === col;
  };
  const pick = (row: string, col: string, on: boolean) => {
    if (!multiple) {
      setAnswer({ ...answer, [row]: col });
      return;
    }
    const now = answer[row];
    const list = Array.isArray(now) ? now : now ? [now] : [];
    const next = on ? [...list, col] : list.filter((c) => c !== col);
    const { [row]: _gone, ...others } = answer;
    setAnswer(next.length ? { ...others, [row]: next } : others);
  };
  return (
    <MatrixCtx.Provider value={{ uid, rows, columns, multiple, disabled, chosen, pick }}>
      <div
        data-slot="matrix-field"
        {...rest}
        role="group"
        aria-label={label}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={cx("fg-fm-matrix", className)}
      >
        <table className="fg-fm-matrix-table">
          {children ?? (
            <>
              <MatrixFieldColumns />
              <MatrixFieldRows />
            </>
          )}
        </table>
      </div>
    </MatrixCtx.Provider>
  );
}

/* ---------------------------------------------------------------- RankingField */

interface RankingContext {
  ids: string[];
  byId: Map<string, FormOption>;
  touched: boolean;
  sortable: ReturnType<typeof useSortable<string>>;
  disabled: boolean | undefined;
  invalid: boolean | undefined;
  describedBy: string | undefined;
  keep: () => void;
}

const [RankingCtx, useRanking] = partContext<RankingContext>("RankingField");

/** The state of the enclosing `RankingField`: the order, and the sortable behind it. */
export { useRanking as useRankingField };

/** The item a `RankingFieldItem` is drawing, for the parts inside it. */
const RankItemCtx = createContext<{ id: string; index: number } | null>(null);

function useRankItem(part: string) {
  const ctx = useContext(RankItemCtx);
  if (!ctx) throw new Error(`<${part}> goes inside a <RankingFieldItem>.`);
  const rank = useRanking();
  return { ...ctx, item: rank.byId.get(ctx.id)!, rank };
}

export type RankingFieldHandleProps = Omit<ComponentProps<"span">, "ref">;

/** The grip to drag an item by. */
export function RankingFieldHandle({ className, children, ...rest }: RankingFieldHandleProps) {
  const { id, rank } = useRankItem("RankingFieldHandle");
  return (
    <span
      data-slot="ranking-field-handle"
      title="Drag to reorder, or Alt + arrows"
      {...rank.sortable.getHandleProps(id)}
      {...rest}
      className={cx("fg-fm-rank-grip", className)}
    >
      {children ?? <Icon icon={GripIcon} size={12} variant="mono" />}
    </span>
  );
}

export type RankingFieldMainProps = Omit<ComponentProps<"button">, "ref">;

/** The item itself: its place and its label. It takes the focus; Alt + arrows move it. */
export function RankingFieldMain({ className, children, ...rest }: RankingFieldMainProps) {
  const { item, index, rank } = useRankItem("RankingFieldMain");
  return (
    <button
      type="button"
      data-slot="ranking-field-main"
      disabled={rank.disabled}
      aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
      aria-label={`${item.label}, place ${index + 1} of ${rank.ids.length}${rank.touched ? "" : ", not ordered yet"}. Alt and arrows move it.`}
      {...rest}
      className={cx("fg-fm-rank-main", className)}
    >
      {children ?? (
        <>
          <span className="fg-fm-rank-n">{index + 1}</span>
          <span className="fg-fm-rank-label">{item.label}</span>
        </>
      )}
    </button>
  );
}

export type RankingFieldMoveProps = Omit<ComponentProps<"button">, "ref" | "children">;

/** The button that moves the item one place up. */
export function RankingFieldUp(props: RankingFieldMoveProps) {
  const { id, index, item, rank } = useRankItem("RankingFieldUp");
  return (
    <IconButton
      data-slot="ranking-field-up"
      icon={ArrowUp01Icon}
      size="sm"
      label={`Move ${item.label} up`}
      disabled={rank.disabled || index === 0}
      onClick={() => rank.sortable.moveTo(id, index - 1, { focus: false })}
      {...props}
    />
  );
}

/** The button that moves the item one place down. */
export function RankingFieldDown(props: RankingFieldMoveProps) {
  const { id, index, item, rank } = useRankItem("RankingFieldDown");
  return (
    <IconButton
      data-slot="ranking-field-down"
      icon={ArrowDown01Icon}
      size="sm"
      label={`Move ${item.label} down`}
      disabled={rank.disabled || index === rank.ids.length - 1}
      onClick={() => rank.sortable.moveTo(id, index + 1, { focus: false })}
      {...props}
    />
  );
}

export interface RankingFieldItemProps extends Omit<ComponentProps<"li">, "ref" | "id"> {
  /** The id of the item. */
  id: string;
}

/** One item of the list. Its children replace the handle, the label and the two arrows. */
export function RankingFieldItem({ id, className, children, ...rest }: RankingFieldItemProps) {
  const { ids, sortable } = useRanking();
  const index = ids.indexOf(id);
  const state = sortable.getItemState(id);
  return (
    <RankItemCtx.Provider value={{ id, index }}>
      <li
        data-item={id}
        data-slot="ranking-field-item"
        {...sortable.getItemProps(id, {
          ...rest,
          className: cx(
            "fg-fm-rank-row",
            state.dragging && "fg-fm-rank-dragging",
            state.over && "fg-fm-rank-over",
            className,
          ),
        })}
      >
        {children ?? (
          <>
            <RankingFieldHandle />
            <RankingFieldMain />
            <RankingFieldUp />
            <RankingFieldDown />
          </>
        )}
      </li>
    </RankItemCtx.Provider>
  );
}

export type RankingFieldListProps = Omit<ComponentProps<"ol">, "ref">;

/** The ordered list. Its children replace the default `RankingFieldItem` per item. */
export function RankingFieldList({ className, children, ...rest }: RankingFieldListProps) {
  const { ids, sortable, invalid, describedBy } = useRanking();
  return (
    <ol
      data-slot="ranking-field-list"
      {...sortable.getListProps({
        ...rest,
        className: cx("fg-fm-rank-list", className),
        "aria-invalid": invalid || undefined,
        "aria-describedby": describedBy,
      })}
    >
      {children ?? ids.map((id) => <RankingFieldItem key={id} id={id} />)}
    </ol>
  );
}

export type RankingFieldKeepProps = Omit<ComponentProps<"button">, "ref" | "onClick">;

/** "Keep this order": accepts the order given, shown until the respondent has ordered the list. */
export function RankingFieldKeep({ className, children, ...rest }: RankingFieldKeepProps) {
  const { touched, disabled, keep } = useRanking();
  if (touched || disabled) return null;
  return (
    <Button
      variant="ghost"
      size="sm"
      data-slot="ranking-field-keep"
      {...rest}
      className={cx("fg-fm-rank-keep", className)}
      onClick={keep}
    >
      {children ?? "Keep this order"}
    </Button>
  );
}

/** What the last move says, for assistive technology. */
export function RankingFieldStatus({ className, ...rest }: Omit<ComponentProps<"span">, "ref">) {
  const { sortable } = useRanking();
  return (
    <span
      data-slot="ranking-field-status"
      aria-live="polite"
      {...rest}
      className={cx("fg-sr", className)}
    >
      {sortable.status}
    </span>
  );
}

export interface RankingFieldProps extends Omit<
  ComponentProps<"div">,
  "ref" | "onChange" | "defaultValue" | "children"
> {
  /** Names the list for assistive technology: the question. */
  label: string;
  items: ReadonlyArray<FormOption>;
  /** The ids in the chosen order, or `null` while the respondent has not ordered them yet. */
  value?: string[] | null;
  defaultValue?: string[] | null;
  onChange?: (value: string[] | null) => void;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  /** The parts: `RankingFieldList`, `RankingFieldKeep`, `RankingFieldStatus`. */
  children?: ReactNode;
}

/**
 * Items put in order by dragging a handle, with the arrow buttons or from the keyboard: Alt + Up
 * and Alt + Down move the item that has the focus, Up and Down move the focus. Until it is
 * ordered the list shows the order it was given, dimmed, and "Keep this order" accepts it.
 */
export function RankingField({
  label,
  items,
  value,
  defaultValue,
  onChange,
  disabled,
  invalid,
  describedBy,
  children,
  className,
  ...rest
}: RankingFieldProps) {
  const [order, setOrder] = useControllableState<string[] | null>({
    value,
    defaultValue: defaultValue ?? null,
    onChange,
  });
  const byId = new Map(items.map((i) => [i.id, i]));
  const ids = [
    ...(order ?? []).filter((x) => byId.has(x)),
    ...items.map((i) => i.id).filter((x) => !(order ?? []).includes(x)),
  ];
  const touched = order !== null;
  const sortable = useSortable({
    items: ids,
    getId: (x) => x,
    getLabel: (x) => byId.get(x)?.label ?? "",
    onReorder: (next) => setOrder(next),
    announce: (move, itemId, count) =>
      `${byId.get(itemId)?.label ?? ""}, place ${move.to + 1} of ${count}`,
    label,
    handle: true,
    navigate: true,
    disabled,
    focusSelector: ".fg-fm-rank-main",
  });

  return (
    <RankingCtx.Provider
      value={{
        ids,
        byId,
        touched,
        sortable,
        disabled,
        invalid,
        describedBy,
        keep: () => setOrder(ids),
      }}
    >
      <div
        data-slot="ranking-field"
        {...rest}
        className={cx("fg-fm-rank", !touched && "fg-fm-rank-fresh", className)}
      >
        {children ?? (
          <>
            <RankingFieldList />
            <RankingFieldKeep />
            <RankingFieldStatus />
          </>
        )}
      </div>
    </RankingCtx.Provider>
  );
}
