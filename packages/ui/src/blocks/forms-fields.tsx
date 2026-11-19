// Three answers that need more than a control of the atoms, each usable alone in a form of your
// own: a matrix (rows rated against the same columns), a ranking (items put in order, from the
// keyboard too) and an address (street, postcode, city, country: typed, no lookup, no network).

import { ArrowDown01Icon, ArrowUp01Icon, GripIcon } from "@forgeron/icons";
import type { DragEvent, KeyboardEvent } from "react";
import { useId, useRef, useState } from "react";
import { Button } from "../button";
import { Combobox } from "../combobox";
import { cx } from "../cx";
import { Field, Input } from "../form";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import {
  moveFormItem,
  type FormAddress,
  type FormMatrixAnswer,
  type FormOption,
} from "./forms-model";

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
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [said, setSaid] = useState("");
  const list = useRef<HTMLOListElement>(null);
  const byId = new Map(items.map((i) => [i.id, i]));
  const ids = [
    ...(order ?? []).filter((x) => byId.has(x)),
    ...items.map((i) => i.id).filter((x) => !(order ?? []).includes(x)),
  ];
  const touched = order !== null;

  const focusRow = (itemId: string) =>
    requestAnimationFrame(() =>
      list.current
        ?.querySelector<HTMLElement>(`[data-item="${CSS.escape(itemId)}"] .fg-fm-rank-main`)
        ?.focus(),
    );

  const moveTo = (itemId: string, to: number) => {
    const from = ids.indexOf(itemId);
    const target = Math.max(0, Math.min(ids.length - 1, to));
    if (from < 0 || (from === target && touched)) return;
    setOrder(moveFormItem(ids, from, target));
    setSaid(`${byId.get(itemId)?.label ?? ""}, place ${target + 1} of ${ids.length}`);
  };

  const onKey = (itemId: string, event: KeyboardEvent<HTMLElement>) => {
    if (disabled || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return;
    event.preventDefault();
    const at = ids.indexOf(itemId);
    const step = event.key === "ArrowUp" ? -1 : 1;
    if (event.altKey) {
      moveTo(itemId, at + step);
      focusRow(itemId);
    } else {
      const next = ids[at + step];
      if (next) focusRow(next);
    }
  };

  const onDrop = (itemId: string, event: DragEvent) => {
    event.preventDefault();
    if (dragging) moveTo(dragging, ids.indexOf(itemId));
    setDragging(null);
    setOver(null);
  };

  return (
    <div
      {...(id ? { id } : {})}
      className={cx("fg-fm-rank", !touched && "fg-fm-rank-fresh", className)}
    >
      <ol
        ref={list}
        className="fg-fm-rank-list"
        aria-label={label}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
      >
        {ids.map((itemId, i) => {
          const item = byId.get(itemId)!;
          return (
            <li
              key={itemId}
              data-item={itemId}
              className={cx(
                "fg-fm-rank-row",
                dragging === itemId && "fg-fm-rank-dragging",
                over === itemId && dragging !== itemId && "fg-fm-rank-over",
              )}
              onDragOver={(event) => {
                if (!dragging || disabled) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                if (over !== itemId) setOver(itemId);
              }}
              onDragLeave={() => setOver((o) => (o === itemId ? null : o))}
              onDrop={(event) => onDrop(itemId, event)}
            >
              <span
                className="fg-fm-rank-grip"
                aria-hidden="true"
                draggable={!disabled}
                title="Drag to reorder, or Alt + arrows"
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", item.label);
                  setDragging(itemId);
                }}
                onDragEnd={() => {
                  setDragging(null);
                  setOver(null);
                }}
              >
                <Icon icon={GripIcon} size={12} variant="mono" />
              </span>
              <button
                type="button"
                className="fg-fm-rank-main"
                disabled={disabled}
                aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
                aria-label={`${item.label}, place ${i + 1} of ${ids.length}${touched ? "" : ", not ordered yet"}. Alt and arrows move it.`}
                onKeyDown={(event) => onKey(itemId, event)}
              >
                <span className="fg-fm-rank-n">{i + 1}</span>
                <span className="fg-fm-rank-label">{item.label}</span>
              </button>
              <IconButton
                icon={ArrowUp01Icon}
                size="sm"
                label={`Move ${item.label} up`}
                disabled={disabled || i === 0}
                onClick={() => moveTo(itemId, i - 1)}
              />
              <IconButton
                icon={ArrowDown01Icon}
                size="sm"
                label={`Move ${item.label} down`}
                disabled={disabled || i === ids.length - 1}
                onClick={() => moveTo(itemId, i + 1)}
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
        {said}
      </span>
    </div>
  );
}

/* ---------------------------------------------------------------- AddressField */

export type AddressPart = keyof FormAddress;

export interface AddressFieldProps {
  /** Names the group for assistive technology: the question. */
  label: string;
  value?: FormAddress;
  defaultValue?: FormAddress;
  onChange?: (value: FormAddress) => void;
  /** The countries to choose from, as `{ value, label }`; absent, the country is typed. */
  countries?: ReadonlyArray<{ value: string; label: string }>;
  /** What is wrong, by part. */
  errors?: Partial<Record<AddressPart, string>>;
  /** Marks the parts that must be filled: all but the second line. */
  required?: boolean;
  disabled?: boolean;
  id?: string;
  describedBy?: string;
  className?: string;
}

const PARTS: ReadonlyArray<{
  key: AddressPart;
  label: string;
  auto: string;
  span: "full" | "post" | "city";
}> = [
  { key: "line1", label: "Address line 1", auto: "address-line1", span: "full" },
  { key: "line2", label: "Address line 2", auto: "address-line2", span: "full" },
  { key: "postcode", label: "Postcode", auto: "postal-code", span: "post" },
  { key: "city", label: "City", auto: "address-level2", span: "city" },
  { key: "country", label: "Country", auto: "country-name", span: "full" },
];

/** A postal address as five fields. Nothing is looked up and nothing leaves the page. */
export function AddressField({
  label,
  value,
  defaultValue,
  onChange,
  countries,
  errors,
  required,
  disabled,
  id,
  describedBy,
  className,
}: AddressFieldProps) {
  const [address, setAddress] = useControllableState<FormAddress>({
    value,
    defaultValue: defaultValue ?? {},
    onChange,
  });
  const set = (key: AddressPart, text: string) => setAddress({ ...address, [key]: text });
  return (
    <div
      {...(id ? { id } : {})}
      role="group"
      aria-label={label}
      aria-describedby={describedBy}
      className={cx("fg-fm-address", className)}
    >
      {PARTS.map((p) => {
        const optional = p.key === "line2" || !required;
        return (
          <Field
            key={p.key}
            label={optional && required ? `${p.label} (optional)` : p.label}
            error={errors?.[p.key]}
            className={cx("fg-fm-address-part", `fg-fm-address-${p.span}`)}
          >
            {(control) =>
              p.key === "country" && countries ? (
                <Combobox
                  label={p.label}
                  options={countries}
                  value={address.country ?? null}
                  onChange={(next) => set("country", next ?? "")}
                  clearable
                  disabled={disabled}
                  id={control.id}
                  aria-describedby={control["aria-describedby"]}
                  aria-invalid={control["aria-invalid"]}
                />
              ) : (
                <Input
                  {...control}
                  value={address[p.key] ?? ""}
                  autoComplete={p.auto}
                  disabled={disabled}
                  onChange={(event) => set(p.key, event.target.value)}
                />
              )
            }
          </Field>
        );
      })}
    </div>
  );
}
