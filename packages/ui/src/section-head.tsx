import { Fragment } from "react";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "./cx";
import { PixelText } from "./pixel-text";
import { Title } from "./title";

/** A title given line by line: each entry is a line, joined by a hard break. */
export type TitleLines = string | ReadonlyArray<string>;

/** The lines of a title, with a `<br />` between them. */
export function titleLines(title: TitleLines): ReactNode {
  const lines = typeof title === "string" ? [title] : title;
  return lines.map((line, i) => (
    <Fragment key={`${i}-${line}`}>
      {i > 0 ? <br /> : null}
      {line}
    </Fragment>
  ));
}

export interface SectionHeadProps extends Omit<
  ComponentProps<"header">,
  "className" | "title" | "children"
> {
  /** The section's coordinate, `/0.1`, drawn in the pixel face in ember. */
  index: string;
  /** The title in the pixel face, one string per line. */
  title: TitleLines;
  /** `h1` when the section opens the page. */
  titleAs?: "h1" | "h2";
  /** One or two sentences under the title, muted. */
  lead?: ReactNode;
  /** A mono note on the right of the coordinate. */
  meta?: ReactNode;
  className?: string;
}

/**
 * The head of a section of a marketing page: the coordinate on its own line, then the title and its
 * lead, aligned on the gutter, closed by a line.
 */
export function SectionHead({
  index,
  title,
  titleAs = "h2",
  lead,
  meta,
  className,
  ...rest
}: SectionHeadProps) {
  return (
    <header data-slot="section-head" {...rest} className={cx("fg-sec-head", className)}>
      <div className="fg-sec-head-top">
        <span className="fg-sec-head-index">
          <PixelText text={index} label={index} />
        </span>
        {meta ? <span className="fg-sec-head-meta text-eyebrow">{meta}</span> : null}
      </div>
      <div className="fg-sec-head-title">
        <Title as={titleAs} size="h2">
          {titleLines(title)}
        </Title>
        {lead ? <p className="fg-sec-lead">{lead}</p> : null}
      </div>
    </header>
  );
}

export interface SectionBandProps extends Omit<ComponentProps<"div">, "className" | "children"> {
  /** The coordinate of the section above, `/0.1`. */
  from: string;
  /** The coordinate of the section below, `/0.2`. */
  to: string;
  /** What comes next, shown in brackets: `[ Under the hood ]`. */
  label: string;
  className?: string;
}

/**
 * The hatched band between two sections, with their coordinates on the left and the next one's
 * name on the right. It takes over the bottom rule of the block above it.
 */
export function SectionBand({ from, to, label, className, ...rest }: SectionBandProps) {
  return (
    <div data-slot="section-band" {...rest} className={cx("fg-band text-eyebrow", className)}>
      <span>{`${from} → ${to}`}</span>
      <span>{`[ ${label} ]`}</span>
    </div>
  );
}
