// Numbers typed by people: a stepper field (NumberInput), an amount in a currency (MoneyInput,
// in minor units: 1250 is 12.50) and the list of currencies (CurrencyPicker). Text is read and
// written in the locale of the person, `1 234,50` or `1,234.50`. Each is its props form, built
// from parts (D-156): `NumberInputField`, `NumberInputDecrement`, `NumberInputIncrement`,
// `NumberInputAffix`; `MoneyInputField`, `MoneyInputSymbol`; `CurrencyPickerItem` over the Select.

import { MinusSignIcon, PlusSignIcon } from "@forgeron/icons";
import type { ComponentProps, KeyboardEvent, ReactNode } from "react";
import { createContext, useContext, useState } from "react";
import { cx } from "./cx";
import { useControllableState } from "./hooks/use-controllable";
import { Icon } from "./icon";
import {
  Select,
  SelectContent,
  SelectFieldLabel,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type SelectItemProps,
  type SelectRootProps,
} from "./select";

/* ---------------------------------------------------------------- locale */

const decimalsOf = (n: number) => {
  const text = String(n);
  if (/e-/.test(text)) return Number(text.split("e-")[1]);
  return text.includes(".") ? (text.split(".")[1]?.length ?? 0) : 0;
};

/** The separators a locale writes numbers with. */
export function separators(locale?: string): { decimal: string; group: string } {
  const parts = new Intl.NumberFormat(locale).formatToParts(1234567.5);
  return {
    decimal: parts.find((p) => p.type === "decimal")?.value ?? ".",
    group: parts.find((p) => p.type === "group")?.value ?? ",",
  };
}

