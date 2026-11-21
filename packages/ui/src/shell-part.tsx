// What the parts of the shell, the split pane and the settings share: an element that can hand its
// props to the one child element (`asChild`, as in shadcn), and a check for "the children are parts".

import {
  Children,
  cloneElement,
  createElement,
  isValidElement,
  type ElementType,
  type ReactNode,
} from "react";
import { cx } from "./cx";

/** A part's props: the element's own, with a plain string `className`. */
export type Part<T> = Omit<T, "className"> & { className?: string };

/**
 * Renders `tag` with `className` and `rest`; with `asChild` and one child element, that element
 * gets them instead (its own `className` is kept) and the tag is not rendered.
 */
export function renderPart(
  tag: ElementType,
  className: string | undefined,
  asChild: boolean | undefined,
  { children, ...rest }: { children?: ReactNode } & Record<string, unknown>,
): ReactNode {
  if (asChild && isValidElement<{ className?: string }>(children)) {
    return cloneElement(children, {
      ...rest,
      className: cx(className, children.props.className),
    } as never);
  }
  return createElement(tag, { ...rest, className }, children);
}

/** Whether one of the children is an element of one of `parts`: the parts form of a root. */
export function hasPart(children: ReactNode, parts: ReadonlyArray<unknown>): boolean {
  return Children.toArray(children).some(
    (child) => isValidElement(child) && parts.includes(child.type),
  );
}
