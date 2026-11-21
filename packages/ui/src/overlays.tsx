// The parts that open over the page. Focus, dismissal, positioning and announcements come from
// Base UI (unstyled, accessible primitives); the look is the lab language's, in atoms.css.

import { Toast as Base } from "@base-ui/react/toast";
import type { IconDefinition } from "@forgeron/icons";
import { Calendar03Icon, Cancel01Icon } from "@forgeron/icons";
import type { ComponentProps, KeyboardEvent, ReactNode } from "react";
import { createContext, Fragment, useContext, useState } from "react";
import { useControllableState } from "./hooks/use-controllable";
import { useDisclosure } from "./hooks/use-disclosure";
import { Calendar, type CalendarProps } from "./calendar";
import { cx } from "./cx";
import { addDays, formatShort, toIso, weekday } from "./dates";
import { Icon } from "./icon";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
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

// The toast parts, as shadcn splits them. A toast is drawn from its `toast` (an object of the
// manager); each part reads it from the one around it. `Toaster` draws the default toast of each.

type Part<T> = Omit<T, "className"> & { className?: string };

export type ToastObject = ReturnType<typeof Base.useToastManager>["toasts"][number];

export type ToastProps = Part<Omit<ComponentProps<typeof Base.Root>, "toast">> & {
  /** The toast to draw, as `useToast().toasts` lists them. */
  toast: ToastObject;
};

/**
 * One toast: the frame. Its children are `ToastTitle`, `ToastDescription`, `ToastAction`,
 * `ToastClose`; without children it draws all four from the toast itself.
 */
export function Toast({ toast, className, children, ...rest }: ToastProps) {
  return (
    <Base.Root
      {...rest}
      toast={toast}
      className={cx("fg-toast", toast.type && `fg-toast-${toast.type}`, className)}
    >
      {children ?? (
        <>
          <ToastContent>
            <ToastTitle />
            <ToastDescription />
          </ToastContent>
          {toast.actionProps ? <ToastAction /> : null}
          <ToastClose />
        </>
      )}
    </Base.Root>
  );
}

/** Groups the title and the description. */
export function ToastContent({ className, ...rest }: Part<ComponentProps<typeof Base.Content>>) {
  return <Base.Content {...rest} className={cx("fg-toast-content", className)} />;
}

export function ToastTitle({ className, ...rest }: Part<ComponentProps<typeof Base.Title>>) {
  return <Base.Title {...rest} className={cx("fg-toast-title", className)} />;
}

export function ToastDescription({
  className,
  ...rest
}: Part<ComponentProps<typeof Base.Description>>) {
  return <Base.Description {...rest} className={cx("fg-toast-text", className)} />;
}

/** The button of the toast's `actionProps`; give it children to draw your own. */
export function ToastAction({ className, ...rest }: Part<ComponentProps<typeof Base.Action>>) {
  return <Base.Action {...rest} className={cx("fg-toast-action", className)} />;
}

/** Dismisses the toast. Without children, a cross. */
export function ToastClose({
  className,
  children,
  ...rest
}: Part<ComponentProps<typeof Base.Close>>) {
  return (
    <Base.Close aria-label="Dismiss" {...rest} className={cx("fg-toast-close", className)}>
      {children ?? <Icon icon={Cancel01Icon} size={12} variant="mono" />}
    </Base.Close>
  );
}

function ToastList({ render }: { render?: ((toast: ToastObject) => ReactNode) | undefined }) {
  const { toasts } = Base.useToastManager();
  return toasts.map((toast) =>
    render ? (
      <Fragment key={toast.id}>{render(toast)}</Fragment>
    ) : (
      <Toast key={toast.id} toast={toast} />
    ),
  );
}

export interface ToasterProps {
  children?: ReactNode;
  /** How many toasts show at once; older ones wait. */
  limit?: number;
  /** Draws each toast yourself, from the parts: `(toast) => <Toast toast={toast}>…</Toast>`. */
  renderToast?: (toast: ToastObject) => ReactNode;
  /** Class of the viewport that holds the toasts. */
  viewportClassName?: string;
}

/**
 * Wrap the app once: toasts added with `useToast().add({ title })` show at the bottom right,
 * are announced, pause on hover, and F6 reaches them from the keyboard.
 */
export function Toaster({ children, limit = 3, renderToast, viewportClassName }: ToasterProps) {
  return (
    <Base.Provider limit={limit}>
      {children}
      <Base.Portal>
        <Base.Viewport className={cx("fg-toasts", viewportClassName)}>
          <ToastList render={renderToast} />
        </Base.Viewport>
      </Base.Portal>
    </Base.Provider>
  );
}

/**
 * `add({ title, description, type: "success" | "danger", actionProps: { children: "Undo",
 * onClick } })`, and `close(id)`.
 */
export const useToast = Base.useToastManager;

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

