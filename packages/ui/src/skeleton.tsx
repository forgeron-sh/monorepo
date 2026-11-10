import type { CSSProperties, ReactNode } from "react";
import { cx } from "./cx";

export interface SkeletonProps {
  /** Any CSS width; a block fills its line by default. */
  width?: string | number;
  /** Any CSS height; one line of text by default. */
  height?: string | number;
  className?: string;
}

/** A grey block in the place of something that is coming. Decorative: say the wait with `SkeletonGroup`. */
export function Skeleton({ width, height, className }: SkeletonProps) {
  const style: CSSProperties = {};
  if (width !== undefined) style.width = width;
  if (height !== undefined) style.height = height;
  return <span className={cx("fg-skeleton", className)} style={style} aria-hidden="true" />;
}

export interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

/** A paragraph that is coming; the last line is shorter, as text is. */
export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <span className={cx("fg-skeleton-text", className)} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} width={i === lines - 1 && lines > 1 ? "60%" : "100%"} />
      ))}
    </span>
  );
}

export interface SkeletonGroupProps {
  /** Said to assistive technology; not shown. */
  label?: string;
  className?: string;
  children?: ReactNode;
}

/** Wraps skeletons so the wait is announced once, with a word, while the shapes stay silent. */
export function SkeletonGroup({ label = "Loading", className, children }: SkeletonGroupProps) {
  return (
    <div className={cx("fg-skeleton-group", className)} role="status" aria-busy="true">
      <span className="fg-visually-hidden">{label}</span>
      {children}
    </div>
  );
}
