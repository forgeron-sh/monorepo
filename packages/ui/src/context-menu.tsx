// The right-click menu: `ContextMenu` with `items` is the props-driven one (the same rows as
// `ActionMenu`, built from these parts); without `items` it is the root of shadcn's parts
// (`ContextMenuTrigger`, `ContextMenuContent`…), D-156. Base UI's ContextMenu.

import { ContextMenu as BaseContextMenu } from "@base-ui/react/context-menu";
import { Menu } from "@base-ui/react/menu";
import { ArrowRight01Icon, Tick02Icon } from "@forgeron/icons";
import type { ComponentProps, HTMLAttributes, ReactNode } from "react";
import { asChildProps } from "./part";
import { MenuEntries, type MenuBase, type MenuKit } from "./action-menu";
import { cx } from "./cx";
import { Icon } from "./icon";

export interface ContextMenuProps extends MenuBase {
  /** The area that opens the menu on right click or long press: a row, a card. */
  children: ReactNode;
  /** Classes of the area. */
  areaClassName?: string;
}

/**
 * With `items`: the same menu on a right click (or a long press) anywhere in an area, a row of a
 * list. Without: the root of shadcn's parts (`ContextMenuTrigger`, `ContextMenuContent`…), D-156.
 */
export function ContextMenu(props: ContextMenuProps | ContextMenuRootProps) {
  return props.items !== undefined ? (
    <ContextMenuList {...(props as ContextMenuProps)} />
  ) : (
    <ContextMenuRoot {...(props as ContextMenuRootProps)} />
  );
}

function ContextMenuList({
  items,
  onSelect,
  label,
  children,
  areaClassName,
  className,
  ...rest
}: ContextMenuProps) {
  return (
    <ContextMenuRoot>
      <ContextMenuTrigger className={areaClassName}>{children}</ContextMenuTrigger>
      <ContextMenuContent {...rest} className={cx("fg-amenu", className)} aria-label={label}>
        <MenuEntries items={items} onSelect={onSelect} kit={CONTEXT_KIT} />
      </ContextMenuContent>
    </ContextMenuRoot>
  );
}

/* ---------------------------------------------------------------- shadcn parts (D-156) */

type Part<T> = Omit<T, "className"> & { className?: string };

/** `items` stays undefined: with items, `ContextMenu` is the props-driven menu. */
export type ContextMenuRootProps = ComponentProps<typeof BaseContextMenu.Root> & {
  items?: undefined;
};

function ContextMenuRoot({ items: _items, ...props }: ContextMenuRootProps) {
  return <BaseContextMenu.Root {...props} />;
}

export type ContextMenuTriggerProps = Part<ComponentProps<typeof BaseContextMenu.Trigger>> & {
  asChild?: boolean;
};

/** The area that opens the menu on right click or long press. */
export function ContextMenuTrigger({
  asChild,
  children,
  className,
  ...rest
}: ContextMenuTriggerProps) {
  return (
    <BaseContextMenu.Trigger
      data-slot="context-menu-trigger"
      {...rest}
      className={className}
      {...asChildProps(asChild, children)}
    />
  );
}

export type ContextMenuContentProps = Part<ComponentProps<typeof BaseContextMenu.Popup>>;

/** The menu, at the pointer, in a portal. Arrows and typeahead move; Escape closes. */
export function ContextMenuContent({ className, ...rest }: ContextMenuContentProps) {
  return (
    <BaseContextMenu.Portal>
      <BaseContextMenu.Positioner className="fg-pop-positioner">
        <BaseContextMenu.Popup
          data-slot="context-menu-content"
          {...rest}
          className={cx("fg-pop fg-pop-list", className)}
        />
      </BaseContextMenu.Positioner>
    </BaseContextMenu.Portal>
  );
}

export type ContextMenuItemProps = Part<ComponentProps<typeof BaseContextMenu.Item>> & {
  /** `destructive`: in the danger tone. */
  variant?: "default" | "destructive";
  /** Leaves room on the left, as the checkbox items do. */
  inset?: boolean;
};

