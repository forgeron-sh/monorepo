import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { cx } from "./cx";

export interface SkeletonProps extends ComponentProps<"span"> {
  /** Any CSS width; a block fills its line by default. */
  width?: string | number;
  /** Any CSS height; one line of text by default. */
  height?: string | number;
  className?: string;
}

/**
 * A grey block in the place of something that is coming. Decorative: say the wait with
 * `SkeletonGroup`. As in shadcn it can be sized by the caller's classes or `style`.
 */
export function Skeleton({ width, height, className, style, ...rest }: SkeletonProps) {
  const sized: CSSProperties = { ...style };
  if (width !== undefined) sized.width = width;
  if (height !== undefined) sized.height = height;
  return (
    <span
      aria-hidden="true"
      data-slot="skeleton"
      {...rest}
      className={cx("fg-skeleton", className)}
      style={sized}
    />
  );
}

export interface SkeletonTextProps extends Omit<ComponentProps<"span">, "className" | "children"> {
  lines?: number;
  className?: string;
}

/** A paragraph that is coming; the last line is shorter, as text is. */
export function SkeletonText({ lines = 3, className, ...rest }: SkeletonTextProps) {
  return (
    <span
      data-slot="skeleton-text"
      {...rest}
      className={cx("fg-skeleton-text", className)}
      aria-hidden="true"
    >
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} width={i === lines - 1 && lines > 1 ? "60%" : "100%"} />
      ))}
    </span>
  );
}

export interface SkeletonGroupProps extends Omit<ComponentProps<"div">, "className" | "children"> {
  /** Said to assistive technology; not shown. */
  label?: string;
  className?: string;
  children?: ReactNode;
}

/** Wraps skeletons so the wait is announced once, with a word, while the shapes stay silent. */
export function SkeletonGroup({
  label = "Loading",
  className,
  children,
  ...rest
}: SkeletonGroupProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      data-slot="skeleton-group"
      {...rest}
      className={cx("fg-skeleton-group", className)}
    >
      <span className="fg-visually-hidden">{label}</span>
      {children}
    </div>
  );
}
