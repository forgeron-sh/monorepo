// A one-time code: one cell per character, a paste fills them all, typing moves on.

import type { ClipboardEvent, KeyboardEvent } from "react";
import { useRef } from "react";
import { cx } from "./cx";
import { useControllableState } from "./hooks/use-controllable";

export interface OtpInputProps {
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

/** A code in cells. Characters move to the next cell, Backspace to the previous, arrows move. */
export function OtpInput({
  label,
  length = 6,
  value,
  defaultValue = "",
  onChange,
  onComplete,
  type = "numeric",
  mask,
  group,
  disabled,
  autoFocus,
  className,
  ...aria
}: OtpInputProps) {
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

  const onKeyDown = (i: number) => (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      event.preventDefault();
      if (code[i]) set(code.slice(0, i) + code.slice(i + 1), i);
      else if (i > 0) set(code.slice(0, i - 1) + code.slice(i), i - 1);
    } else if (event.key === "Delete") {
      event.preventDefault();
      set(code.slice(0, i) + code.slice(i + 1), i);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focus(i - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focus(i + 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focus(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focus(length - 1);
    }
  };
  const onPaste = (i: number) => (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const text = event.clipboardData.getData("text");
    // A whole code pasted anywhere fills every cell; a piece fills from the cell it lands in.
    put(clean(text).length >= length ? 0 : i, text);
  };

  return (
    <div role="group" aria-label={label} className={cx("fg-otp", className)}>
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            cells.current[i] = el;
          }}
          {...aria}
          className={cx(
            "fg-otp-cell",
            group !== undefined && i > 0 && i % group === 0 && "fg-otp-gap",
          )}
          type={mask ? "password" : "text"}
          inputMode={type === "numeric" ? "numeric" : "text"}
          autoComplete={i === 0 ? "one-time-code" : "off"}
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={1}
          aria-label={`${label}, character ${i + 1} of ${length}`}
          value={code[i] ?? ""}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          onFocus={(event) => event.target.select()}
          onChange={(event) => {
            const chars = clean(event.target.value);
            if (chars) put(i, chars);
            else if (event.target.value === "") set(code.slice(0, i) + code.slice(i + 1), i);
          }}
          onKeyDown={onKeyDown(i)}
          onPaste={onPaste(i)}
        />
      ))}
    </div>
  );
}