/** The number a text means in a locale, or null when it means none (an empty field, a word). */
export function parseNumber(input: string, locale?: string): number | null {
  const { decimal, group } = separators(locale);
  let text = input.trim().replace(/[\s  ]/g, "");
  // A numeric pad writes a point: accept it as the decimal sign unless the locale groups with it.
  if (decimal !== "." && group !== "." && !text.includes(decimal))
    text = text.replace(".", decimal);
  text = text.split(group).join("").replace(decimal, ".").replace(/−/g, "-");
  if (!/^-?\d*\.?\d*$/.test(text) || !/\d/.test(text)) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

/* ---------------------------------------------------------------- NumberInput */

export interface NumberInputProps {
  /** Names the field for assistive technology. */
  label: string;
  value?: number | null;
  defaultValue?: number | null;
  /** Hears a number when the field is left or Enter is pressed, and on every step. */
  onChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  /** What the arrows and the buttons add. Default 1. */
  step?: number;
  /** What Page Up, Page Down and Shift with an arrow add. Default ten steps. */
  largeStep?: number;
  /** A BCP 47 tag (`fr-FR`); the device's language by default. */
  locale?: string;
  /** `Intl.NumberFormat` options: `{ style: "percent" }`, `{ maximumFractionDigits: 2 }`. */
  format?: Intl.NumberFormatOptions;
  /** Text inside the field, before or after the number: a unit, a symbol. */
  prefix?: ReactNode;
  suffix?: ReactNode;
  /** The minus and plus buttons. Default `true`; the arrows work either way. */
  buttons?: boolean;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  id?: string;
  "aria-describedby"?: string | undefined;
  "aria-invalid"?: boolean | undefined;
  className?: string;
  /** Stays undefined: with children, `NumberInput` is the root of the parts. */
  children?: undefined;
}

/**
 * The root of the parts: the same props but `prefix`, `suffix` and `buttons` (the parts are the
 * children: `NumberInputDecrement`, `NumberInputAffix`, `NumberInputField`, `NumberInputIncrement`).
 */
export type NumberInputRootProps = Omit<
  NumberInputProps,
  "prefix" | "suffix" | "buttons" | "children"
> & { children: ReactNode };

interface NumberState {
  label: string;
  current: number | null;
  text: string;
  step: number;
  min: number | undefined;
  max: number | undefined;
  digits: number;
  atMin: boolean;
  atMax: boolean;
  disabled: boolean | undefined;
  readOnly: boolean | undefined;
  id: string | undefined;
  placeholder: string | undefined;
  aria: { "aria-describedby"?: string | undefined; "aria-invalid"?: boolean | undefined };
  bump: (by: number) => void;
  setDraft: (text: string) => void;
  focus: () => void;
  blur: (text: string) => void;
  keyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  describe: (n: number) => string;
}

const NumberContext = createContext<NumberState | null>(null);

function useNumber(): NumberState {
  const state = useContext(NumberContext);
  if (!state) throw new Error("NumberInput parts go inside <NumberInput>.");
  return state;
}

/**
 * A number with minus and plus buttons. Arrows add one step, Page keys ten, Home and End go to
 * the limits; the number is written in the locale and read back from it. With children it is the
 * root of the parts; without, it draws the buttons, the affixes and the field itself.
 */
export function NumberInput(props: NumberInputProps | NumberInputRootProps) {
  if (props.children !== undefined) return <NumberInputRoot {...(props as NumberInputRootProps)} />;
  const { prefix, suffix, buttons = true, children: _none, ...rest } = props as NumberInputProps;
  return (
    <NumberInputRoot {...rest} bare={!buttons}>
      {buttons ? <NumberInputDecrement /> : null}
      {prefix ? <NumberInputAffix>{prefix}</NumberInputAffix> : null}
      <NumberInputField />
      {suffix ? <NumberInputAffix>{suffix}</NumberInputAffix> : null}
      {buttons ? <NumberInputIncrement /> : null}
    </NumberInputRoot>
  );
}

function NumberInputRoot({
  label,
  value,
  defaultValue = null,
  onChange,
  min,
  max,
  step = 1,
  largeStep = step * 10,
  locale,
  format,
  placeholder,
  disabled,
  readOnly,
  id,
  className,
  bare,
  children,
  ...aria
}: NumberInputRootProps & { bare?: boolean }) {
  const [current, setCurrent] = useControllableState<number | null>({
    value,
    defaultValue,
    onChange,
  });
  const [draft, setDraft] = useState<string | null>(null);
  const digits = format?.maximumFractionDigits ?? Math.max(decimalsOf(step), 3);
  const shown = new Intl.NumberFormat(locale, { maximumFractionDigits: digits, ...format });
  const plain = new Intl.NumberFormat(locale, {
    maximumFractionDigits: digits,
    ...format,
    useGrouping: false,
  });
  const clamp = (n: number) =>
    Math.min(max ?? Infinity, Math.max(min ?? -Infinity, Number(n.toFixed(digits))));
  const percent = format?.style === "percent";

  const commit = (text: string) => {
    const parsed = parseNumber(text.replace(/%/g, ""), locale);
    setCurrent(parsed === null ? null : clamp(percent ? parsed / 100 : parsed));
    setDraft(null);
  };
  const bump = (by: number) => {
    const from = current ?? Math.min(max ?? 0, Math.max(min ?? 0, 0));
    setCurrent(clamp(current === null ? from : from + by));
    setDraft(null);
  };

  const keyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (readOnly) return;
    const big = event.shiftKey ? largeStep : step;
    if (event.key === "ArrowUp") bump(big);
    else if (event.key === "ArrowDown") bump(-big);
    else if (event.key === "PageUp") bump(largeStep);
    else if (event.key === "PageDown") bump(-largeStep);
    else if (event.key === "Home" && min !== undefined && draft === null) setCurrent(min);
    else if (event.key === "End" && max !== undefined && draft === null) setCurrent(max);
    else if (event.key === "Enter") commit(draft ?? "");
    else return;
    if (event.key !== "Enter" || draft !== null) event.preventDefault();
  };

  const state: NumberState = {
    label,
    current,
    text: draft ?? (current === null ? "" : shown.format(current)),
    step,
    min,
    max,
    digits,
    atMin: min !== undefined && current !== null && current <= min,
    atMax: max !== undefined && current !== null && current >= max,
    disabled,
    readOnly,
    id,
    placeholder,
    aria,
    bump,
    setDraft,
    focus: () => !readOnly && setDraft(current === null ? "" : plain.format(current)),
    blur: (text) => {
      if (draft !== null) commit(text);
    },
    keyDown,
    describe: (n) => shown.format(n),
  };
  // `draft` is read by `blur` and `keyDown`, which close over it above.

  return (
    <NumberContext.Provider value={state}>
      <div
        className={cx(
          "fg-num",
          bare && "fg-num-bare",
          disabled && "fg-combo-disabled",
          aria["aria-invalid"] && "fg-num-invalid",
          className,
        )}
      >
        {children}
      </div>
    </NumberContext.Provider>
  );
}

