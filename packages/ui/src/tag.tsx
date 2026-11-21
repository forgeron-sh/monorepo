import { cloneElement, isValidElement, type ComponentProps, type ReactNode } from "react";
import { cx } from "./cx";

export interface TagProps extends Omit<ComponentProps<"span">, "className" | "children"> {
  /** The emphasized part, in `ink` (a section name, an index such as `/1.2`). */
  strong?: ReactNode;
  className?: string;
  /** Hands the tag's props to the one child element, which gets `strong` and its own content. */
  asChild?: boolean;
  children?: ReactNode;
}

/** A bracketed mono label, `[ Strong rest ]`: section names, file metadata, versions. */
export function Tag({ strong, className, asChild, children, ...rest }: TagProps) {
  if (asChild && isValidElement<{ className?: string; children?: ReactNode }>(children)) {
    const inner = children.props.children;
    return cloneElement(
      children,
      {
        "data-slot": "tag",
        ...rest,
        className: cx("fg-tag", className, children.props.className),
      } as never,
      strong !== undefined ? <b>{strong}</b> : null,
      strong !== undefined && inner !== undefined ? " " : null,
      inner,
    );
  }
  return (
    <span data-slot="tag" {...rest} className={cx("fg-tag", className)}>
      {strong !== undefined ? <b>{strong}</b> : null}
      {strong !== undefined && children !== undefined ? " " : null}
      {children}
    </span>
  );
}
