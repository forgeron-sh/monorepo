import { isValidElement, type ReactElement, type ReactNode } from "react";

/**
 * shadcn's `asChild` on a Base UI part (D-156): the one child element becomes the part's `render`,
 * so it gets the part's props and behaviour. Without `asChild`, the children stay children.
 */
export function asChildProps(
  asChild: boolean | undefined,
  children: ReactNode,
): { render: ReactElement } | { children: ReactNode } {
  return asChild && isValidElement(children) ? { render: children } : { children };
}
