// The timeline of a record, after the Tasks issue page: what changed ("Hugo Bernard moved it to In
// Review · 2 h ago"), the comments, and a box to write one. Times arrive as words from the caller,
// so nothing here reads the clock.

import { MailSend01Icon } from "@forgeron/icons";
import type { KeyboardEvent, ReactNode } from "react";
import { useId, useState } from "react";
import { Avatar } from "../avatar";
import { Button } from "../button";
import { cx } from "../cx";
import { Icon } from "../icon";
import { Feed, FeedContent, FeedIndicator, FeedItem, FeedTime, FeedTitle } from "../timeline";

interface ActivityBase {
  /** A stable key. */
  id: string;
  /** Who did it, written in full. */
  author: string;
  /** Their picture, else the initials. */
  avatar?: string;
  /** When, as the caller words it: "2 h ago", "3 Nov". */
  time: string;
  /** The same moment for machines, `2026-11-17T09:12`: makes the time a `<time>`. */
  dateTime?: string;
}

export interface ActivityEvent extends ActivityBase {
  kind: "event";
  /** What happened, after the name: "moved it to In Review". */
  text: ReactNode;
  /** A mark in place of the avatar: the status reached, a pixel icon. */
  glyph?: ReactNode;
}

export interface ActivityComment extends ActivityBase {
  kind: "comment";
  /** The comment itself, plain text or paragraphs. */
  body: ReactNode;
  /** The comment it answers, shown above the body. */
  quote?: { author: string; text: ReactNode };
  /** Framed in ember: the comment a link or a notification points at. */
  highlighted?: boolean;
}

export type ActivityItem = ActivityEvent | ActivityComment;

const face = (item: ActivityBase, size: number) => (
  <Avatar name={item.author} size={size} {...(item.avatar ? { src: item.avatar } : {})} />
);

function EventLine({ item }: { item: ActivityEvent }) {
  return (
    <FeedItem className="fg-activity-event">
      <FeedIndicator>{item.glyph ?? face(item, 16)}</FeedIndicator>
      <FeedContent>
        <FeedTitle>
          <b>{item.author}</b> {item.text} <span aria-hidden="true">·</span>{" "}
          <FeedTime {...(item.dateTime ? { dateTime: item.dateTime } : {})}>{item.time}</FeedTime>
        </FeedTitle>
      </FeedContent>
    </FeedItem>
  );
}

function CommentCard({ item }: { item: ActivityComment }) {
  return (
    <FeedItem className="fg-activity-item">
      <FeedIndicator>{face(item, 18)}</FeedIndicator>
      <article
        className={cx("fg-activity-comment", item.highlighted && "fg-activity-highlighted")}
        aria-label={`Comment by ${item.author}`}
      >
        <header className="fg-activity-head">
          <b>{item.author}</b>
          <FeedTime {...(item.dateTime ? { dateTime: item.dateTime } : {})}>{item.time}</FeedTime>
        </header>
        {item.quote ? (
          <blockquote className="fg-activity-quote">
            <b>{item.quote.author}</b>
            <div>{item.quote.text}</div>
          </blockquote>
        ) : null}
        <div className="fg-activity-body">{item.body}</div>
      </article>
    </FeedItem>
  );
}

export interface CommentComposerProps {
  /** Called with the trimmed text on the button or ⌘↵; an empty box sends nothing. */
  onSubmit: (text: string) => void;
  /** The draft, when the caller keeps it; else the composer keeps it and empties it once sent. */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Names the box for assistive technology. */
  label?: string;
  placeholder?: string;
  /** The button: "Comment", "Reply". */
  submitLabel?: string;
  disabled?: boolean;
  className?: string;
}

/** A box to write a comment: ⌘↵ (Ctrl↵) or the button sends it. */
export function CommentComposer({
  onSubmit,
  value,
  defaultValue = "",
  onChange,
  label = "Comment",
  placeholder = "Leave a comment…",
  submitLabel = "Comment",
  disabled,
  className,
}: CommentComposerProps) {
  const id = useId();
  const [inner, setInner] = useState(defaultValue);
  const text = value !== undefined ? value : inner;
  const empty = text.trim() === "";
  const change = (next: string) => {
    setInner(next);
    onChange?.(next);
  };
  const send = () => {
    if (empty || disabled) return;
    onSubmit(text.trim());
    if (value === undefined) setInner("");
  };
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      send();
    }
  };
  return (
    <form
      className={cx("fg-composer", className)}
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
    >
      <label htmlFor={id} className="fg-sr">
        {label}
      </label>
      <textarea
        id={id}
        className="fg-composer-input"
        placeholder={placeholder}
        value={text}
        disabled={disabled}
        onChange={(event) => change(event.target.value)}
        onKeyDown={onKeyDown}
      />
      <div className="fg-composer-foot">
        <Button type="submit" variant="primary" size="sm" kbd="⌘↵" disabled={disabled || empty}>
          <Icon icon={MailSend01Icon} size={12} variant="mono" />
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

export interface ActivityProps {
  /** Events and comments, oldest first. */
  items: ReadonlyArray<ActivityItem>;
  /** The heading above the list. */
  title?: string;
  /** At the end of the heading: a Subscribe button, a filter. */
  actions?: ReactNode;
  /** Shows the composer under the list; called with the trimmed text. */
  onSubmit?: (text: string) => void;
  /** The composer's draft, when the caller keeps it. */
  draft?: string;
  onDraftChange?: (value: string) => void;
  placeholder?: string;
  /** The composer's button: "Comment", "Reply". */
  submitLabel?: string;
  className?: string;
}

/** The timeline of a record: one line per change, a card per comment, the composer last. */
export function Activity({
  items,
  title = "Activity",
  actions,
  onSubmit,
  draft,
  onDraftChange,
  placeholder,
  submitLabel,
  className,
}: ActivityProps) {
  const headingId = useId();
  return (
    <section className={cx("fg-activity", className)} aria-labelledby={headingId}>
      <div className="fg-activity-bar">
        <h2 id={headingId} className="fg-activity-title">
          {title}
        </h2>
        {actions}
      </div>
      <Feed className="fg-activity-list">
        {items.map((item) =>
          item.kind === "event" ? (
            <EventLine key={item.id} item={item} />
          ) : (
            <CommentCard key={item.id} item={item} />
          ),
        )}
      </Feed>
      {onSubmit ? (
        <CommentComposer
          onSubmit={onSubmit}
          {...(draft !== undefined ? { value: draft } : {})}
          {...(onDraftChange ? { onChange: onDraftChange } : {})}
          {...(placeholder ? { placeholder } : {})}
          {...(submitLabel ? { submitLabel } : {})}
        />
      ) : null}
    </section>
  );
}
