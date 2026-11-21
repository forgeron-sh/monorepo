// A row of tools that is one tab stop: arrows move between them (roving tabindex), Home and End go
// to the ends. Base UI keeps the focus order; buttons and separators are ours. Every part forwards
// the props of its Base UI part, takes `className`, and a button takes `render` or `asChild` so a
// `Toggle` or a `DropdownMenuTrigger` can be a tool (D-156).

import { Toolbar as Base } from "@base-ui/react/toolbar";
import type { IconDefinition } from "@forgeron/icons";
import type { ComponentProps, ReactNode } from "react";
import { asChildProps } from "./part";
import { cx } from "./cx";
import { Icon } from "./icon";

type Part<T, K extends string = never> = Omit<T, "className" | "children" | K> & {
  className?: string;
};

export type ToolbarProps = Part<ComponentProps<typeof Base.Root>, "orientation" | "loopFocus"> & {
  /** Names the toolbar: "Text formatting". */
  label: string;
  orientation?: "horizontal" | "vertical";
  /** Arrows wrap from the last tool to the first. Default `true`. */
  loop?: boolean;
  children?: ReactNode;
};

/** The container of `ToolbarButton`, `ToolbarGroup`, `ToolbarSeparator`, `ToolbarLink`. */
export function Toolbar({
  label,
  orientation = "horizontal",
  loop = true,
  className,
  children,
  ...rest
}: ToolbarProps) {
  return (
    <Base.Root
      aria-label={label}
      data-slot="toolbar"
      {...rest}
      orientation={orientation}
      loopFocus={loop}
      className={cx("fg-toolbar", orientation === "vertical" && "fg-toolbar-v", className)}
    >
      {children}
    </Base.Root>
  );
}

export type ToolbarButtonProps = Part<ComponentProps<typeof Base.Button>> & {
  /**
   * Its name. Shown as text when there is no `icon` and no `children`; said to assistive
   * technology (`aria-label`, tooltip) otherwise.
   */
  label?: string;
  icon?: IconDefinition;
  /** A toggle: `true` while the tool is on (bold, a view). Leave out for a plain action. */
  pressed?: boolean;
  /** Mono text after the label: a shortcut. */
  kbd?: string;
  /** The one child element becomes the tool (shadcn's `asChild`); same as `render`. */
  asChild?: boolean;
  /** What the tool shows, in place of `icon` / `label`. */
  children?: ReactNode;
};

/**
 * One tool: an icon, a word in mono capitals, or whatever `children` are. With `pressed` it
 * toggles and says so.
 */
export function ToolbarButton({
  label,
  icon,
  pressed,
  kbd,
  asChild,
  className,
  children,
  ...rest
}: ToolbarButtonProps) {
  const content =
    children ??
    (icon ? <Icon icon={icon} size={12} variant="mono" /> : label ? <span>{label}</span> : null);
  const inner = asChildProps(asChild, content);
  const named = icon !== undefined || children !== undefined;
  return (
    <Base.Button
      type="button"
      {...(named && label ? { "aria-label": label } : {})}
      {...(icon && label ? { title: label } : {})}
      {...(pressed !== undefined ? { "aria-pressed": pressed } : {})}
      focusableWhenDisabled
      data-slot="toolbar-button"
      {...rest}
      className={cx(
        "fg-tool",
        icon && !kbd && !children && "fg-tool-icon",
        pressed && "fg-tool-on",
        className,
      )}
      {...("render" in inner ? inner : {})}
    >
      {"render" in inner ? undefined : (
        <>
          {inner.children}
          {kbd ? <span className="fg-tool-kbd">{kbd}</span> : null}
        </>
      )}
    </Base.Button>
  );
}

export type ToolbarLinkProps = Part<ComponentProps<typeof Base.Link>> & {
  href?: string;
  asChild?: boolean;
  children?: ReactNode;
};

/** A link among the tools. */
export function ToolbarLink({ asChild, className, children, ...rest }: ToolbarLinkProps) {
  const inner = asChildProps(asChild, children);
  return (
    <Base.Link data-slot="toolbar-link" {...rest} className={cx("fg-tool", className)} {...inner}>
      {"render" in inner ? undefined : inner.children}
    </Base.Link>
  );
}

/** A thin line between two groups of tools. */
export function ToolbarSeparator({
  className,
  ...rest
}: Part<ComponentProps<typeof Base.Separator>>) {
  return (
    <Base.Separator
      data-slot="toolbar-separator"
      {...rest}
      className={cx("fg-tool-sep", className)}
    />
  );
}

export type ToolbarGroupProps = Part<ComponentProps<typeof Base.Group>> & {
  label?: string;
  children?: ReactNode;
};

/** Tools that belong together, side by side with no gap. */
export function ToolbarGroup({ label, className, children, ...rest }: ToolbarGroupProps) {
  return (
    <Base.Group
      aria-label={label}
      data-slot="toolbar-group"
      {...rest}
      className={cx("fg-tool-group", className)}
    >
      {children}
    </Base.Group>
  );
}
