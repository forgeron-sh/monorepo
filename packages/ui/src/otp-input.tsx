// A one-time code: one cell per character, a paste fills them all, typing moves on. As shadcn's
// InputOTP (D-156): `InputOTP` holds the code, `InputOTPGroup` and `InputOTPSeparator` lay the
// cells out, `InputOTPSlot` is one cell. `OtpInput` is the props form, built from those parts.

import type { ClipboardEvent, ComponentProps, KeyboardEvent, ReactNode } from "react";
import { createContext, useContext, useRef } from "react";
import { cx } from "./cx";
import { useControllableState } from "./hooks/use-controllable";

export interface OtpInputProps extends Omit<
  ComponentProps<"div">,
  "onChange" | "defaultValue" | "children" | "className" | "aria-invalid" | "aria-describedby"
> {
  /** Names the group, e.g. "Verification code". Each cell reads "… character 3 of 6". */
  label: string;
  /** How many characters. Default 6. */
  length?: number;
  /** The code so far: at most `length` characters. */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Called once, when the last cell is filled. */
  onComplete?: (value: string) => void;
  /** `numeric` (default): digits, with a numeric keyboard. `alphanumeric`: letters and digits. */
  type?: "numeric" | "alphanumeric";
  /** Shows dots instead of the characters. */
  mask?: boolean;
  /** Adds a gap in the middle (`3` and `3` for six): `group` is the size of a group. */
  group?: number;
  disabled?: boolean;
  /** Gives focus to the first cell on mount. */
  autoFocus?: boolean;
  "aria-invalid"?: boolean | undefined;
  "aria-describedby"?: string | undefined;
  className?: string;
}

/* ---------------------------------------------------------------- InputOTP (parts) */

export interface InputOTPProps extends Omit<
  ComponentProps<"div">,
  "onChange" | "defaultValue" | "children" | "className" | "aria-invalid" | "aria-describedby"
> {
  /** Names the group. Each cell reads "… character 3 of 6". Default "One-time code". */
  label?: string;
  /** How many characters, so how many `InputOTPSlot`. Default 6. */
  maxLength?: number;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Called once, when the last cell is filled. */
  onComplete?: (value: string) => void;
  /** `numeric` (default): digits, with a numeric keyboard. `alphanumeric`: letters and digits. */
  type?: "numeric" | "alphanumeric";
  /** Shows dots instead of the characters. */
  mask?: boolean;
  disabled?: boolean;
  /** Gives focus to the first cell on mount. */
  autoFocus?: boolean;
  "aria-invalid"?: boolean | undefined;
  "aria-describedby"?: string | undefined;
  className?: string;
  /** `InputOTPGroup`, `InputOTPSlot` and `InputOTPSeparator`. */
  children?: ReactNode;
}

interface OtpState {
  code: string;
  length: number;
  label: string;
  numeric: boolean;
  mask: boolean | undefined;
  disabled: boolean | undefined;
  autoFocus: boolean | undefined;
  aria: { "aria-invalid"?: boolean | undefined; "aria-describedby"?: string | undefined };
  register: (index: number, el: HTMLInputElement | null) => void;
  clean: (text: string) => string;
  put: (at: number, text: string) => void;
  set: (next: string, focusAt: number) => void;
  focus: (index: number) => void;
}

const OtpContext = createContext<OtpState | null>(null);

/** The state of the enclosing `InputOTP`: the code so far and how long it is. */
export function useInputOTP(): { value: string; length: number; disabled: boolean } {
  const state = useContext(OtpContext);
  if (!state) throw new Error("InputOTP parts go inside <InputOTP>.");
  return { value: state.code, length: state.length, disabled: Boolean(state.disabled) };
}