export type NumberInputButtonProps = Omit<ComponentProps<"button">, "type">;

/** The minus button; it steps down by `step` and rests at `min`. */
export function NumberInputDecrement({
  className,
  children,
  onClick,
  ...rest
}: NumberInputButtonProps) {
  const n = useNumber();
  return (
    <button
      type="button"
      tabIndex={-1}
      disabled={n.disabled || n.readOnly || n.atMin}
      aria-label={`Decrease ${n.label}`}
      {...rest}
      className={cx("fg-num-btn", className)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) n.bump(-n.step);
      }}
    >
      {children ?? <Icon icon={MinusSignIcon} size={12} variant="mono" />}
    </button>
  );
}

/** The plus button; it steps up by `step` and rests at `max`. */
export function NumberInputIncrement({
  className,
  children,
  onClick,
  ...rest
}: NumberInputButtonProps) {
  const n = useNumber();
  return (
    <button
      type="button"
      tabIndex={-1}
      disabled={n.disabled || n.readOnly || n.atMax}
      aria-label={`Increase ${n.label}`}
      {...rest}
      className={cx("fg-num-btn", className)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) n.bump(n.step);
      }}
    >
      {children ?? <Icon icon={PlusSignIcon} size={12} variant="mono" />}
    </button>
  );
}

/** Text beside the number, inside the frame: a unit, a symbol. Put it before or after the field. */
export function NumberInputAffix({ className, ...rest }: ComponentProps<"span">) {
  return <span {...rest} className={cx("fg-num-affix", className)} />;
}

/** The field: a spin button that reads and writes the number in the locale. */
export function NumberInputField({
  className,
  ...rest
}: Omit<
  ComponentProps<"input">,
  "value" | "defaultValue" | "onChange" | "type" | "role" | "className"
> & { className?: string }) {
  const n = useNumber();
  return (
    <input
      {...n.aria}
      id={n.id}
      type="text"
      inputMode={n.digits > 0 ? "decimal" : "numeric"}
      role="spinbutton"
      aria-label={n.label}
      aria-valuenow={n.current ?? undefined}
      aria-valuemin={n.min}
      aria-valuemax={n.max}
      aria-valuetext={n.current === null ? "Empty" : n.describe(n.current)}
      placeholder={n.placeholder}
      disabled={n.disabled}
      readOnly={n.readOnly}
      {...rest}
      className={cx("fg-num-input", className)}
      value={n.text}
      onFocus={(event) => {
        rest.onFocus?.(event);
        n.focus();
      }}
      onChange={(event) => n.setDraft(event.target.value)}
      onBlur={(event) => {
        rest.onBlur?.(event);
        n.blur(event.target.value);
      }}
      onKeyDown={(event) => {
        rest.onKeyDown?.(event);
        if (!event.defaultPrevented) n.keyDown(event);
      }}
    />
  );
}

/* ---------------------------------------------------------------- MoneyInput */

