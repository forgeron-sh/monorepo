import {
  cloneElement,
  isValidElement,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { cx } from "./cx";
import { Led } from "./led";

/** shadcn's variant names, accepted as aliases of ours (D-156). */
const VARIANT_ALIASES = {
  default: "primary",
  outline: "secondary",
  destructive: "danger",
} as const;

interface ButtonBase {
  /**
   * `primary`: filled in ember, one per view; `secondary` (default): outlined; `ink`: filled in
   * `ink`, a strong action that is not the primary one; `ghost`: no outline; `danger`: destructive;
   * `link`: text only. shadcn's `default`, `outline` and `destructive` are read as `primary`,
   * `secondary` and `danger`.
   */
  variant?:
    | "primary"
    | "secondary"
    | "ink"
    | "ghost"
    | "danger"
    | "link"
    | keyof typeof VARIANT_ALIASES;
  /** `sm` 30px, `md` 32px (the app's density, also `default`), `lg` 40px (the site), `icon` a 32px square. */
  size?: "sm" | "md" | "lg" | "icon" | "default";
  /** The square marker of the lab language before the label ("■ Get started"). */
  marker?: boolean;
  /** Keyboard shortcut shown on the right, e.g. "⌘K". */
  kbd?: string;
  /**
   * Draws the one child element (a router link…) as the button, the way shadcn's `asChild` does: the
   * classes and props go onto it.
   */
  asChild?: boolean;
  children?: ReactNode;
}

export type ButtonProps = ButtonBase &
  (
    | ({ href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>)
    | ({ href: string } & AnchorHTMLAttributes<HTMLAnchorElement>)
  );

/** Button, or a link styled as a button when `href` is provided, or its child with `asChild`. */
export function Button({
  variant = "secondary",
  size = "md",
  kbd,
  marker,
  asChild,
  className,
  children,
  ...rest
}: ButtonProps) {
  const tone =
    variant in VARIANT_ALIASES ? VARIANT_ALIASES[variant as keyof typeof VARIANT_ALIASES] : variant;
  const classes = cx(
    "fg-btn",
    `fg-btn-${tone}`,
    size !== "md" && size !== "default" && `fg-btn-${size}`,
    className,
  );
  const wrap = (inner: ReactNode) => (
    <>
      {marker ? <Led tone="current" /> : null}
      {inner}
      {kbd ? (
        <span className="fg-btn-kbd" aria-hidden="true">
          {kbd}
        </span>
      ) : null}
    </>
  );
  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ className?: string; children?: ReactNode }>;
    return cloneElement(child, {
      ...rest,
      ...child.props,
      className: cx(classes, child.props.className),
      children: wrap(child.props.children),
    } as Record<string, unknown>);
  }
  const content = wrap(children);
  if (rest.href !== undefined) {
    return (
      <a {...rest} className={classes}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" {...rest} className={classes}>
      {content}
    </button>
  );
}
