// Two answers that need more than a control of the atoms, each usable alone in a form of your
// own: a matrix (rows rated against the same columns) and a ranking (items put in order, from the
// keyboard too). The address field is a primitive: `address-field.tsx`.

import { ArrowDown01Icon, ArrowUp01Icon, GripIcon } from "@forgeron/icons";
import { useId } from "react";
import { Button } from "../button";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import { useSortable } from "../sortable";
import { type FormMatrixAnswer, type FormOption } from "./forms-model";

/* ---------------------------------------------------------------- MatrixField */

export interface MatrixFieldProps {
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
  id?: string;
  className?: string;
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
  id,
  className,
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
    const { [row]: _gone, ...rest } = answer;
    setAnswer(next.length ? { ...rest, [row]: next } : rest);
  };
  return (
    <div
      {...(id ? { id } : {})}
      role="group"
      aria-label={label}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className={cx("fg-fm-matrix", className)}
    >
      <table className="fg-fm-matrix-table">
        <thead>
          <tr>
            <td />
            {columns.map((c) => (
              <th key={c.id} scope="col">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <th scope="row">{r.label}</th>
              {columns.map((c) => (
                <td key={c.id}>
                  <input
                    type={multiple ? "checkbox" : "radio"}
                    className={multiple ? "fg-check-input" : "fg-radio-input"}
                    name={`${uid}-${r.id}`}
                    aria-label={`${r.label}: ${c.label}`}
                    checked={chosen(r.id, c.id)}
                    disabled={disabled}
                    onChange={(event) => pick(r.id, c.id, event.target.checked)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------------------------------------------------------- RankingField */

export interface RankingFieldProps {
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
  id?: string;
  className?: string;
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
  id,
  className,
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
    <div
      {...(id ? { id } : {})}
      className={cx("fg-fm-rank", !touched && "fg-fm-rank-fresh", className)}
    >
      <ol
        {...sortable.getListProps({
          className: "fg-fm-rank-list",
          "aria-invalid": invalid || undefined,
          "aria-describedby": describedBy,
        })}
      >
        {ids.map((itemId, i) => {
          const item = byId.get(itemId)!;
          return (
            <li
              key={itemId}
              data-item={itemId}
              {...sortable.getItemProps(itemId, {
                className: cx(
                  "fg-fm-rank-row",
                  sortable.getItemState(itemId).dragging && "fg-fm-rank-dragging",
                  sortable.getItemState(itemId).over && "fg-fm-rank-over",
                ),
              })}
            >
              <span
                {...sortable.getHandleProps(itemId)}
                className="fg-fm-rank-grip"
                title="Drag to reorder, or Alt + arrows"
              >
                <Icon icon={GripIcon} size={12} variant="mono" />
              </span>
              <button
                type="button"
                className="fg-fm-rank-main"
                disabled={disabled}
                aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
                aria-label={`${item.label}, place ${i + 1} of ${ids.length}${touched ? "" : ", not ordered yet"}. Alt and arrows move it.`}
              >
                <span className="fg-fm-rank-n">{i + 1}</span>
                <span className="fg-fm-rank-label">{item.label}</span>
              </button>
              <IconButton
                icon={ArrowUp01Icon}
                size="sm"
                label={`Move ${item.label} up`}
                disabled={disabled || i === 0}
                onClick={() => sortable.moveTo(itemId, i - 1, { focus: false })}
              />
              <IconButton
                icon={ArrowDown01Icon}
                size="sm"
                label={`Move ${item.label} down`}
                disabled={disabled || i === ids.length - 1}
                onClick={() => sortable.moveTo(itemId, i + 1, { focus: false })}
              />
            </li>
          );
        })}
      </ol>
      {!touched && !disabled ? (
        <Button variant="ghost" size="sm" className="fg-fm-rank-keep" onClick={() => setOrder(ids)}>
          Keep this order
        </Button>
      ) : null}
      <span className="fg-sr" aria-live="polite">
        {sortable.status}
      </span>
    </div>
  );
}