export function ContextMenuItem({
  variant = "default",
  inset,
  className,
  ...rest
}: ContextMenuItemProps) {
  return (
    <BaseContextMenu.Item
      data-slot="context-menu-item"
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

export function ContextMenuGroup({
  className,
  ...rest
}: Part<ComponentProps<typeof BaseContextMenu.Group>>) {
  return <BaseContextMenu.Group data-slot="context-menu-group" {...rest} className={className} />;
}

/** A heading in the menu; not an item. */
export function ContextMenuLabel({
  inset,
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { inset?: boolean }) {
  return (
    <div
      data-slot="context-menu-label"
      {...rest}
      className={cx("fg-pop-heading", inset && "fg-pop-inset", className)}
    />
  );
}

export function ContextMenuSeparator({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="separator"
      data-slot="context-menu-separator"
      {...rest}
      className={cx("fg-pop-sep", className)}
    />
  );
}

/** A shortcut on the right of an item, e.g. ⌘K. */
export function ContextMenuShortcut({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span data-slot="context-menu-shortcut" {...rest} className={cx("fg-pop-hint", className)} />
  );
}

export function ContextMenuCheckboxItem({
  className,
  children,
  ...rest
}: Part<ComponentProps<typeof BaseContextMenu.CheckboxItem>>) {
  return (
    <BaseContextMenu.CheckboxItem
      data-slot="context-menu-checkbox-item"
      {...rest}
      className={cx("fg-pop-row fg-pop-inset", className)}
    >
      <BaseContextMenu.CheckboxItemIndicator className="fg-pop-tick fg-pop-mark">
        <Icon icon={Tick02Icon} size={12} variant="mono" />
      </BaseContextMenu.CheckboxItemIndicator>
      {children}
    </BaseContextMenu.CheckboxItem>
  );
}

export function ContextMenuRadioGroup(props: ComponentProps<typeof BaseContextMenu.RadioGroup>) {
  return <BaseContextMenu.RadioGroup data-slot="context-menu-radio-group" {...props} />;
}

export function ContextMenuRadioItem({
  className,
  children,
  ...rest
}: Part<ComponentProps<typeof BaseContextMenu.RadioItem>>) {
  return (
    <BaseContextMenu.RadioItem
      data-slot="context-menu-radio-item"
      {...rest}
      className={cx("fg-pop-row fg-pop-inset", className)}
    >
      <BaseContextMenu.RadioItemIndicator className="fg-pop-tick fg-pop-mark">
        <Icon icon={Tick02Icon} size={12} variant="mono" />
      </BaseContextMenu.RadioItemIndicator>
      {children}
    </BaseContextMenu.RadioItem>
  );
}

export function ContextMenuSub(props: ComponentProps<typeof BaseContextMenu.SubmenuRoot>) {
  return <BaseContextMenu.SubmenuRoot {...props} />;
}

/** An item that opens a submenu to the side. */
export function ContextMenuSubTrigger({
  inset,
  className,
  children,
  ...rest
}: Part<ComponentProps<typeof BaseContextMenu.SubmenuTrigger>> & { inset?: boolean }) {
  return (
    <BaseContextMenu.SubmenuTrigger
      data-slot="context-menu-sub-trigger"
      {...rest}
      className={cx("fg-pop-row", inset && "fg-pop-inset", className)}
    >
      <span className="fg-pop-label">{children}</span>
      <Icon icon={ArrowRight01Icon} size={12} variant="mono" />
    </BaseContextMenu.SubmenuTrigger>
  );
}

export function ContextMenuSubContent({
  className,
  ...rest
}: Part<ComponentProps<typeof BaseContextMenu.Popup>>) {
  return (
    <Menu.Portal>
      <Menu.Positioner className="fg-pop-positioner" sideOffset={2} alignOffset={-5}>
        <BaseContextMenu.Popup
          data-slot="context-menu-sub-content"
          {...rest}
          className={cx("fg-pop fg-pop-list", className)}
        />
      </Menu.Positioner>
    </Menu.Portal>
  );
}

const CONTEXT_KIT: MenuKit = {
  Item: ContextMenuItem,
  Separator: ContextMenuSeparator,
  Label: ContextMenuLabel,
  Sub: ContextMenuSub,
  SubTrigger: ContextMenuSubTrigger,
  SubContent: ContextMenuSubContent,
};
