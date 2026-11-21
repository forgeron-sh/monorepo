// What every part shares, primitives and blocks alike (D-156, D-164): the shadcn shape of a part
// is an element with its `data-slot`, the caller's `className` and `...rest`, and `asChild` to hand
// all of it to its one child element. One module, so every part does it the same way.

import { useRender } from "@base-ui/react/use-render";
import {
  Children,
  cloneElement,
  createContext,
  createElement,
  isValidElement,
  useContext,
  type ComponentProps,
  type Context,
  type ElementType,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { cx } from "./cx";

/** A part's props: the element's own, with a plain string `className`. */
export type Part<T> = Omit<T, "className"> & { className?: string };

/** The props of a part drawn as the element `T`, with `asChild`. */
export type PartProps<T extends ElementType> = Part<ComponentProps<T>> & { asChild?: boolean };

/**
 * shadcn's `asChild` on a Base UI part: the one child element becomes the part's `render`, so it
 * gets the part's props and behaviour. Without `asChild`, the children stay children.
 */
export function asChildProps(
  asChild: boolean | undefined,
  children: ReactNode,
): { render: ReactElement } | { children: ReactNode } {
  return asChild && isValidElement(children) ? { render: children } : { children };
}

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
      className: cx(className, children.props.className) || undefined,
    } as never);
  }
  return createElement(tag, { ...rest, className }, children);
}

/** Renders a part: `tag` with `base` and the caller's class, its `data-slot`, and the rest. */
export function part<T extends ElementType>(
  tag: T,
  slot: string,
  base: string | false | undefined,
  { asChild, className, ...rest }: PartProps<T>,
  extra?: Record<string, unknown>,
): ReactNode {
  return renderPart(tag, cx(base, className) || undefined, asChild, {
    "data-slot": slot,
    ...extra,
    ...(rest as Record<string, unknown>),
  });
}

/**
 * Draws `Primitive` with `props`: a part of a block that is a primitive. With `asChild` and one
 * child element, that element is drawn instead (a `tag` when it is not one), wearing `base` (the
 * class the primitive would give), `className` and `props`.
 */
export function primitivePart(
  Primitive: ElementType,
  tag: ElementType,
  base: string,
  asChild: boolean | undefined,
  className: string | undefined,
  props: { children?: ReactNode } & Record<string, unknown>,
): ReactNode {
  if (asChild) return renderPart(tag, cx(base, className), true, props);
  return createElement(Primitive, { ...props, className });
}

/** Whether one of the children is an element of one of `parts`: the parts form of a root. */
export function hasPart(children: ReactNode, parts: ReadonlyArray<unknown>): boolean {
  return Children.toArray(children).some(
    (child) => isValidElement(child) && parts.includes(child.type),
  );
}

/** A root's context and its hook: the hook throws `The parts of <Root> go inside a <Root>.`. */
export function partContext<T>(root: string): [Context<T | null>, () => T] {
  const Ctx = createContext<T | null>(null);
  const use = (): T => {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error(`The parts of ${root} go inside a <${root}>.`);
    return ctx;
  };
  return [Ctx, use];
}

export interface PartElementProps {
  /** The tag drawn when neither `asChild` nor `render` is given. Default `div`. */
  as?: string;
  /** The one child element is the part: it gets its props and its behaviour. */
  asChild?: boolean;
  /** Another element in place of the tag (Base UI's `render`). */
  render?: ReactElement;
  ref?: Ref<HTMLElement>;
  children?: ReactNode;
  [prop: string]: unknown;
}

/** A part as a component: the tag, its one child (`asChild`), or the `render` element. */
export function PartElement({
  as = "div",
  asChild,
  render,
  ref,
  children,
  ...rest
}: PartElementProps) {
  const child = asChild && isValidElement(children) ? (children as ReactElement) : undefined;
  return useRender({
    defaultTagName: as as "div",
    render: child ?? render,
    ref,
    props: child ? rest : { ...rest, children },
  });
}