/** How many digits follow the decimal sign in a currency: 2 for EUR, 0 for JPY, 3 for BHD. */
export function minorDigits(currency: string): number {
  try {
    return (
      new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions()
        .maximumFractionDigits ?? 2
    );
  } catch {
    return 2;
  }
}

/** `1250` in `EUR` as `€12.50`: an amount in minor units, written for a locale. */
export function formatMoney(minor: number, currency: string, locale?: string): string {
  const digits = minorDigits(currency);
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(
    minor / 10 ** digits,
  );
}

export interface MoneyInputProps {
  label: string;
  /** In minor units (cents): `1250` is 12.50 in EUR. An integer, so nothing drifts. */
  value?: number | null;
  defaultValue?: number | null;
  onChange?: (value: number | null) => void;
  /** An ISO 4217 code: `EUR`, `USD`, `JPY`. */
  currency: string;
  locale?: string;
  /** In minor units too. */
  min?: number;
  max?: number;
  /** What the arrows add, in minor units. Default one major unit (100 for EUR). */
  step?: number;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  id?: string;
  "aria-describedby"?: string | undefined;
  "aria-invalid"?: boolean | undefined;
  className?: string;
  /** Stays undefined: with children, `MoneyInput` is the root of the parts. */
  children?: undefined;
}

/** The root of the parts: the same props, with `MoneyInputSymbol` and `MoneyInputField` inside. */
export type MoneyInputRootProps = Omit<MoneyInputProps, "children"> & {
  children: ReactNode;
};

const MoneyContext = createContext<{ symbol: string; currency: string; before: boolean } | null>(
  null,
);

/**
 * An amount of money: the symbol of the currency on the side the locale puts it, minor units out.
 * With children it is the root of the parts (`MoneyInputSymbol`, `MoneyInputField`, and the
 * `NumberInput` buttons); without, it draws the symbol and the field.
 */
export function MoneyInput({
  label,
  value,
  defaultValue = null,
  onChange,
  currency,
  locale,
  min,
  max,
  step,
  children,
  ...rest
}: MoneyInputProps | MoneyInputRootProps) {
  const [minor, setMinor] = useControllableState<number | null>({ value, defaultValue, onChange });
  const digits = minorDigits(currency);
  const unit = 10 ** digits;
  const parts = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  }).formatToParts(1);
  const symbol = parts.find((p) => p.type === "currency")?.value ?? currency;
  const before =
    parts.findIndex((p) => p.type === "currency") < parts.findIndex((p) => p.type === "integer");
  const field = <MoneyInputField />;
  const mark = <MoneyInputSymbol />;
  return (
    <MoneyContext.Provider value={{ symbol, currency, before }}>
      <NumberInputRoot
        {...rest}
        label={label}
        locale={locale}
        value={minor === null ? null : minor / unit}
        onChange={(major) => setMinor(major === null ? null : Math.round(major * unit))}
        min={min === undefined ? undefined : min / unit}
        max={max === undefined ? undefined : max / unit}
        step={(step ?? unit) / unit}
        format={{ minimumFractionDigits: digits, maximumFractionDigits: digits }}
        bare={children === undefined}
      >
        {children ??
          (before ? (
            <>
              {mark}
              {field}
            </>
          ) : (
            <>
              {field}
              {mark}
            </>
          ))}
      </NumberInputRoot>
    </MoneyContext.Provider>
  );
}

/** The amount field of a `MoneyInput`: the number, in the locale, in major units. */
export function MoneyInputField(props: ComponentProps<typeof NumberInputField>) {
  return <NumberInputField {...props} />;
}

