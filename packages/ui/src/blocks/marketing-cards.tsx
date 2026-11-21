// The card grid of a marketing page: a drawing, a title and a sentence, three a row; and the
// figures two a row.
//
// Roots with parts. `ArtCard` takes `art`, `icon`, `eyebrow`, `title` and `text` as shorthand, or
// the parts: `ArtCardArt`, `ArtCardCopy` (`ArtCardEyebrow`, `ArtCardTitle`, `ArtCardText`).
// `FigureGrid` takes `figures`, or `FigureGridItem`s.

import type { IconDefinition } from "@forgeron/icons";
import type { CSSProperties, ReactNode } from "react";
import { Icon } from "../icon";
import { PixelFigure } from "../pixel-figure";
import { part, type PartProps } from "../part";

export interface CardGridProps extends Omit<PartProps<"div">, "children"> {
  /** `div` by default; `ul` when the cards are `li`. */
  as?: "div" | "ul";
  /** Height of every card's drawing, in px; 280 by default. */
  artHeight?: number;
  children: ReactNode;
}

/**
 * Three cards a row, glued (one under 900px). The copy blocks can be tuned for the whole grid
 * with `--fg-artcard-pad`, `--fg-artcard-gap` and `--fg-artcard-min`.
 */
export function CardGrid({ as: Tag = "div", artHeight, style, children, ...rest }: CardGridProps) {
  const art =
    artHeight === undefined
      ? undefined
      : ({ "--fg-artcard-art": `${artHeight}px` } as CSSProperties);
  return part(Tag, "card-grid", "fg-cards", {
    ...rest,
    children,
    ...(art || style ? { style: { ...art, ...style } } : {}),
  } as never);
}

export interface ArtCardProps extends Omit<PartProps<"article">, "title" | "as"> {
  /** `article` by default; `li` in a `ul` grid. */
  as?: "article" | "li";
  /** The drawing on top, over a dotted field (a canvas fills it). */
  art?: ReactNode;
  /** An icon above the title. */
  icon?: IconDefinition;
  /** A word in ember above the title. */
  eyebrow?: ReactNode;
  /** The title; without it and `text`, the children are the parts of the card. */
  title?: ReactNode;
  text?: ReactNode;
}

/** A card of a `CardGrid`: a drawing, then its title and a sentence. */
export function ArtCard({
  as: Tag = "article",
  art,
  icon,
  eyebrow,
  title,
  text,
  children,
  ...rest
}: ArtCardProps) {
  const shorthand = title !== undefined || text !== undefined || art !== undefined;
  return part(Tag, "art-card", "fg-artcard fg-ticks", {
    ...rest,
    children: shorthand ? (
      <>
        <ArtCardArt>{art}</ArtCardArt>
        <ArtCardCopy>
          {icon ? <Icon icon={icon} /> : null}
          {eyebrow ? <ArtCardEyebrow>{eyebrow}</ArtCardEyebrow> : null}
          <ArtCardTitle>{title}</ArtCardTitle>
          <ArtCardText>{text}</ArtCardText>
          {children}
        </ArtCardCopy>
      </>
    ) : (
      children
    ),
  } as never);
}

/** The drawing on top, over a dotted field. */
export function ArtCardArt(props: PartProps<"div">) {
  return part("div", "art-card-art", "fg-artcard-art fg-dots", props);
}

/** The copy under the drawing: an icon, an eyebrow, a title and a sentence. */
export function ArtCardCopy(props: PartProps<"div">) {
  return part("div", "art-card-copy", "fg-artcard-copy", props);
}

/** A word in ember above the title. */
export function ArtCardEyebrow(props: PartProps<"span">) {
  return part("span", "art-card-eyebrow", "text-eyebrow fg-artcard-eyebrow", props);
}

/** The title of the card. */
export function ArtCardTitle(props: PartProps<"h3">) {
  return part("h3", "art-card-title", "text-title-3", props);
}

/** The sentence under the title. */
export function ArtCardText(props: PartProps<"p">) {
  return part("p", "art-card-text", "text-small fg-artcard-text", props);
}

export interface FigureGridProps extends Omit<PartProps<"ul">, "children"> {
  /** Each figure in the pixel face, with what it counts under it. */
  figures?: ReadonlyArray<{ n: string; label: string }>;
  /** `FigureGridItem`s, when there are no `figures`. */
  children?: ReactNode;
}

/** Figures two a row, glued, each set on the bottom of its cell. */
export function FigureGrid({ figures, children, ...rest }: FigureGridProps) {
  return part("ul", "figure-grid", "fg-figures", {
    ...rest,
    children:
      figures?.map((f) => <FigureGridItem key={f.label} n={f.n} label={f.label} />) ?? children,
  } as never);
}

export interface FigureGridItemProps extends Omit<PartProps<"li">, "children"> {
  /** The figure, in the pixel face. */
  n: string;
  /** What it counts. */
  label: ReactNode;
}

/** One figure of the grid: the number, and what it counts under it. */
export function FigureGridItem({ n, label, ...rest }: FigureGridItemProps) {
  return part("li", "figure-grid-item", "fg-ticks", {
    ...rest,
    children: (
      <>
        <PixelFigure text={n} size="lg" />
        <span className="text-eyebrow fg-figures-label">{label}</span>
      </>
    ),
  } as never);
}
