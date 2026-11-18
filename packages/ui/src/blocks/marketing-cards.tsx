import type { IconDefinition } from "@forgeron/icons";
import type { CSSProperties, ReactNode } from "react";
import { cx } from "../cx";
import { Icon } from "../icon";
import { PixelFigure } from "../pixel-figure";

export interface CardGridProps {
  /** `div` by default; `ul` when the cards are `li`. */
  as?: "div" | "ul";
  /** Height of every card's drawing, in px; 280 by default. */
  artHeight?: number;
  className?: string;
  children: ReactNode;
}

/**
 * Three cards a row, glued (one under 900px). The copy blocks can be tuned for the whole grid
 * with `--fg-artcard-pad`, `--fg-artcard-gap` and `--fg-artcard-min`.
 */
export function CardGrid({ as: Tag = "div", artHeight, className, children }: CardGridProps) {
  const style =
    artHeight === undefined
      ? undefined
      : ({ "--fg-artcard-art": `${artHeight}px` } as CSSProperties);
  return (
    <Tag className={cx("fg-cards", className)} style={style}>
      {children}
    </Tag>
  );
}

export interface ArtCardProps {
  /** `article` by default; `li` in a `ul` grid. */
  as?: "article" | "li";
  /** The drawing on top, over a dotted field (a canvas fills it). */
  art?: ReactNode;
  /** An icon above the title. */
  icon?: IconDefinition;
  /** A word in ember above the title. */
  eyebrow?: ReactNode;
  title: ReactNode;
  text: ReactNode;
  className?: string;
}

/** A card of a `CardGrid`: a drawing, then its title and a sentence. */
export function ArtCard({
  as: Tag = "article",
  art,
  icon,
  eyebrow,
  title,
  text,
  className,
}: ArtCardProps) {
  return (
    <Tag className={cx("fg-artcard fg-ticks", className)}>
      <div className="fg-artcard-art fg-dots">{art}</div>
      <div className="fg-artcard-copy">
        {icon ? <Icon icon={icon} /> : null}
        {eyebrow ? <span className="text-eyebrow fg-artcard-eyebrow">{eyebrow}</span> : null}
        <h3 className="text-title-3">{title}</h3>
        <p className="text-small fg-artcard-text">{text}</p>
      </div>
    </Tag>
  );
}

export interface FigureGridProps {
  /** Each figure in the pixel face, with what it counts under it. */
  figures: ReadonlyArray<{ n: string; label: string }>;
  className?: string;
}

/** Figures two a row, glued, each set on the bottom of its cell. */
export function FigureGrid({ figures, className }: FigureGridProps) {
  return (
    <ul className={cx("fg-figures", className)}>
      {figures.map((f) => (
        <li key={f.label} className="fg-ticks">
          <PixelFigure text={f.n} size="lg" />
          <span className="text-eyebrow fg-figures-label">{f.label}</span>
        </li>
      ))}
    </ul>
  );
}
