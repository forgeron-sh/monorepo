// A row of tools that is one tab stop: arrows move between them (roving tabindex), Home and End go
// to the ends. Base UI keeps the focus order; buttons and separators are ours.

import { Toolbar as Base } from "@base-ui/react/toolbar";
import type { IconDefinition } from "@forgeron/icons";
import type { ReactNode } from "react";
import { cx } from "./cx";
import { Icon } from "./icon";

export interface ToolbarProps {
  /** Names the toolbar: "Text formatting". */
  label: string;
  orientation?: "horizontal" | "vertical";
  /** Arrows wrap from the last tool to the first. Default `true`. */
  loop?: boolean;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

/** The container of `ToolbarButton`, `ToolbarGroup`, `ToolbarSeparator`, `ToolbarLink`. */
export function Toolbar({
  label,
  orientation = "horizontal",
  loop = true,
  disabled,
  className,
  children,
}: ToolbarProps) {
  return (
    <Base.Root
      aria-label={label}
      orientation={orientation}
      loopFocus={loop}
      disabled={disabled}
      className={cx("fg-toolbar", orientation === "vertical" && "fg-toolbar-v", className)}
    >
      {children}
    </Base.Root>
  );
}

export interface ToolbarButtonProps {
  /** Its name. Shown as text when there is no `icon`; said to assistive technology otherwise. */
  label: string;
  icon?: IconDefinition;
  /** A toggle: `true` while the tool is on (bold, a view). Leave out for a plain action. */
  pressed?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  /** Mono text after the label: a shortcut. */
  kbd?: string;
  className?: string;
}

/** One tool: an icon, or a word in mono capitals. With `pressed` it toggles and says so. */
export function ToolbarButton({
  label,
  icon,
  pressed,
  onClick,
  disabled,
  kbd,
  className,
}: ToolbarButtonProps) {
  return (
    <Base.Button
      type="button"
      aria-label={icon ? label : undefined}
      aria-pressed={pressed}
      title={icon ? label : undefined}
      disabled={disabled}
      focusableWhenDisabled
      onClick={onClick}
      className={cx("fg-tool", icon && !kbd && "fg-tool-icon", pressed && "fg-tool-on", className)}
    >
      {icon ? <Icon icon={icon} size={12} variant="mono" /> : <span>{label}</span>}
      {kbd ? <span className="fg-tool-kbd">{kbd}</span> : null}
    </Base.Button>
  );
}

export interface ToolbarLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

/** A link among the tools. */
export function ToolbarLink({ href, children, className }: ToolbarLinkProps) {
  return (
    <Base.Link href={href} className={cx("fg-tool", className)}>
      {children}
    </Base.Link>
  );
}

/** A thin line between two groups of tools. */
export function ToolbarSeparator({ className }: { className?: string }) {
  return <Base.Separator className={cx("fg-tool-sep", className)} />;
}

/** Tools that belong together, side by side with no gap. */
export function ToolbarGroup({
  label,
  className,
  children,
}: {
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Base.Group aria-label={label} className={cx("fg-tool-group", className)}>
      {children}
    </Base.Group>
  );
}
