// shadcn's DropdownMenu parts (D-156), on Base UI's menu (D-147). Our props-driven menus are
// `Menu` and `ActionMenu` (action-menu.tsx), built from these parts.

import { Menu as Base } from "@base-ui/react/menu";
import { ArrowRight01Icon, Tick02Icon } from "@forgeron/icons";
import type { ComponentProps, HTMLAttributes } from "react";
import { asChildProps } from "./as-child";
import { cx } from "./cx";
import { Icon } from "./icon";

type Part<T> = Omit<T, "className"> & { className?: string };

/** The root: `open`, `defaultOpen`, `onOpenChange`, `modal`. */
export function DropdownMenu(props: ComponentProps<typeof Base.Root>) {
  return <Base.Root {...props} />;
}

export type DropdownMenuTriggerProps = Part<ComponentProps<typeof Base.Trigger>> & {
  asChild?: boolean;
};

export function DropdownMenuTrigger({
  asChild,
  children,
  className,
  ...rest
}: DropdownMenuTriggerProps) {
  return <Base.Trigger {...rest} className={className} {...asChildProps(asChild, children)} />;
}

export type DropdownMenuContentProps = Part<ComponentProps<typeof Base.Popup>> & {
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  sideOffset?: number;
};

/** The menu, in a portal. Arrows and typeahead move; Escape closes and returns focus. */
export function DropdownMenuContent({
  side = "bottom",
  align = "start",
  sideOffset = 4,
  className,
  ...rest
}: DropdownMenuContentProps) {
  return (
    <Base.Portal>
      <Base.Positioner
        className="fg-pop-positioner"
        side={side}
        align={align}
        sideOffset={sideOffset}
      >
        <Base.Popup {...rest} className={cx("fg-pop fg-pop-list", className)} />
      </Base.Positioner>
    </Base.Portal>
  );
}

export type DropdownMenuItemProps = Part<ComponentProps<typeof Base.Item>> & {
  /** `destructive`: in the danger tone. */
  variant?: "default" | "destructive";
  /** Leaves room on the left, as the checkbox items do. */
  inset?: boolean;
};

export function DropdownMenuItem({
  variant = "default",
  inset,
  className,
  ...rest
}: DropdownMenuItemProps) {
  return (
    <Base.Item
      {...rest}
      className={cx(
        "fg-pop-row",
        variant === "destructive" && "fg-pop-danger",
        inset && "fg-pop-inset",
        className,
      )}
    />
  );
}

export function DropdownMenuGroup({ className, ...rest }: Part<ComponentProps<typeof Base.Group>>) {
  return <Base.Group {...rest} className={className} />;
}

/** A heading in the menu; not an item. */
export function DropdownMenuLabel({
  inset,
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { inset?: boolean }) {
  return <div {...rest} className={cx("fg-pop-heading", inset && "fg-pop-inset", className)} />;
}

export function DropdownMenuSeparator({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div role="separator" {...rest} className={cx("fg-pop-sep", className)} />;
}

/** A shortcut on the right of an item, e.g. ⌘K. */
export function DropdownMenuShortcut({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span {...rest} className={cx("fg-pop-hint", className)} />;
}

export function DropdownMenuCheckboxItem({
  className,
  children,
  ...rest
}: Part<ComponentProps<typeof Base.CheckboxItem>>) {
  return (
    <Base.CheckboxItem {...rest} className={cx("fg-pop-row fg-pop-inset", className)}>
      <Base.CheckboxItemIndicator className="fg-pop-tick fg-pop-mark">
        <Icon icon={Tick02Icon} size={12} variant="mono" />
      </Base.CheckboxItemIndicator>
      {children}
    </Base.CheckboxItem>
  );
}

export function DropdownMenuRadioGroup(props: ComponentProps<typeof Base.RadioGroup>) {
  return <Base.RadioGroup {...props} />;
}

export function DropdownMenuRadioItem({
  className,
  children,
  ...rest
}: Part<ComponentProps<typeof Base.RadioItem>>) {
  return (
    <Base.RadioItem {...rest} className={cx("fg-pop-row fg-pop-inset", className)}>
      <Base.RadioItemIndicator className="fg-pop-tick fg-pop-mark">
        <Icon icon={Tick02Icon} size={12} variant="mono" />
      </Base.RadioItemIndicator>
      {children}
    </Base.RadioItem>
  );
}

export function DropdownMenuSub(props: ComponentProps<typeof Base.SubmenuRoot>) {
  return <Base.SubmenuRoot {...props} />;
}

/** An item that opens a submenu to the side. */
export function DropdownMenuSubTrigger({
  inset,
  className,
  children,
  ...rest
}: Part<ComponentProps<typeof Base.SubmenuTrigger>> & { inset?: boolean }) {
  return (
    <Base.SubmenuTrigger {...rest} className={cx("fg-pop-row", inset && "fg-pop-inset", className)}>
      <span className="fg-pop-label">{children}</span>
      <Icon icon={ArrowRight01Icon} size={12} variant="mono" />
    </Base.SubmenuTrigger>
  );
}

export function DropdownMenuSubContent({
  className,
  ...rest
}: Part<ComponentProps<typeof Base.Popup>>) {
  return (
    <Base.Portal>
      <Base.Positioner className="fg-pop-positioner" sideOffset={2} alignOffset={-5}>
        <Base.Popup {...rest} className={cx("fg-pop fg-pop-list", className)} />
      </Base.Positioner>
    </Base.Portal>
  );
}
