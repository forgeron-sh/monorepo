// shadcn's InputGroup: one frame around an input or a textarea and what sits beside it (an icon, a
// unit, a button, a shortcut). The frame draws the border and the focus ring; the control inside is
// bare. `SearchBox` is a preset over it. Parts take `className` and `...rest`.

import { type ComponentProps, type MouseEvent } from "react";
import { Button, type ButtonProps } from "./button";
import { cx } from "./cx";

type Part<T> = Omit<T, "className"> & { className?: string };

/** The frame: a group that holds `InputGroupAddon`s and one `InputGroupInput` or `InputGroupTextarea`. */
export function InputGroup({ className, ...rest }: Part<ComponentProps<"div">>) {
  return (
    <div
      role="group"
      data-slot="input-group"
      {...rest}
      className={cx("fg-input-group", className)}
    />
  );
}

export type InputGroupAddonProps = Part<ComponentProps<"div">> & {
  /** Where it sits: before or after the control, or on a line above or below it. Default `inline-start`. */
  align?: "inline-start" | "inline-end" | "block-start" | "block-end";
};

/** What sits beside the control. A click on it (not on a button) puts the focus in the control. */
export function InputGroupAddon({
  align = "inline-start",
  className,
  onClick,
  ...rest
}: InputGroupAddonProps) {
  const focus = (event: MouseEvent<HTMLDivElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || (event.target as HTMLElement).closest("button, a")) return;
    event.currentTarget.parentElement
      ?.querySelector<HTMLElement>("[data-slot='input-group-control']")
      ?.focus();
  };
  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      {...rest}
      onClick={focus}
      className={cx("fg-input-group-addon", className)}
    />
  );
}

/** The text box, bare: the frame is the group's. */
export function InputGroupInput({ className, ...rest }: Part<ComponentProps<"input">>) {
  return (
    <input
      data-slot="input-group-control"
      {...rest}
      className={cx("fg-input-group-control", className)}
    />
  );
}

/** The several-lines text box, bare. */
export function InputGroupTextarea({ className, ...rest }: Part<ComponentProps<"textarea">>) {
  return (
    <textarea
      data-slot="input-group-control"
      {...rest}
      className={cx("fg-input-group-control fg-input-group-textarea", className)}
    />
  );
}

export type InputGroupButtonProps = Omit<ButtonProps, "size"> & {
  /** `xs` 22px (default), `sm` 28px, or a square of either. */
  size?: "xs" | "sm" | "icon-xs" | "icon-sm";
};

/** A button inside an addon: small, ghost by default. */
export function InputGroupButton({
  size = "xs",
  variant = "ghost",
  className,
  ...rest
}: InputGroupButtonProps) {
  return (
    <Button
      type="button"
      data-slot="input-group-button"
      data-size={size}
      variant={variant}
      size={size.startsWith("icon") ? "icon" : "sm"}
      {...(rest as ButtonProps)}
      className={cx("fg-input-group-btn", className)}
    />
  );
}

/** A piece of text in an addon: a unit, a prefix such as `https://`. */
export function InputGroupText({ className, ...rest }: Part<ComponentProps<"span">>) {
  return (
    <span data-slot="input-group-text" {...rest} className={cx("fg-input-group-text", className)} />
  );
}
