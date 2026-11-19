// Numbers typed by people: a stepper field (NumberInput), an amount in a currency (MoneyInput,
// in minor units: 1250 is 12.50) and the list of currencies (CurrencyPicker). Text is read and
// written in the locale of the person, `1 234,50` or `1,234.50`.

import { MinusSignIcon, PlusSignIcon } from "@forgeron/icons";
import type { KeyboardEvent, ReactNode } from "react";
import { useState } from "react";
import { cx } from "./cx";
import { useControllableState } from "./hooks/use-controllable";
import { Icon } from "./icon";
import { SelectMenu } from "./overlays";

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
}

/**
 * A number with minus and plus buttons. Arrows add one step, Page keys ten, Home and End go to
 * the limits; the number is written in the locale and read back from it.
 */
export function NumberInput({
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
  prefix,
  suffix,
  buttons = true,
  placeholder,
  disabled,
  readOnly,
  id,
  className,
  ...aria
}: NumberInputProps) {
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

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
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

  const atMin = min !== undefined && current !== null && current <= min;
  const atMax = max !== undefined && current !== null && current >= max;
  const text = draft ?? (current === null ? "" : shown.format(current));

  return (
    <div
      className={cx(
        "fg-num",
        !buttons && "fg-num-bare",
        disabled && "fg-combo-disabled",
        aria["aria-invalid"] && "fg-num-invalid",
        className,
      )}
    >
      {buttons ? (
        <button
          type="button"
          className="fg-num-btn"
          tabIndex={-1}
          disabled={disabled || readOnly || atMin}
          aria-label={`Decrease ${label}`}
          onClick={() => bump(-step)}
        >
          <Icon icon={MinusSignIcon} size={12} variant="mono" />
        </button>
      ) : null}
      {prefix ? <span className="fg-num-affix">{prefix}</span> : null}
      <input
        {...aria}
        id={id}
        type="text"
        inputMode={digits > 0 ? "decimal" : "numeric"}
        role="spinbutton"
        aria-label={label}
        aria-valuenow={current ?? undefined}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={current === null ? "Empty" : shown.format(current)}
        className="fg-num-input"
        value={text}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        onFocus={() => !readOnly && setDraft(current === null ? "" : plain.format(current))}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={(event) => {
          if (draft !== null) commit(event.target.value);
        }}
        onKeyDown={onKeyDown}
      />
      {suffix ? <span className="fg-num-affix">{suffix}</span> : null}
      {buttons ? (
        <button
          type="button"
          className="fg-num-btn"
          tabIndex={-1}
          disabled={disabled || readOnly || atMax}
          aria-label={`Increase ${label}`}
          onClick={() => bump(step)}
        >
          <Icon icon={PlusSignIcon} size={12} variant="mono" />
        </button>
      ) : null}
    </div>
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
}

/** An amount of money: the symbol of the currency on the side the locale puts it, minor units out. */
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
  ...rest
}: MoneyInputProps) {
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
  const affix = (
    <span title={currency}>
      {symbol}
      <span className="fg-sr"> ({currency})</span>
    </span>
  );
  return (
    <NumberInput
      {...rest}
      label={label}
      locale={locale}
      value={minor === null ? null : minor / unit}
      onChange={(major) => setMinor(major === null ? null : Math.round(major * unit))}
      min={min === undefined ? undefined : min / unit}
      max={max === undefined ? undefined : max / unit}
      step={(step ?? unit) / unit}
      format={{ minimumFractionDigits: digits, maximumFractionDigits: digits }}
      buttons={false}
      {...(before ? { prefix: affix } : { suffix: affix })}
    />
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
}

/** A currency among a short list: the code, its name and its symbol. */
export function CurrencyPicker({
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
}: CurrencyPickerProps) {
  const names = new Intl.DisplayNames(locale ? [locale] : undefined, { type: "currency" });
  const symbolOf = (code: string) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
    })
      .formatToParts(0)
      .find((p) => p.type === "currency")?.value ?? code;
  return (
    <SelectMenu
      label={label}
      options={currencies.map((code) => ({
        value: code,
        label: `${code} · ${names.of(code) ?? code}`,
        hint: symbolOf(code),
      }))}
      {...(value !== undefined ? { value } : { defaultValue })}
      onChange={(next) => next && onChange?.(next)}
      size={size}
      variant={variant}
      {...(disabled !== undefined ? { disabled } : {})}
      {...(className ? { className } : {})}
    />
  );
}