/** A code in cells. Characters move to the next cell, Backspace to the previous, arrows move. */
export function InputOTP({
  label = "One-time code",
  maxLength: length = 6,
  value,
  defaultValue = "",
  onChange,
  onComplete,
  type = "numeric",
  mask,
  disabled,
  autoFocus,
  className,
  children,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  ...rest
}: InputOTPProps) {
  const aria = {
    ...(ariaInvalid !== undefined ? { "aria-invalid": ariaInvalid } : {}),
    ...(ariaDescribedBy !== undefined ? { "aria-describedby": ariaDescribedBy } : {}),
  };
  const [code, setCode] = useControllableState<string>({ value, defaultValue, onChange });
  const cells = useRef<Array<HTMLInputElement | null>>([]);
  const allowed = type === "numeric" ? /[0-9]/ : /[a-z0-9]/i;
  const clean = (text: string) => [...text].filter((c) => allowed.test(c)).join("");

  const focus = (i: number) => {
    const cell = cells.current[Math.min(length - 1, Math.max(0, i))];
    cell?.focus();
    cell?.select();
  };
  const set = (next: string, focusAt: number) => {
    const trimmed = next.slice(0, length);
    setCode(trimmed);
    if (trimmed.length === length && trimmed !== code) onComplete?.(trimmed);
    focus(focusAt);
  };
  /** Puts `text` into the cells from `at` (never past the end of the code), over what was there. */
  const put = (at: number, text: string) => {
    const chars = clean(text);
    if (!chars) return;
    const from = Math.min(at, code.length);
    set(code.slice(0, from) + chars + code.slice(from + chars.length), from + chars.length);
  };
  const state: OtpState = {
    code,
    length,
    label,
    numeric: type === "numeric",
    mask,
    disabled,
    autoFocus,
    aria,
    register: (index, el) => {
      cells.current[index] = el;
    },
    clean,
    put,
    set,
    focus,
  };

  return (
    <OtpContext.Provider value={state}>
      <div
        role="group"
        aria-label={label}
        data-slot="input-otp"
        {...rest}
        className={cx("fg-otp", className)}
      >
        {children}
      </div>
    </OtpContext.Provider>
  );
}

/** Cells that sit together; put a `InputOTPSeparator` between groups. */
export function InputOTPGroup({ className, ...rest }: ComponentProps<"div">) {
  return (
    <div
      role="presentation"
      data-slot="input-otp-group"
      {...rest}
      className={cx("fg-otp-group", className)}
    />
  );
}

/** The dash between two groups of cells. Decorative. */
export function InputOTPSeparator({ className, children, ...rest }: ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      data-slot="input-otp-separator"
      {...rest}
      className={cx("fg-otp-sep", className)}
    >
      {children ?? <span className="fg-otp-dash" />}
    </div>
  );
}

export type InputOTPSlotProps = Omit<
  ComponentProps<"input">,
  "value" | "defaultValue" | "onChange" | "type" | "maxLength" | "className"
> & {
  /** Which character of the code this cell holds, from 0. */
  index: number;
  className?: string;
};

/** One cell: one character. */
export function InputOTPSlot({ index, className, ...rest }: InputOTPSlotProps) {
  const otp = useContext(OtpContext);
  if (!otp) throw new Error("InputOTP parts go inside <InputOTP>.");
  const { code, length, label } = otp;

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const i = index;
    if (event.key === "Backspace") {
      event.preventDefault();
      if (code[i]) otp.set(code.slice(0, i) + code.slice(i + 1), i);
      else if (i > 0) otp.set(code.slice(0, i - 1) + code.slice(i), i - 1);
    } else if (event.key === "Delete") {
      event.preventDefault();
      otp.set(code.slice(0, i) + code.slice(i + 1), i);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      otp.focus(i - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      otp.focus(i + 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      otp.focus(0);
    } else if (event.key === "End") {
      event.preventDefault();
      otp.focus(length - 1);
    }
  };
  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const text = event.clipboardData.getData("text");
    // A whole code pasted anywhere fills every cell; a piece fills from the cell it lands in.
    otp.put(otp.clean(text).length >= length ? 0 : index, text);
  };

  return (
    <input
      ref={(el) => otp.register(index, el)}
      {...otp.aria}
      data-slot="input-otp-slot"
      {...rest}
      className={cx("fg-otp-cell", className)}
      type={otp.mask ? "password" : "text"}
      inputMode={otp.numeric ? "numeric" : "text"}
      autoComplete={index === 0 ? "one-time-code" : "off"}
      autoCapitalize="characters"
      spellCheck={false}
      maxLength={1}
      aria-label={`${label}, character ${index + 1} of ${length}`}
      value={code[index] ?? ""}
      disabled={otp.disabled}
      autoFocus={otp.autoFocus && index === 0}
      onFocus={(event) => event.target.select()}
      onChange={(event) => {
        const chars = otp.clean(event.target.value);
        if (chars) otp.put(index, chars);
        else if (event.target.value === "")
          otp.set(code.slice(0, index) + code.slice(index + 1), index);
      }}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
    />
  );
}

/* ---------------------------------------------------------------- OtpInput (props) */

/** A code in cells, from its props: `InputOTP` with a `InputOTPSlot` per character. */
export function OtpInput({ label, length = 6, group, ...rest }: OtpInputProps) {
  return (
    <InputOTP label={label} maxLength={length} {...rest}>
      {Array.from({ length }, (_, i) => (
        <InputOTPSlot
          key={i}
          index={i}
          className={group !== undefined && i > 0 && i % group === 0 ? "fg-otp-gap" : undefined}
        />
      ))}
    </InputOTP>
  );
}
