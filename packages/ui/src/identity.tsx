import type { IconDefinition } from "@forgeron/icons";
import { Search01Icon } from "@forgeron/icons";
import {
  cloneElement,
  isValidElement,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ComponentProps,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { Avatar } from "./avatar";
import { Button, type ButtonProps } from "./button";
import { cx } from "./cx";
import { Icon } from "./icon";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./input-group";
import { Kbd } from "./marks";

interface IconButtonBase {
  icon: IconDefinition;
  /** Said to assistive technology: an icon alone has no name. */
  label: string;
  /** `ghost` (default): framed on hover only; `boxed`: always framed. */
  variant?: "ghost" | "boxed";
  /** `sm` 24px (inside a header or a picker), `md` 32px (a toolbar). */
  size?: "sm" | "md";
  className?: string;
}

export type IconButtonProps = IconButtonBase &
  (
    | ({ href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">)
    | ({ href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children">)
  );

/** A square button that holds one pixel icon: the toolbars of every app. A `Button` (`size="icon"`). */
export function IconButton({
  icon,
  label,
  variant = "ghost",
  size = "md",
  className,
  ...rest
}: IconButtonProps) {
  return (
    <Button
      data-slot="icon-button"
      {...(rest as ButtonProps)}
      aria-label={label}
      variant="ghost"
      size="icon"
      className={cx(
        "fg-iconbtn",
        variant === "boxed" && "fg-iconbtn-boxed",
        size === "sm" && "fg-iconbtn-sm",
        className,
      )}
    >
      <Icon icon={icon} size={12} variant="mono" />
    </Button>
  );
}

export interface AppTileProps extends Omit<ComponentProps<"span">, "className" | "children"> {
  icon: IconDefinition;
  /** In px: 20 in a switcher, 32 in a list, 48 on a card. */
  size?: 20 | 32 | 48;
  /** `accent` (default): an app; `ink`: the workspace; `neutral`: an app not installed. */
  tone?: "accent" | "ink" | "neutral";
  /** Names the tile when it stands without its app's name. */
  label?: string;
  className?: string;
}

/** The square mark of an app: its icon on a flat tile. */
export function AppTile({
  icon,
  size = 32,
  tone = "accent",
  label,
  className,
  style,
  ...rest
}: AppTileProps) {
  return (
    <span
      data-slot="app-tile"
      {...rest}
      className={cx("fg-tile", tone !== "accent" && `fg-tile-${tone}`, className)}
      style={{ width: size, height: size, ...style }}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      <Icon icon={icon} size={size >= 48 ? 24 : 12} variant="mono" />
    </span>
  );
}

export interface SwatchProps extends Omit<ComponentProps<"span">, "className" | "color"> {
  /** Any CSS colour: a project's, a label's. */
  color: string;
  /** Written next to the square; without it the swatch is decorative. */
  children?: ReactNode;
  className?: string;
}

/** A small square of colour that tells a project or a label apart, next to its name. */
export function Swatch({ color, children, className, ...rest }: SwatchProps) {
  const square = (
    <span className="fg-swatch-mark" style={{ background: color }} aria-hidden="true" />
  );
  return (
    <span data-slot="swatch" {...rest} className={cx("fg-swatch", className)}>
      {square}
      {children === undefined ? null : <span>{children}</span>}
    </span>
  );
}

export interface AvatarGroupProps extends Omit<ComponentProps<"span">, "className" | "children"> {
  /** Names or emails, in order. */
  names: ReadonlyArray<string>;
  /** How many avatars before the `+n` square. */
  max?: number;
  size?: number;
  /** Said to assistive technology, e.g. "6 members". Defaults to the names. */
  label?: string;
  className?: string;
}

/** `names` stays undefined: with names, `AvatarGroup` is the props-driven one. */
export type AvatarGroupRootProps = Omit<ComponentProps<"span">, "className"> & {
  names?: undefined;
  className?: string;
};

/**
 * With `names`: the people on a record, overlapping, the rest counted in a last square. Without: the
 * root of the parts, `Avatar`s as children and `AvatarGroupCount` for the "+3".
 */
export function AvatarGroup(props: AvatarGroupProps | AvatarGroupRootProps) {
  return props.names !== undefined ? (
    <AvatarGroupNames {...(props as AvatarGroupProps)} />
  ) : (
    <AvatarGroupRoot {...(props as AvatarGroupRootProps)} />
  );
}

function AvatarGroupRoot({ names: _names, className, ...rest }: AvatarGroupRootProps) {
  return (
    <span data-slot="avatar-group" role="group" {...rest} className={cx("fg-avatars", className)} />
  );
}

export interface AvatarGroupCountProps extends Omit<ComponentProps<"span">, "className"> {
  /** In px, as the avatars next to it. */
  size?: number;
  className?: string;
}

/** The square that counts the people not shown: `+3`. */
export function AvatarGroupCount({ size = 24, className, style, ...rest }: AvatarGroupCountProps) {
  return (
    <span
      data-slot="avatar-group-count"
      {...rest}
      className={cx("fg-avatars-more", className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4), ...style }}
    />
  );
}

function AvatarGroupNames({
  names,
  max = 4,
  size = 24,
  label,
  className,
  ...rest
}: AvatarGroupProps) {
  const shown = names.slice(0, max);
  const left = names.length - shown.length;
  return (
    <AvatarGroupRoot
      role="img"
      aria-label={label ?? names.join(", ")}
      {...rest}
      {...(className !== undefined ? { className } : {})}
    >
      {shown.map((name) => (
        <Avatar key={name} name={name} size={size} data-slot="avatar" />
      ))}
      {left > 0 ? (
        <AvatarGroupCount aria-hidden="true" size={size}>
          +{left}
        </AvatarGroupCount>
      ) : null}
    </AvatarGroupRoot>
  );
}

export interface SearchBoxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** The shortcut that focuses the box, shown at the end: `["⌘", "K"]` or `"/"`. */
  shortcut?: string | ReadonlyArray<string>;
}

/**
 * A search field: the magnifier, the query, the shortcut that reaches it. A preset over
 * `InputGroup`; `className` goes on the frame, the rest on the input.
 */
export function SearchBox({
  shortcut,
  className,
  "aria-label": ariaLabel = "Search",
  ...rest
}: SearchBoxProps) {
  return (
    <InputGroup data-slot="search-box" className={cx("fg-search", className)}>
      <InputGroupAddon align="inline-start">
        <Icon icon={Search01Icon} size={12} variant="mono" className="fg-search-icon" />
      </InputGroupAddon>
      <InputGroupInput {...rest} type="search" aria-label={ariaLabel} className="fg-search-input" />
      {shortcut ? (
        <InputGroupAddon align="inline-end">
          <Kbd keys={shortcut} />
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  );
}

export interface BreadcrumbItem {
  label: ReactNode;
  /** Absent on the last item: the page itself. */
  href?: string;
  icon?: IconDefinition;
}

export interface BreadcrumbProps {
  items: ReadonlyArray<BreadcrumbItem>;
  className?: string;
}

/**
 * With `items`: where the page sits, its parents as links, the page itself last, set apart by
 * slashes. Without: shadcn's `Breadcrumb` (`BreadcrumbList`, `BreadcrumbItem`…), D-156.
 */
export function Breadcrumb(props: BreadcrumbProps | BreadcrumbRootProps) {
  return props.items !== undefined ? (
    <BreadcrumbTrail {...(props as BreadcrumbProps)} />
  ) : (
    <BreadcrumbRoot {...(props as BreadcrumbRootProps)} />
  );
}

function BreadcrumbTrail({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cx("fg-crumbs", className)}>
      <ol>
        {items.map((item, i) => {
          const last = i === items.length - 1;
          const content = (
            <>
              {item.icon ? <Icon icon={item.icon} size={12} variant="mono" /> : null}
              <span className="fg-crumb-text">{item.label}</span>
            </>
          );
          return (
            <li key={i}>
              {last || item.href === undefined ? (
                <span className="fg-crumb" aria-current={last ? "page" : undefined}>
                  {content}
                </span>
              ) : (
                <a className="fg-crumb" href={item.href}>
                  {content}
                </a>
              )}
              {last ? null : (
                <span className="fg-crumb-sep" aria-hidden="true">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ---------------------------------------------------------------- shadcn parts (D-156) */

/** `items` stays undefined: with items, `Breadcrumb` is the props-driven one. */
export type BreadcrumbRootProps = ComponentProps<"nav"> & { items?: undefined };

function BreadcrumbRoot({ items: _items, className, ...rest }: BreadcrumbRootProps) {
  return <nav aria-label="breadcrumb" {...rest} className={cx("fg-crumbs", className)} />;
}

export function BreadcrumbList({ className, ...rest }: ComponentProps<"ol">) {
  return <ol {...rest} className={className} />;
}

export function BreadcrumbItem({ className, ...rest }: ComponentProps<"li">) {
  return <li {...rest} className={className} />;
}

export type BreadcrumbLinkProps = ComponentProps<"a"> & { asChild?: boolean };

/** A parent page. `asChild` draws your router's link instead of an `a`. */
export function BreadcrumbLink({ asChild, className, children, ...rest }: BreadcrumbLinkProps) {
  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ className?: string }>;
    return cloneElement(child, {
      ...rest,
      ...child.props,
      className: cx("fg-crumb", className, child.props.className),
    } as Record<string, unknown>);
  }
  return (
    <a {...rest} className={cx("fg-crumb", className)}>
      {children}
    </a>
  );
}

/** The page itself: not a link, `aria-current="page"`. */
export function BreadcrumbPage({ className, ...rest }: ComponentProps<"span">) {
  return (
    <span
      role="link"
      aria-disabled="true"
      aria-current="page"
      {...rest}
      className={cx("fg-crumb", className)}
    />
  );
}

/** A slash between two items; give it children to draw something else. */
export function BreadcrumbSeparator({ children, className, ...rest }: ComponentProps<"li">) {
  return (
    <li role="presentation" aria-hidden="true" {...rest} className={cx("fg-crumb-sep", className)}>
      {children ?? "/"}
    </li>
  );
}

/** Three dots for the pages left out. */
export function BreadcrumbEllipsis({ className, ...rest }: ComponentProps<"span">) {
  return (
    <span
      role="presentation"
      aria-hidden="true"
      {...rest}
      className={cx("fg-crumb fg-crumb-ellipsis", className)}
    >
      …<span className="fg-sr-only">More</span>
    </span>
  );
}
