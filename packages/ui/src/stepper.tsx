// A whole number with a minus button and a plus button, as markup the page wires (`data-step`
// holds -1 or 1). `Stepper` is the props form; `StepperDecrement`, `StepperField` and
// `StepperIncrement` are the parts it is built from, for a different order or other glyphs.

import { MinusSignIcon, PlusSignIcon } from "@forgeron/icons";
import type { ComponentProps, HTMLAttributes, ReactNode } from "react";
import { createContext, useContext } from "react";
import { cx } from "./cx";
import { Icon } from "./icon";

export interface StepperProps extends Omit<HTMLAttributes<HTMLSpanElement>, "onChange"> {
  /** Accessible name of the number field; the buttons read "Fewer: …" and "More: …". */
  label: string;
  /** The starting value, a whole number from 0 to 9999. */
  value: number;
}

/** `value` stays undefined: with a value, `Stepper` is the props form. */
export type StepperRootProps = Omit<HTMLAttributes<HTMLSpanElement>, "onChange"> & {
  value?: undefined;
  /** Names the field; the buttons read "Fewer: …" and "More: …". */
  label: string;
  /** `StepperDecrement`, `StepperField`, `StepperIncrement`. */
  children?: ReactNode;
};

const LabelContext = createContext("");

/**
 * With `value`: a whole number with a minus button on its left and a plus button on its right.
 * The markup only: the page wires the buttons (`data-step` holds -1 or 1) and reads the field.
 * Without: the root of the parts.
 */
export function Stepper(props: StepperProps | StepperRootProps) {
  return props.value !== undefined ? (
    <StepperBox {...props} />
  ) : (
    <StepperRoot {...(props as StepperRootProps)} />
  );
}

function StepperBox({ label, value, ...rest }: StepperProps) {
  return (
    <StepperRoot {...rest} label={label}>
      <StepperDecrement />
      <StepperField defaultValue={value} />
      <StepperIncrement />
    </StepperRoot>
  );
}

function StepperRoot({ label, value: _value, className, children, ...rest }: StepperRootProps) {
  return (
    <LabelContext.Provider value={label}>
      <span {...rest} className={cx("fg-stepper", className)}>
        {children}
      </span>
    </LabelContext.Provider>
  );
}

export type StepperButtonProps = ComponentProps<"button">;

/** The minus button. `data-step="-1"`. Its children replace the glyph. */
export function StepperDecrement(props: StepperButtonProps) {
  const label = useContext(LabelContext);
  return <StepperButton step={-1} aria-label={`Fewer: ${label}`} {...props} />;
}

/** The plus button. `data-step="1"`. Its children replace the glyph. */
export function StepperIncrement(props: StepperButtonProps) {
  const label = useContext(LabelContext);
  return <StepperButton step={1} aria-label={`More: ${label}`} {...props} />;
}

function StepperButton({ step, children, ...rest }: StepperButtonProps & { step: 1 | -1 }) {
  return (
    <button type="button" data-step={step} {...rest}>
      {children ?? <Icon icon={step === 1 ? PlusSignIcon : MinusSignIcon} size={12} />}
    </button>
  );
}

/** The number field: whole numbers from 0 to 9999 unless told otherwise. */
export function StepperField(props: ComponentProps<"input">) {
  const label = useContext(LabelContext);
  return (
    <input
      type="number"
      inputMode="numeric"
      min="0"
      max="9999"
      step="1"
      aria-label={label}
      {...props}
    />
  );
}
