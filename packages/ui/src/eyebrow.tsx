import type { ComponentProps, ReactNode } from "react";
import { cx } from "./cx";
import { renderPart } from "./part";

export interface EyebrowProps extends Omit<ComponentProps<"span">, "className" | "children"> {
  className?: string;
  /** Hands the eyebrow's props to the one child element instead of rendering a span. */
  asChild?: boolean;
  children: ReactNode;
}

/** Eyebrow for a section or block: mono capitals (`text-eyebrow`), `ink-muted`. */
export function Eyebrow({ className, asChild, children, ...rest }: EyebrowProps) {
  return renderPart("span", cx("fg-label-eyebrow", "text-eyebrow", className), asChild, {
    "data-slot": "eyebrow",
    ...rest,
    children,
  });
}
