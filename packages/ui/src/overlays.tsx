// The parts that open over the page. Focus, dismissal, positioning and announcements come from
// Base UI (unstyled, accessible primitives); the look is the lab language's, in atoms.css.

import { Popover } from "@base-ui/react/popover";
import { Toast } from "@base-ui/react/toast";
import type { IconDefinition } from "@forgeron/icons";
import { Calendar03Icon, Cancel01Icon } from "@forgeron/icons";
import type { KeyboardEvent, ReactNode } from "react";
import { useState } from "react";
import { useControllableState } from "./hooks/use-controllable";
import { useDisclosure } from "./hooks/use-disclosure";
import { Calendar } from "./calendar";
import { cx } from "./cx";
import { addDays, formatShort, toIso, weekday } from "./dates";
import { Icon } from "./icon";
import {
  Select,
  SelectContent,
  SelectFieldLabel,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

/* ---------------------------------------------------------------- SelectMenu */

export interface SelectMenuOption {
  value: string;
  label: string;
  /** A pixel icon before the label, also shown in the trigger. */
  icon?: IconDefinition;
  /** Any mark before the label in place of `icon`: a status glyph, an avatar, a swatch. */
  glyph?: ReactNode;
  /** Mono text at the end of the row: a shortcut, a count. */
  hint?: string;
  disabled?: boolean;
}

export interface SelectMenuProps {
  /** Names the control for assistive technology (and is shown above it with `showLabel`). */
  label: string;
  showLabel?: boolean;
  options: ReadonlyArray<SelectMenuOption>;
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (value: string | null) => void;
  placeholder?: string;
  /** `field` (default): a form control, 32px. `chip`: a property of a record, 26px. */
  variant?: "field" | "chip";
  /**
   * `md` (default) 32px; `sm` 26px, for a field in a dense row or a popover. Fields only: a chip
   * is 26px already.
   */
  size?: "sm" | "md";
  /** The digits 1 to 9 choose the options in order while the list is open (shown as hints). */
  numbered?: boolean;
  /** Hides the label in a chip and shows only the mark: a priority, a person in a dense row. */
  markOnly?: boolean;
  disabled?: boolean;
  /** Opens and closes the list from outside, e.g. from a shortcut. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Drawn in the trigger in place of the value: a row's own mark, when the row is the chip. */
  children?: ReactNode;
  className?: string;
}

const markOf = (o: SelectMenuOption) =>
  o.glyph ?? (o.icon ? <Icon icon={o.icon} size={12} /> : null);

/** One choice in a list that opens below the control: icons, hints, typeahead, arrows. */
export function SelectMenu({
  label,
  showLabel,
  options,
  value,
  defaultValue,
  onChange,
  placeholder = "Choose…",
  variant = "field",
  size = "md",
  numbered,
  markOnly,
  disabled,
  open: openProp,
  onOpenChange,
  children,
  className,
}: SelectMenuProps) {
  const items = options.map((o) => ({ value: o.value, label: o.label }));
  const byValue = new Map(options.map((o) => [o.value, o]));
  const { open, setOpen } = useDisclosure({ open: openProp, onOpenChange });
  const [current, choose] = useControllableState<string | null>({
    value,
    defaultValue: defaultValue ?? null,
    onChange,
  });
  const onDigit = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!numbered || !/^[1-9]$/.test(event.key)) return;
    const option = options[Number(event.key) - 1];
    if (!option || option.disabled) return;
    event.preventDefault();
    choose(option.value);
    setOpen(false);
  };
  return (
    <Select
      items={items}
      value={current}
      onValueChange={(next) => choose(next as string | null)}
      open={open}
      onOpenChange={setOpen}
      disabled={disabled}
    >
      <div className={cx("fg-selm", className)}>
        <SelectFieldLabel className={showLabel ? "fg-field-label" : "fg-sr"}>
          {label}
        </SelectFieldLabel>
        <SelectTrigger
          variant={variant}
          size={size === "sm" ? "sm" : "default"}
          className={markOnly ? "fg-selm-mark" : undefined}
        >
          {children ?? (
            <SelectValue placeholder={placeholder}>
              {(current: string | null) => {
                const option = current ? byValue.get(current) : undefined;
                if (!option) return placeholder;
                return (
                  <>
                    {markOf(option)}
                    <span className={markOnly ? "fg-sr" : undefined}>{option.label}</span>
                  </>
                );
              }}
            </SelectValue>
          )}
        </SelectTrigger>
      </div>
      <SelectContent onKeyDown={onDigit}>
        {options.map((o, i) => (
          <SelectItem
            key={o.value}
            value={o.value}
            disabled={o.disabled}
            glyph={markOf(o)}
            hint={o.hint ?? (numbered && i < 9 ? String(i + 1) : undefined)}
          >
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ---------------------------------------------------------------- Toast */

function ToastList() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((toast) => (
    <Toast.Root
      key={toast.id}
      toast={toast}
      className={cx("fg-toast", toast.type && `fg-toast-${toast.type}`)}
    >
      <Toast.Content className="fg-toast-content">
        <Toast.Title className="fg-toast-title" />
        <Toast.Description className="fg-toast-text" />
      </Toast.Content>
      {toast.actionProps ? <Toast.Action className="fg-toast-action" /> : null}
      <Toast.Close className="fg-toast-close" aria-label="Dismiss">
        <Icon icon={Cancel01Icon} size={12} variant="mono" />
      </Toast.Close>
    </Toast.Root>
  ));
}

export interface ToasterProps {
  children?: ReactNode;
  /** How many toasts show at once; older ones wait. */
  limit?: number;
}

/**
 * Wrap the app once: toasts added with `useToast().add({ title })` show at the bottom right,
 * are announced, pause on hover, and F6 reaches them from the keyboard.
 */
export function Toaster({ children, limit = 3 }: ToasterProps) {
  return (
    <Toast.Provider limit={limit}>
      {children}
      <Toast.Portal>
        <Toast.Viewport className="fg-toasts">
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}

/**
 * `add({ title, description, type: "success" | "danger", actionProps: { children: "Undo",
 * onClick } })`, and `close(id)`.
 */
export const useToast = Toast.useToastManager;

/* ---------------------------------------------------------------- DatePicker */

export interface DatePreset {
  label: string;
  /** `YYYY-MM-DD`. */
  value: string;
}

/** Tomorrow, the end of this week, next Monday, in two weeks: the quick picks of a due date. */
export function duePresets(today: string): DatePreset[] {
  const friday = addDays(today, (4 - weekday(today) + 7) % 7);
  const monday = addDays(today, 7 - weekday(today));
  return [
    { label: "Tomorrow", value: addDays(today, 1) },
    { label: "End of this week", value: friday },
    { label: "Next week", value: monday },
    { label: "In two weeks", value: addDays(today, 14) },
  ];
}

export interface DatePickerProps {
  /** Names the control, e.g. "Due date". */
  label: string;
  /** `YYYY-MM-DD`, or null for none. */
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (value: string | null) => void;
  placeholder?: string;
  /** The quick picks above the month; `duePresets(today)` by default, `[]` for none. */
  presets?: ReadonlyArray<DatePreset>;
  /** Offers to remove the date. */
  clearable?: boolean;
  /** `YYYY-MM-DD`; the device's date by default. */
  today?: string;
  /** `chip` (default): a property of a record. `field`: a form control. */
  variant?: "chip" | "field";
  /** Opens and closes the list from outside, e.g. from a shortcut. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Drawn in the trigger in place of the date: a row's own date, when the row is the chip. */
  children?: ReactNode;
  className?: string;
}

/** A date behind a chip: quick picks first, then the month. */
export function DatePicker({
  label,
  value: valueProp,
  defaultValue = null,
  onChange,
  placeholder = "Set date",
  presets,
  clearable = true,
  today: todayProp,
  variant = "chip",
  open: openProp,
  onOpenChange,
  children,
  className,
}: DatePickerProps) {
  const [deviceToday] = useState(() => toIso(new Date()));
  const today = todayProp ?? deviceToday;
  const [value, setValue] = useControllableState<string | null>({
    value: valueProp,
    defaultValue,
    onChange,
  });
  const { open, setOpen } = useDisclosure({ open: openProp, onOpenChange });
  const picks = presets ?? duePresets(today);
  const year = Number(today.slice(0, 4));
  const choose = (next: string | null) => {
    setValue(next);
    setOpen(false);
  };
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        className={cx(
          "fg-selm-trigger",
          variant === "chip" && "fg-selm-chip",
          !value && "fg-selm-empty",
          className,
        )}
        aria-label={value ? `${label}: ${formatShort(value, year)}` : label}
      >
        {children ?? (
          <>
            <Icon icon={Calendar03Icon} size={12} variant="mono" />
            <span>{value ? formatShort(value, year) : placeholder}</span>
          </>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner className="fg-pop-positioner" sideOffset={4} align="start">
          <Popover.Popup className="fg-pop fg-datepop" aria-label={label}>
            {picks.length > 0 || (clearable && value) ? (
              <div className="fg-pop-list">
                {picks.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    className="fg-pop-row"
                    onClick={() => choose(p.value)}
                  >
                    <Icon icon={Calendar03Icon} size={12} variant="mono" />
                    <span className="fg-pop-label">{p.label}</span>
                    <span className="fg-pop-hint">{formatShort(p.value, year)}</span>
                  </button>
                ))}
                {clearable && value ? (
                  <button type="button" className="fg-pop-row" onClick={() => choose(null)}>
                    <Icon icon={Cancel01Icon} size={12} variant="mono" />
                    <span className="fg-pop-label">Remove {label.toLowerCase()}</span>
                  </button>
                ) : null}
              </div>
            ) : null}
            <Calendar
              label={label}
              today={today}
              {...(value ? { value } : {})}
              onChange={(next) => choose(next)}
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
