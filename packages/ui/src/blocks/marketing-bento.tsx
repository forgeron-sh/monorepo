import type { ReactNode } from "react";
import { cx } from "../cx";

export interface BentoProps {
  /** `div` by default; `ul` when the cells are `li`. */
  as?: "div" | "ul";
  className?: string;
  children: ReactNode;
}

/**
 * A grid of glued cells, six columns of 184px rows (two under 900px): the 1px gaps show the line
 * behind, so neighbours share one rule.
 */
export function Bento({ as: Tag = "div", className, children }: BentoProps) {
  return <Tag className={cx("fg-bento", className)}>{children}</Tag>;
}

export interface BentoCellProps {
  /** `article` by default. */
  as?: "article" | "li" | "div";
  /** Columns out of six; every cell takes the full width under 900px. */
  span?: 2 | 3 | 4 | 6;
  /** Rows of 184px. */
  rows?: 1 | 2 | 3;
  /** Corner brackets; on by default. */
  ticks?: boolean;
  /** Pinned at the top right, over the drawing: a `SoonTag`, for instance. */
  corner?: ReactNode;
  /** The drawing, filling the cell above the copy (a canvas fills it). */
  art?: ReactNode;
  title?: ReactNode;
  text?: ReactNode;
  className?: string;
  children?: ReactNode;
}

/** A cell of the bento: a drawing above, then a title and a line of copy under a rule. */
export function BentoCell({
  as: Tag = "article",
  span,
  rows,
  ticks = true,
  corner,
  art,
  title,
  text,
  className,
  children,
}: BentoCellProps) {
  return (
    <Tag
      className={cx(
        "fg-cell",
        ticks && "fg-ticks",
        span && `fg-c${span}`,
        rows && rows > 1 && `fg-r${rows}`,
        className,
      )}
    >
      {corner ? <div className="fg-cell-corner">{corner}</div> : null}
      {art ? <div className="fg-cell-art">{art}</div> : null}
      {title || text ? (
        <div className="fg-cell-copy">
          {title ? <h3 className="text-title-3">{title}</h3> : null}
          {text ? <p className="text-small fg-cell-text">{text}</p> : null}
        </div>
      ) : null}
      {children}
    </Tag>
  );
}
