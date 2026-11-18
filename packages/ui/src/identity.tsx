import type { IconDefinition } from "@forgeron/icons";
import { Search01Icon } from "@forgeron/icons";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";
import { Avatar } from "./avatar";
import { cx } from "./cx";
import { Icon } from "./icon";
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

/** A square button that holds one pixel icon: the toolbars of every app. */
export function IconButton({
  icon,
  label,
  variant = "ghost",
  size = "md",
  className,
  ...rest
}: IconButtonProps) {
  const classes = cx(
    "fg-iconbtn",
    variant === "boxed" && "fg-iconbtn-boxed",
    size === "sm" && "fg-iconbtn-sm",
    className,
  );
  const glyph = <Icon icon={icon} size={12} variant="mono" />;
  if (rest.href !== undefined) {
    return (
      <a {...rest} aria-label={label} className={classes}>
        {glyph}
      </a>
    );
  }
  return (
    <button type="button" {...rest} aria-label={label} className={classes}>
      {glyph}
    </button>
  );
}

export interface AppTileProps {
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
export function AppTile({ icon, size = 32, tone = "accent", label, className }: AppTileProps) {
  return (
    <span
      className={cx("fg-tile", tone !== "accent" && `fg-tile-${tone}`, className)}
      style={{ width: size, height: size }}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      <Icon icon={icon} size={size >= 48 ? 24 : 12} variant="mono" />
    </span>
  );
}

export interface SwatchProps {
  /** Any CSS colour: a project's, a label's. */
  color: string;
  /** Written next to the square; without it the swatch is decorative. */
  children?: ReactNode;
  className?: string;
}

/** A small square of colour that tells a project or a label apart, next to its name. */
export function Swatch({ color, children, className }: SwatchProps) {
  const square = (
    <span className="fg-swatch-mark" style={{ background: color }} aria-hidden="true" />
  );
  if (children === undefined) return <span className={cx("fg-swatch", className)}>{square}</span>;
  return (
    <span className={cx("fg-swatch", className)}>
      {square}
      <span>{children}</span>
    </span>
  );
}

export interface AvatarGroupProps {
  /** Names or emails, in order. */
  names: ReadonlyArray<string>;
  /** How many avatars before the `+n` square. */
  max?: number;
  size?: number;
  /** Said to assistive technology, e.g. "6 members". Defaults to the names. */
  label?: string;
  className?: string;
}

/** The people on a record, overlapping, the rest counted in a last square. */
export function AvatarGroup({ names, max = 4, size = 24, label, className }: AvatarGroupProps) {
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  return (
    <span className={cx("fg-avatars", className)} role="img" aria-label={label ?? names.join(", ")}>
      {shown.map((name) => (
        <Avatar key={name} name={name} size={size} />
      ))}
      {rest > 0 ? (
        <span
          className="fg-avatars-more"
          aria-hidden="true"
          style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
        >
          +{rest}
        </span>
      ) : null}
    </span>
  );
}

export interface SearchBoxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** The shortcut that focuses the box, shown at the end: `["⌘", "K"]` or `"/"`. */
  shortcut?: string | ReadonlyArray<string>;
}

/** A search field: the magnifier, the query, the shortcut that reaches it. */
export function SearchBox({
  shortcut,
  className,
  "aria-label": ariaLabel = "Search",
  ...rest
}: SearchBoxProps) {
  return (
    <span className={cx("fg-search", className)}>
      <Icon icon={Search01Icon} size={12} variant="mono" className="fg-search-icon" />
      <input {...rest} type="search" aria-label={ariaLabel} className="fg-search-input" />
      {shortcut ? <Kbd keys={shortcut} /> : null}
    </span>
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

/** Where the page sits: its parents as links, the page itself last, set apart by slashes. */
export function Breadcrumb({ items, className }: BreadcrumbProps) {
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