/** The symbol of the currency (`€`, `$`), with its code for assistive technology. */
export function MoneyInputSymbol({ className, ...rest }: ComponentProps<"span">) {
  const money = useContext(MoneyContext);
  if (!money) throw new Error("MoneyInputSymbol goes inside <MoneyInput>.");
  return (
    <NumberInputAffix {...rest} {...(className ? { className } : {})}>
      <span title={money.currency}>
        {money.symbol}
        <span className="fg-sr"> ({money.currency})</span>
      </span>
    </NumberInputAffix>
  );
}

/* ---------------------------------------------------------------- CurrencyPicker */

const COMMON_CURRENCIES = [
  "EUR",
  "USD",
  "GBP",
  "CHF",
  "CAD",
  "AUD",
  "JPY",
  "SEK",
  "NOK",
  "DKK",
  "PLN",
  "CZK",
] as const;

export interface CurrencyPickerProps {
  /** Names the control. Default "Currency". */
  label?: string;
  /** An ISO 4217 code. */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** The codes offered. Default: twelve common ones, euro first. */
  currencies?: ReadonlyArray<string>;
  /** The language of the names and symbols. */
  locale?: string;
  /** `md` (default) 32px, `sm` 26px. */
  size?: "sm" | "md";
  variant?: "field" | "chip";
  disabled?: boolean;
  className?: string;
  /** Stays undefined: with children, `CurrencyPicker` is the root of the Select parts. */
  children?: undefined;
}

/** A currency's symbol in a locale: `€`, `$`, `CHF`. */
const symbolOf = (code: string, locale?: string) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    currencyDisplay: "narrowSymbol",
  })
    .formatToParts(0)
    .find((p) => p.type === "currency")?.value ?? code;

/** `EUR · Euro`: the code and its name in a locale. */
const currencyLabel = (code: string, locale?: string) => {
  const names = new Intl.DisplayNames(locale ? [locale] : undefined, { type: "currency" });
  return `${code} · ${names.of(code) ?? code}`;
};

/**
 * A currency among a short list: the code, its name and its symbol. With children, the root of
 * the `Select` parts (`SelectTrigger`, `SelectValue`, `SelectContent`, `CurrencyPickerItem`).
 */
export function CurrencyPicker(props: CurrencyPickerProps | SelectRootProps) {
  if (props.children !== undefined) return <Select {...(props as SelectRootProps)} />;
  const {
    label = "Currency",
    value,
    defaultValue = "EUR",
    onChange,
    currencies = COMMON_CURRENCIES,
    locale,
    size = "md",
    variant = "field",
    disabled,
    className,
  } = props as CurrencyPickerProps;
  const items = currencies.map((code) => ({ value: code, label: currencyLabel(code, locale) }));
  return (
    <Select
      items={items}
      {...(value !== undefined ? { value } : { defaultValue })}
      onValueChange={(next) => next && onChange?.(next as string)}
      {...(disabled !== undefined ? { disabled } : {})}
    >
      <div className={cx("fg-selm", className)}>
        <SelectFieldLabel className="fg-sr">{label}</SelectFieldLabel>
        <SelectTrigger variant={variant} size={size === "sm" ? "sm" : "default"}>
          <SelectValue placeholder="Choose…">
            {(current: string | null) => (current ? currencyLabel(current, locale) : "Choose…")}
          </SelectValue>
        </SelectTrigger>
      </div>
      <SelectContent>
        {currencies.map((code) => (
          <CurrencyPickerItem key={code} code={code} {...(locale ? { locale } : {})} />
        ))}
      </SelectContent>
    </Select>
  );
}

export type CurrencyPickerItemProps = Omit<SelectItemProps, "value" | "children" | "hint"> & {
  /** An ISO 4217 code. */
  code: string;
  locale?: string;
};

/** One currency of the list: `EUR · Euro`, its symbol at the end of the row. */
export function CurrencyPickerItem({ code, locale, ...rest }: CurrencyPickerItemProps) {
  return (
    <SelectItem {...rest} value={code} hint={symbolOf(code, locale)}>
      {currencyLabel(code, locale)}
    </SelectItem>
  );
}
