import type { ReactNode } from "react";
import { cx } from "./cx";

export interface TagProps {
  /** The emphasized part, in `ink` (a section name, an index such as `/1.2`). */
  strong?: ReactNode;
  className?: string;
  children?: ReactNode;
}

/** A bracketed mono label, `[ Strong rest ]`: section names, file metadata, versions. */
export function Tag({ strong, className, children }: TagProps) {
  return (
    <span className={cx("fg-tag", className)}>
      {strong !== undefined ? <b>{strong}</b> : null}
      {strong !== undefined && children !== undefined ? " " : null}
      {children}
    </span>
  );
}
