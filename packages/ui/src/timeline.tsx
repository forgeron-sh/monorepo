// A timeline (D-157): an ordered list of things that happened, each with a marker, who and what,
// and when; optionally grouped by day. Presentational only: expansion, filtering and sorting stay
// with the block that owns the data. shadcn's composition: parts with `className` and `...rest`.
//
//   <Feed aria-label="History">
//     <FeedItem>
//       <FeedIndicator tone="success" />
//       <FeedContent>
//         <FeedTitle><b>Léa</b> approved</FeedTitle>
//         <FeedTime dateTime="2026-11-18T09:42">09:42</FeedTime>
//         <FeedDescription>Looks good.</FeedDescription>
//       </FeedContent>
//     </FeedItem>
//   </Feed>

import type { ComponentProps } from "react";
import { cx } from "./cx";
import { Led, type LedProps } from "./led";

export interface FeedProps extends ComponentProps<"ol"> {
  /**
   * Draws the line that joins the markers and lays each item out as marker and content. Turn it
   * off for dense rows (a log), where the item is yours to lay out. Default `true`.
   */
  connector?: boolean;
}

/** The list: an `<ol>`. Name it with `aria-label`. */
export function Feed({ connector = true, className, ...rest }: FeedProps) {
  return (
    <ol
      data-slot="timeline"
      data-connector={connector ? "" : undefined}
      className={cx("fg-timeline", className)}
      {...rest}
    />
  );
}

/** One entry. With the connector: the marker in the first column, the content in the second. */
export function FeedItem({ className, ...rest }: ComponentProps<"li">) {
  return <li data-slot="timeline-item" className={cx("fg-timeline-item", className)} {...rest} />;
}

export interface FeedIndicatorProps extends ComponentProps<"span"> {
  /** The tone of the default marker, a `Led`. Ignored when there are children. */
  tone?: LedProps["tone"];
}

/** The marker, decorative: a `Led` of a `tone`, or your children (a glyph, an avatar, an icon). */
export function FeedIndicator({
  tone = "neutral",
  className,
  children,
  ...rest
}: FeedIndicatorProps) {
  return (
    <span
      data-slot="timeline-indicator"
      aria-hidden="true"
      className={cx("fg-timeline-indicator", className)}
      {...rest}
    >
      {children ?? <Led tone={tone} />}
    </span>
  );
}

/** What the entry says and when: its title, time and description. */
export function FeedContent({ className, ...rest }: ComponentProps<"div">) {
  return (
    <div data-slot="timeline-content" className={cx("fg-timeline-content", className)} {...rest} />
  );
}

/** Who and what: "Hugo moved it to In Review". */
export function FeedTitle({ className, ...rest }: ComponentProps<"div">) {
  return (
    <div data-slot="timeline-title" className={cx("fg-timeline-title", className)} {...rest} />
  );
}

/** The detail under the title: a reason, a diff, a comment. Takes the whole line. */
export function FeedDescription({ className, ...rest }: ComponentProps<"div">) {
  return (
    <div
      data-slot="timeline-description"
      className={cx("fg-timeline-description", className)}
      {...rest}
    />
  );
}

/** When, as a `<time dateTime>`; without `dateTime` a plain `<span>`, as `<time>` needs a value. */
export function FeedTime({ className, dateTime, ...rest }: ComponentProps<"time">) {
  const props = {
    "data-slot": "timeline-time",
    className: cx("fg-timeline-time", className),
    ...rest,
  };
  return dateTime ? (
    <time dateTime={dateTime} {...props} />
  ) : (
    <span {...(props as ComponentProps<"span">)} />
  );
}

/** A run of entries under one name, a day for instance: a `FeedGroupLabel`, then a `Feed`. */
export function FeedGroup({ className, ...rest }: ComponentProps<"div">) {
  return (
    <div data-slot="timeline-group" className={cx("fg-timeline-group", className)} {...rest} />
  );
}

/** The name of a group: a closed band, its text over the hatching. An `<h3>`. */
export function FeedGroupLabel({ className, children, ...rest }: ComponentProps<"h3">) {
  return (
    <h3
      data-slot="timeline-group-label"
      className={cx("fg-timeline-group-label", className)}
      {...rest}
    >
      <span>{children}</span>
    </h3>
  );
}
