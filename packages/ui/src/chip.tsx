import type { ReactNode } from "react";
import { cx } from "./cx";

export interface ChipProps {
  /** Lit in ember: the selected or active one of a set. */
  active?: boolean;
  className?: string;
  children: ReactNode;
}

/** A small framed mono word: one of a set of options (MCP, API, Web, CLI). Not interactive. */
export function Chip({ active, className, children }: ChipProps) {
  return <span className={cx("fg-chip", active && "fg-chip-active", className)}>{children}</span>;
}
