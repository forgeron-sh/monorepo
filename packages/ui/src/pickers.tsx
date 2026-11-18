// Pickers for the properties of a record (an issue, a lead, a ticket): a chip that says the
// current value with its mark, a list with the same marks. Built on SelectMenu, and on Base UI's
// Select for the labels (several at once).

import { Select } from "@base-ui/react/select";
import { ArrowDown01Icon, Tick02Icon } from "@forgeron/icons";
import { Avatar } from "./avatar";
import { cx } from "./cx";
import {
  PriorityGlyph,
  QuarterGlyph,
  SizeGlyph,
  StatusGlyph,
  type PriorityLevel,
  type SizeLevel,
  type StatusKind,
} from "./glyphs";
import type { ReactNode } from "react";
import { Icon } from "./icon";
import { SelectMenu } from "./overlays";

interface PickerBase<T> {
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
  /** `chip` (default) on a record; `field` in a form. */
  variant?: "chip" | "field";
  /** Shows the mark alone in the chip, for dense rows. */
  markOnly?: boolean;
  /** Opens and closes the list from outside, e.g. from a shortcut. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Drawn in the trigger in place of the value: a row's own mark, when the row is the chip. */
  children?: ReactNode;
  className?: string;
}

const pass = <T,>(
  props: PickerBase<T>,
  parse: (v: string | null) => T,
  show: (v: T) => string,
) => ({
  variant: props.variant ?? "chip",
  ...(props.markOnly ? { markOnly: true } : {}),
  ...(props.className ? { className: props.className } : {}),
  ...(props.value !== undefined ? { value: show(props.value) } : {}),
  ...(props.defaultValue !== undefined ? { defaultValue: show(props.defaultValue) } : {}),
  ...(props.open !== undefined ? { open: props.open } : {}),
  ...(props.onOpenChange ? { onOpenChange: props.onOpenChange } : {}),
  ...(props.children !== undefined ? { children: props.children } : {}),
  onChange: (v: string | null) => props.onChange?.(parse(v)),
});

/* ---------------------------------------------------------------- status */

export const STATUS_NAMES: Record<StatusKind, string> = {
  backlog: "Backlog",
  todo: "Todo",
  progress: "In Progress",
  review: "In Review",
  done: "Done",
  canceled: "Canceled",
};

export interface StatusPickerProps extends PickerBase<StatusKind> {
  /** The states offered, in order; all six by default. */
  statuses?: ReadonlyArray<StatusKind>;
  /** Other names for the states, e.g. `{ review: "Waiting on client" }`. */
  names?: Partial<Record<StatusKind, string>>;
}

/** Backlog to Done: the glyph tells the state, the digits choose it. */
export function StatusPicker({
  statuses = ["backlog", "todo", "progress", "review", "done", "canceled"],
  names,
  ...props
}: StatusPickerProps) {
  return (
    <SelectMenu
      label="Status"
      numbered
      options={statuses.map((s) => ({
        value: s,
        label: names?.[s] ?? STATUS_NAMES[s],
        glyph: <StatusGlyph status={s} />,
      }))}
      {...pass(
        props,
        (v) => (v ?? "todo") as StatusKind,
        (v) => v,
      )}
    />
  );
}

/* ---------------------------------------------------------------- priority */

export const PRIORITY_NAMES: Record<PriorityLevel, string> = {
  0: "No priority",
  1: "Urgent",
  2: "High",
  3: "Medium",
  4: "Low",
};

export type PriorityPickerProps = PickerBase<PriorityLevel>;

/** No priority, Urgent, High, Medium, Low: bars, and an ember square for urgent. */
export function PriorityPicker(props: PriorityPickerProps) {
  const levels: PriorityLevel[] = [0, 1, 2, 3, 4];
  return (
    <SelectMenu
      label="Priority"
      options={levels.map((p) => ({
        value: String(p),
        label: PRIORITY_NAMES[p],
        glyph: <PriorityGlyph level={p} />,
      }))}
      {...pass(
        props,
        (v) => Number(v ?? 0) as PriorityLevel,
        (v) => String(v),
      )}
    />
  );
}

/* ---------------------------------------------------------------- size */

export const SIZE_NAMES: Record<SizeLevel, string> = {
  0: "No estimate",
  1: "XS",
  2: "S",
  3: "M",
  4: "L",
  5: "XL",
};

export interface SizePickerProps extends PickerBase<SizeLevel> {
  /** Points shown next to each size, e.g. `[0, 1, 2, 3, 5, 8]`; none by default. */
  points?: ReadonlyArray<number>;
}

/** The size of a piece of work, XS to XL: a square that grows. */
export function SizePicker({ points, ...props }: SizePickerProps) {
  const levels: SizeLevel[] = [0, 1, 2, 3, 4, 5];
  return (
    <SelectMenu
      label="Size"
      options={levels.map((l) => {
        const pts = points?.[l];
        return {
          value: String(l),
          label: SIZE_NAMES[l],
          glyph: <SizeGlyph level={l} />,
          ...(pts !== undefined && l > 0 ? { hint: `${pts} pt` } : {}),
        };
      })}
      {...pass(
        props,
        (v) => Number(v ?? 0) as SizeLevel,
        (v) => String(v),
      )}
    />
  );
}

/* ---------------------------------------------------------------- quarter */

const QUARTER_MONTHS = ["Jan – Mar", "Apr – Jun", "Jul – Sep", "Oct – Dec"];

export interface QuarterPickerProps extends PickerBase<string | null> {
  /** The years offered, e.g. `[2026, 2027]`; values read `2026-Q4`. */
  years: ReadonlyArray<number>;
  /** Offers "No quarter". */
  clearable?: boolean;
}

