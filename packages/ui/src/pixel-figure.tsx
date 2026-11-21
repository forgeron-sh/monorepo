import type { ComponentProps } from "react";
import { cx } from "./cx";
import { PixelText } from "./pixel-text";

export interface PixelFigureProps extends Omit<ComponentProps<"span">, "children"> {
  /** Drawn in the pixel face: a figure (`348`, `$14.99`), a step (`01`), a name. */
  text: string;
  /** Said to assistive technology; `text` by default. */
  label?: string;
  /** Height of the drawing: `sm` 20px (a name), `md` 32px (a price), `lg` 56px (a figure), `xl` 70px (a step). */
  size?: "sm" | "md" | "lg" | "xl";
  /** `accent` (default) in ember, `ink` in the text color, `inherit` from the parent. */
  tone?: "accent" | "ink" | "inherit";
}

/** A figure or a short word drawn in the pixel face at a fixed height, its width following. */
export function PixelFigure({
  text,
  label,
  size = "lg",
  tone = "accent",
  className,
  ...rest
}: PixelFigureProps) {
  return (
    <span
      {...rest}
      data-slot="pixel-figure"
      className={cx("fg-pfig", `fg-pfig-${size}`, `fg-pfig-${tone}`, className)}
    >
      <PixelText text={text} label={label ?? text} />
    </span>
  );
}
