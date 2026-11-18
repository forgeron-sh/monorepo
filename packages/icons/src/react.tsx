import { createElement, type ReactElement, type SVGProps } from "react";
import { iconTree, type SvgElement } from "./render";
import type { IconDefinition, IconRenderOptions } from "./types";

export interface IconProps
  extends
    IconRenderOptions,
    Omit<SVGProps<SVGSVGElement>, keyof IconRenderOptions | "children" | "ref"> {
  /** An icon of `@forgeron/icons`, for example `AnvilIcon`. */
  icon: IconDefinition;
}

/** `shape-rendering` → `shapeRendering`; `aria-*` and `data-*` stay as they are. */
const reactName = (name: string) =>
  name.startsWith("aria-") || name.startsWith("data-")
    ? name
    : name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

function toReact(el: SvgElement, key?: number, extra?: Record<string, unknown>): ReactElement {
  const props: Record<string, unknown> = key === undefined ? {} : { key };
  for (const [name, value] of Object.entries(el.attrs)) props[reactName(name)] = value;
  if (el.style) props.style = el.style;
  if (extra) Object.assign(props, extra);
  const children =
    el.text !== undefined ? [el.text] : (el.children ?? []).map((child, i) => toReact(child, i));
  return createElement(el.tag, props, ...children);
}

/**
 * Renders an icon of `@forgeron/icons`.
 */
export function Icon({
  icon,
  variant,
  size,
  color,
  secondaryColor,
  secondaryOpacity,
  title,
  ...rest
}: IconProps): ReactElement {
  const tree = iconTree(icon, {
    variant,
    size,
    color,
    secondaryColor,
    secondaryOpacity,
    title,
  });
  return toReact(tree, undefined, rest);
}