/** A quarter of a year, `2026-Q4`: the four cells mark which one. */
export function QuarterPicker({ years, clearable, ...props }: QuarterPickerProps) {
  const options = years.flatMap((y) =>
    ([1, 2, 3, 4] as const).map((q) => ({
      value: `${y}-Q${q}`,
      label: `Q${q} ${y}`,
      glyph: <QuarterGlyph quarter={q} />,
      hint: QUARTER_MONTHS[q - 1]!,
    })),
  );
  return (
    <SelectMenu
      label="Quarter"
      placeholder="Quarter"
      options={clearable ? [{ value: "_", label: "No quarter" }, ...options] : options}
      {...pass(
        props,
        (v) => (v === "_" ? null : v),
        (v) => v ?? "_",
      )}
    />
  );
}

/* ---------------------------------------------------------------- person */

export interface Person {
  id: string;
  name: string;
  /** A team, a role: shown at the end of the row. */
  hint?: string;
  /** A picture, else the initials. */
  src?: string;
}

export interface PersonPickerProps extends PickerBase<string | null> {
  /** The question: "Assignee", "Author", "Owner". */
  label?: string;
  people: ReadonlyArray<Person>;
  /** The person viewing: marked "(you)" and listed first. */
  me?: string;
  /** The entry for nobody, e.g. "No assignee"; absent, someone must be chosen. */
  noneLabel?: string;
}

/** Someone from the workspace: an assignee, an author, an owner. Typing a name jumps to it. */
export function PersonPicker({
  label = "Assignee",
  people,
  me,
  noneLabel,
  ...props
}: PersonPickerProps) {
  const ordered = me
    ? [...people.filter((p) => p.id === me), ...people.filter((p) => p.id !== me)]
    : people;
  const options = ordered.map((p) => ({
    value: p.id,
    label: p.id === me ? `${p.name} (you)` : p.name,
    glyph: <Avatar name={p.name} size={16} {...(p.src ? { src: p.src } : {})} />,
    ...(p.hint ? { hint: p.hint } : {}),
  }));
  return (
    <SelectMenu
      label={label}
      placeholder={noneLabel ?? label}
      options={
        noneLabel
          ? [{ value: "_", label: noneLabel, glyph: <span className="fg-av-none" /> }, ...options]
          : options
      }
      {...pass(
        props,
        (v) => (v === "_" ? null : v),
        (v) => v ?? "_",
      )}
    />
  );
}

/* ---------------------------------------------------------------- labels */

export interface LabelOption {
  value: string;
  label: string;
  /** Any CSS colour: the square before the name. */
  color: string;
}

export interface LabelPickerProps {
  labels: ReadonlyArray<LabelOption>;
  value?: ReadonlyArray<string>;
  defaultValue?: ReadonlyArray<string>;
  onChange?: (value: string[]) => void;
  /** `chip` (default) on a record; `field` in a form, 32px with its caret. */
  variant?: "chip" | "field";
  /** Opens and closes the list from outside, e.g. from a shortcut. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Drawn in the trigger in place of the chosen labels. */
  children?: ReactNode;
  className?: string;
}

/** Several labels at once: the list stays open while they are ticked. */
export function LabelPicker({
  labels,
  value,
  defaultValue,
  onChange,
  variant = "chip",
  open,
  onOpenChange,
  children,
  className,
}: LabelPickerProps) {
  const byValue = new Map(labels.map((l) => [l.value, l]));
  return (
    <Select.Root<string, true>
      multiple
      items={labels.map((l) => ({ value: l.value, label: l.label }))}
      {...(value !== undefined ? { value: [...value] } : {})}
      {...(defaultValue !== undefined ? { defaultValue: [...defaultValue] } : {})}
      onValueChange={(next) => onChange?.(next)}
      {...(open !== undefined ? { open } : {})}
      {...(onOpenChange ? { onOpenChange: (next: boolean) => onOpenChange(next) } : {})}
    >
      <Select.Label className="fg-sr">Labels</Select.Label>
      <Select.Trigger
        className={cx("fg-selm-trigger", variant === "chip" && "fg-selm-chip", className)}
      >
        {children ?? (
          <Select.Value className="fg-selm-value">
            {(chosen: string[]) =>
              chosen.length === 0 ? (
                <span className="fg-selm-empty">Labels</span>
              ) : (
                chosen.map((v) => {
                  const l = byValue.get(v);
                  return l ? (
                    <span key={v} className="fg-label-chip">
                      <span className="fg-swatch-mark" style={{ background: l.color }} />
                      {l.label}
                    </span>
                  ) : null;
                })
              )
            }
          </Select.Value>
        )}
        {variant === "field" ? (
          <Select.Icon className="fg-selm-caret">
            <Icon icon={ArrowDown01Icon} size={12} variant="mono" />
          </Select.Icon>
        ) : null}
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner
          className="fg-pop-positioner"
          sideOffset={4}
          align="start"
          alignItemWithTrigger={false}
        >
          <Select.Popup className="fg-pop fg-selm-popup">
            <Select.List className="fg-pop-list">
              {labels.map((l) => (
                <Select.Item key={l.value} value={l.value} className="fg-pop-row">
                  <span className="fg-check-box" aria-hidden="true">
                    <Select.ItemIndicator>
                      <Icon icon={Tick02Icon} size={12} variant="mono" />
                    </Select.ItemIndicator>
                  </span>
                  <span className="fg-swatch-mark" style={{ background: l.color }} />
                  <Select.ItemText className="fg-pop-label">{l.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
