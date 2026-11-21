import type { ComponentProps, ReactNode } from "react";
import { cx } from "./cx";
import { renderPart } from "./shell-part";

export interface ChipProps extends Omit<ComponentProps<"span">, "className" | "children"> {
  /** Lit in ember: the selected or active one of a set. */
  active?: boolean;
  className?: string;
  /** Hands the chip's props to the one child element instead of rendering a span. */
  asChild?: boolean;
  children: ReactNode;
}

/** A small framed mono word: one of a set of options (MCP, API, Web, CLI). Not interactive. */
export function Chip({ active, className, asChild, children, ...rest }: ChipProps) {
  return renderPart("span", cx("fg-chip", active && "fg-chip-active", className), asChild, {
    "data-slot": "chip",
    ...rest,
    children,
  });
}
