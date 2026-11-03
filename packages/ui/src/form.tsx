import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { useId } from "react";
import { cx } from "./cx";

export interface FieldProps {
  label: ReactNode;
  /** Help under the control. */
  hint?: ReactNode;
  /** What happened, then what to do. */
  error?: ReactNode;
  className?: string;
  /** The control; it gets `id`, `aria-describedby` and `aria-invalid` from the function form. */
  children: (control: {
    id: string;
    "aria-describedby": string | undefined;
    "aria-invalid": true | undefined;
  }) => ReactNode;
}

/** A label, a control, a hint and an error, tied together for assistive technology. */
export function Field({ label, hint, error, className, children }: FieldProps) {
  const id = useId();
  const described = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={cx("fg-field", className)}>
      <label className="fg-field-label" htmlFor={id}>
        {label}
      </label>
      {children({
        id,
        "aria-describedby": described || undefined,
        "aria-invalid": error ? true : undefined,
      })}
      {hint ? (
        <p id={`${id}-hint`} className="fg-field-hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="fg-field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Text input, 32px, sharp corners. `mono` for what gets copy-pasted (domains, identifiers). */
export function Input({
  mono,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { mono?: boolean }) {
  return <input {...rest} className={cx("fg-input", mono && "fg-input-mono", className)} />;
}

export function Textarea({
  mono,
  className,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { mono?: boolean }) {
  return (
    <textarea
      {...rest}
      className={cx("fg-input fg-textarea", mono && "fg-input-mono", className)}
    />
  );
}

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
}

/** A square box that fills with `inverse` when checked. */
export function Checkbox({ label, className, ...rest }: CheckboxProps) {
  return (
    <label className={cx("fg-check", className)}>
      <input {...rest} type="checkbox" className="fg-check-input" />
      <span>{label}</span>
    </label>
  );
}