/** The root of the composed date picker: no `label`, the parts as children. */
export interface DatePickerRootProps {
  label?: undefined;
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (value: string | null) => void;
  today?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

interface DatePickerState {
  value: string | null;
  choose: (next: string | null) => void;
  today: string;
}

const DatePickerContext = createContext<DatePickerState | null>(null);

function useDatePicker(part: string): DatePickerState {
  const state = useContext(DatePickerContext);
  if (!state) throw new Error(`${part} goes inside a DatePicker.`);
  return state;
}

/**
 * With `label`: a date behind a chip, quick picks first, then the month. Without: the root of the
 * parts (`DatePickerTrigger`, `DatePickerContent`, `DatePickerPresets`, `DatePickerCalendar`),
 * built on `Popover` and `Calendar` parts.
 */
export function DatePicker(props: DatePickerProps | DatePickerRootProps) {
  return props.label !== undefined ? <DatePickerField {...props} /> : <DatePickerRoot {...props} />;
}

function DatePickerRoot({
  value: valueProp,
  defaultValue = null,
  onChange,
  today: todayProp,
  open: openProp,
  onOpenChange,
  children,
}: DatePickerRootProps) {
  const [deviceToday] = useState(() => toIso(new Date()));
  const today = todayProp ?? deviceToday;
  const [value, setValue] = useControllableState<string | null>({
    value: valueProp,
    defaultValue,
    onChange,
  });
  const { open, setOpen } = useDisclosure({ open: openProp, onOpenChange });
  const choose = (next: string | null) => {
    setValue(next);
    setOpen(false);
  };
  return (
    <DatePickerContext.Provider value={{ value, choose, today }}>
      <Popover open={open} onOpenChange={setOpen}>
        {children}
      </Popover>
    </DatePickerContext.Provider>
  );
}

export interface DatePickerTriggerProps {
  /** Names the control, e.g. "Due date". */
  label: string;
  placeholder?: string;
  /** `chip` (default): a property of a record. `field`: a form control. */
  variant?: "chip" | "field";
  /** Drawn in place of the date. */
  children?: ReactNode;
  className?: string;
}

/** The chip or field that shows the date and opens the picker. */
export function DatePickerTrigger({
  label,
  placeholder = "Set date",
  variant = "chip",
  children,
  className,
}: DatePickerTriggerProps) {
  const { value, today } = useDatePicker("DatePickerTrigger");
  const year = Number(today.slice(0, 4));
  return (
    <PopoverTrigger
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
    </PopoverTrigger>
  );
}

export interface DatePickerContentProps {
  /** Names the panel, e.g. "Due date". */
  label: string;
  children?: ReactNode;
  className?: string;
}

/** The panel under the trigger: presets, then the calendar. */
export function DatePickerContent({ label, children, className }: DatePickerContentProps) {
  return (
    <PopoverContent
      side="bottom"
      align="start"
      sideOffset={4}
      aria-label={label}
      className={cx("fg-datepop", className)}
    >
      {children}
    </PopoverContent>
  );
}

export interface DatePickerPresetsProps {
  /** `duePresets(today)` by default, `[]` for none. */
  presets?: ReadonlyArray<DatePreset>;
  /** Offers to remove the date. Default `true`. */
  clearable?: boolean;
  /** Names the date in "Remove …", e.g. "Due date". */
  label?: string;
  className?: string;
}

/** The quick picks, and the row that removes the date. */
export function DatePickerPresets({
  presets,
  clearable = true,
  label = "date",
  className,
}: DatePickerPresetsProps) {
  const { value, choose, today } = useDatePicker("DatePickerPresets");
  const picks = presets ?? duePresets(today);
  const year = Number(today.slice(0, 4));
  if (picks.length === 0 && !(clearable && value)) return null;
  return (
    <div className={cx("fg-pop-list", className)}>
      {picks.map((p) => (
        <button key={p.label} type="button" className="fg-pop-row" onClick={() => choose(p.value)}>
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
  );
}

export type DatePickerCalendarProps = Omit<
  CalendarProps,
  "value" | "onChange" | "today" | "range" | "children"
>;

/** The month: choosing a day sets the date and closes the panel. */
export function DatePickerCalendar(props: DatePickerCalendarProps) {
  const { value, choose, today } = useDatePicker("DatePickerCalendar");
  return (
    <Calendar
      {...props}
      today={today}
      {...(value ? { value } : {})}
      onChange={(next) => choose(next)}
    />
  );
}

function DatePickerField({
  label,
  value,
  defaultValue,
  onChange,
  placeholder,
  presets,
  clearable = true,
  today,
  variant,
  open,
  onOpenChange,
  children,
  className,
}: DatePickerProps) {
  return (
    <DatePickerRoot
      {...(value !== undefined ? { value } : {})}
      {...(defaultValue !== undefined ? { defaultValue } : {})}
      {...(onChange ? { onChange } : {})}
      {...(today ? { today } : {})}
      {...(open !== undefined ? { open } : {})}
      {...(onOpenChange ? { onOpenChange } : {})}
    >
      <DatePickerTrigger
        label={label}
        {...(placeholder !== undefined ? { placeholder } : {})}
        {...(variant ? { variant } : {})}
        {...(className ? { className } : {})}
      >
        {children}
      </DatePickerTrigger>
      <DatePickerContent label={label}>
        <DatePickerPresets {...(presets ? { presets } : {})} clearable={clearable} label={label} />
        <DatePickerCalendar label={label} />
      </DatePickerContent>
    </DatePickerRoot>
  );
}
