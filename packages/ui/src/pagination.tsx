// shadcn's Pagination (D-156): a nav of page links. The links are drawn as buttons (`fg-btn`), the
// current page outlined. `PaginationLink` is an `a`; `asChild` draws your router's link instead.

import { ArrowLeft01Icon, ArrowRight01Icon } from "@forgeron/icons";
import {
  cloneElement,
  isValidElement,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";
import { cx } from "./cx";
import { Icon } from "./icon";

/** The nav that holds the list. */
export function Pagination({ className, ...rest }: ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      {...rest}
      className={cx("fg-pagination", className)}
    />
  );
}

/** The list of items. */
export function PaginationContent({ className, ...rest }: ComponentProps<"ul">) {
  return <ul {...rest} className={cx("fg-pagination-content", className)} />;
}

export function PaginationItem(props: ComponentProps<"li">) {
  return <li {...props} />;
}

export type PaginationLinkProps = ComponentProps<"a"> & {
  /** The current page: outlined, `aria-current="page"`. */
  isActive?: boolean;
  /** `icon` (default, a square for a page number), `default`/`md`, `sm`, `lg`. */
  size?: "icon" | "default" | "md" | "sm" | "lg";
  asChild?: boolean;
};

/** One page. */
export function PaginationLink({
  isActive,
  size = "icon",
  asChild,
  className,
  children,
  ...rest
}: PaginationLinkProps) {
  const classes = cx(
    "fg-btn",
    isActive ? "fg-btn-secondary" : "fg-btn-ghost",
    size !== "md" && size !== "default" && `fg-btn-${size}`,
    className,
  );
  const props = { "aria-current": isActive ? ("page" as const) : undefined, ...rest };
  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ className?: string }>;
    return cloneElement(child, {
      ...props,
      ...child.props,
      className: cx(classes, child.props.className),
    } as Record<string, unknown>);
  }
  return (
    <a {...props} className={classes}>
      {children}
    </a>
  );
}

type Step = Omit<PaginationLinkProps, "size"> & { text?: ReactNode };

/** The link to the previous page. */
export function PaginationPrevious({ className, text = "Previous", ...rest }: Step) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      {...rest}
      className={cx("fg-pagination-step", className)}
    >
      <Icon icon={ArrowLeft01Icon} size={12} variant="mono" />
      <span className="fg-pagination-text">{text}</span>
    </PaginationLink>
  );
}

/** The link to the next page. */
export function PaginationNext({ className, text = "Next", ...rest }: Step) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      {...rest}
      className={cx("fg-pagination-step", className)}
    >
      <span className="fg-pagination-text">{text}</span>
      <Icon icon={ArrowRight01Icon} size={12} variant="mono" />
    </PaginationLink>
  );
}

/** Three dots for the pages left out. */
export function PaginationEllipsis({ className, ...rest }: ComponentProps<"span">) {
  return (
    <span aria-hidden="true" {...rest} className={cx("fg-pagination-ellipsis", className)}>
      …<span className="fg-sr-only">More pages</span>
    </span>
  );
}
