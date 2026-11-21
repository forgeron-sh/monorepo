// A grid of glued cells, and the cell: a drawing above, then a title and a line of copy.
//
// Roots with parts. `Bento` holds `BentoCell`s; a `BentoCell` takes `art`, `title`, `text` and
// `corner` as shorthand, or the parts: `BentoCellCorner`, `BentoCellArt`, `BentoCellCopy`
// (`BentoCellTitle`, `BentoCellText`).

import type { ReactNode } from "react";
import { cx } from "../cx";
import { part, type PartProps } from "../part";

export interface BentoProps extends Omit<PartProps<"div">, "as" | "children"> {
  /** `div` by default; `ul` when the cells are `li`. */
  as?: "div" | "ul";
  className?: string;
  children: ReactNode;
}

/**
 * A grid of glued cells, six columns of 184px rows (two under 900px): the 1px gaps show the line
 * behind, so neighbours share one rule.
 */
export function Bento({ as: Tag = "div", className, children, asChild, ...rest }: BentoProps) {
  return part(Tag, "bento", "fg-bento", { asChild, className, children, ...rest } as never);
}

export interface BentoCellProps extends Omit<PartProps<"article">, "title" | "as"> {
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
  asChild,
  ...rest
}: BentoCellProps) {
  return part(
    Tag,
    "bento-cell",
    cx("fg-cell", ticks && "fg-ticks", span && `fg-c${span}`, rows && rows > 1 && `fg-r${rows}`),
    {
      asChild,
      className,
      ...rest,
      children: (
        <>
          {corner ? <BentoCellCorner>{corner}</BentoCellCorner> : null}
          {art ? <BentoCellArt>{art}</BentoCellArt> : null}
          {title || text ? (
            <BentoCellCopy>
              {title ? <BentoCellTitle>{title}</BentoCellTitle> : null}
              {text ? <BentoCellText>{text}</BentoCellText> : null}
            </BentoCellCopy>
          ) : null}
          {children}
        </>
      ),
    } as never,
  );
}

/** Pinned at the top right of the cell, over the drawing. */
export function BentoCellCorner(props: PartProps<"div">) {
  return part("div", "bento-cell-corner", "fg-cell-corner", props);
}

/** The drawing, filling the cell above the copy. */
export function BentoCellArt(props: PartProps<"div">) {
  return part("div", "bento-cell-art", "fg-cell-art", props);
}

/** The copy under a rule: a title and a line. */
export function BentoCellCopy(props: PartProps<"div">) {
  return part("div", "bento-cell-copy", "fg-cell-copy", props);
}

/** The title of the cell. */
export function BentoCellTitle(props: PartProps<"h3">) {
  return part("h3", "bento-cell-title", "text-title-3", props);
}

/** The line of copy. */
export function BentoCellText(props: PartProps<"p">) {
  return part("p", "bento-cell-text", "text-small fg-cell-text", props);
}
