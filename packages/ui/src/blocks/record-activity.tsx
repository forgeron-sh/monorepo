// The timeline of a record, after the Tasks issue page: what changed ("Hugo Bernard moved it to In
// Review · 2 h ago"), the comments, and a box to write one. Times arrive as words from the caller,
// so nothing here reads the clock. On the `Feed` parts (timeline.tsx).
//
// `Activity` with `items` draws them. Without `items` it is the root of its parts:
//
//   <Activity>
//     <ActivityHeader><ActivityTitle>Activity</ActivityTitle></ActivityHeader>
//     <ActivityList>
//       <ActivityEventItem item={event} />
//       <ActivityCommentItem item={comment} />
//     </ActivityList>
//     <CommentComposer onSubmit={send}>
//       <CommentComposerInput />
//       <CommentComposerFooter><CommentComposerSubmit /></CommentComposerFooter>
//     </CommentComposer>
//   </Activity>

import { MailSend01Icon } from "@forgeron/icons";
import type { ComponentProps, KeyboardEvent, ReactNode } from "react";
import { createContext, useContext, useId, useState } from "react";
import { Avatar } from "../avatar";
import { Button } from "../button";
import { cx } from "../cx";
import { Icon } from "../icon";
import { renderPart } from "../part";
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

const timeOf = (item: ActivityBase) => (
  <FeedTime {...(item.dateTime ? { dateTime: item.dateTime } : {})}>{item.time}</FeedTime>
);

export interface ActivityEventItemProps extends Omit<ComponentProps<"li">, "children"> {
  item: ActivityEvent;
  /** Replaces the line: the name, the text and the time. */
  children?: ReactNode;
}

/** A line of what changed: the mark, who, what, when. */
export function ActivityEventItem({ item, className, children, ...rest }: ActivityEventItemProps) {
  return (
    <FeedItem data-slot="activity-event" {...rest} className={cx("fg-activity-event", className)}>
      <FeedIndicator>{item.glyph ?? face(item, 16)}</FeedIndicator>
      <FeedContent>
        {children ?? (
          <FeedTitle>
            <b>{item.author}</b> {item.text} <span aria-hidden="true">·</span> {timeOf(item)}
          </FeedTitle>
        )}
      </FeedContent>
    </FeedItem>
  );
}

export interface ActivityCommentItemProps extends Omit<ComponentProps<"li">, "children"> {
  item: ActivityComment;
  /** The card's content: `ActivityCommentHeader`, `ActivityCommentQuote`, `ActivityCommentBody`. */
  children?: ReactNode;
}

const CommentContext = createContext<ActivityComment | null>(null);

const useComment = (part: string) => {
  const item = useContext(CommentContext);
  if (!item) throw new Error(`<${part}> goes inside an <ActivityCommentItem>.`);
  return item;
};

/** A comment: the avatar in the marker's column, a card with its header, quote and body. */
export function ActivityCommentItem({
  item,
  className,
  children,
  ...rest
}: ActivityCommentItemProps) {
  return (
    <CommentContext value={item}>
      <FeedItem
        data-slot="activity-comment"
        {...rest}
        className={cx("fg-activity-item", className)}
      >
        <FeedIndicator>{face(item, 18)}</FeedIndicator>
        <article
          data-slot="activity-comment-card"
          className={cx("fg-activity-comment", item.highlighted && "fg-activity-highlighted")}
          aria-label={`Comment by ${item.author}`}
        >
          {children ?? (
            <>
              <ActivityCommentHeader />
              {item.quote ? <ActivityCommentQuote /> : null}
              <ActivityCommentBody />
            </>
          )}
        </article>
      </FeedItem>
    </CommentContext>
  );
}

/** The author and the time over a comment. */
export function ActivityCommentHeader({ className, children, ...rest }: ComponentProps<"header">) {
  const item = useComment("ActivityCommentHeader");
  return (
    <header
      data-slot="activity-comment-header"
      {...rest}
      className={cx("fg-activity-head", className)}
    >
      {children ?? (
        <>
          <b>{item.author}</b>
          {timeOf(item)}
        </>
      )}
    </header>
  );
}

/** The comment this one answers. */
export function ActivityCommentQuote({
  className,
  children,
  ...rest
}: ComponentProps<"blockquote">) {
  const item = useComment("ActivityCommentQuote");
  if (!item.quote && children === undefined) return null;
  return (
    <blockquote
      data-slot="activity-comment-quote"
      {...rest}
      className={cx("fg-activity-quote", className)}
    >
      {children ?? (
        <>
          <b>{item.quote!.author}</b>
          <div>{item.quote!.text}</div>
        </>
      )}
    </blockquote>
  );
}

/** What the comment says. */
export function ActivityCommentBody({ className, children, ...rest }: ComponentProps<"div">) {
  const item = useComment("ActivityCommentBody");
  return (
    <div data-slot="activity-comment-body" {...rest} className={cx("fg-activity-body", className)}>
      {children ?? item.body}
    </div>
  );
}

/* ---------------------------------------------------------------- the composer */

export interface CommentComposerProps extends Omit<
  ComponentProps<"form">,
  "onSubmit" | "onChange" | "children" | "defaultValue"
> {
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
  /** The parts (`CommentComposerInput`, `CommentComposerFooter`…) in place of the box and button. */
  children?: ReactNode;
}

interface ComposerContextValue {
  id: string;
  text: string;
  empty: boolean;
  disabled: boolean | undefined;
  label: string;
  placeholder: string;
  submitLabel: string;
  change: (next: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
}

const ComposerContext = createContext<ComposerContextValue | null>(null);

/** The draft and what the composer's parts read. For parts of your own. */
export function useCommentComposer(part = "a composer part"): ComposerContextValue {
  const ctx = useContext(ComposerContext);
  if (!ctx) throw new Error(`<${part}> goes inside a <CommentComposer>.`);
  return ctx;
}

/**
 * A box to write a comment: ⌘↵ (Ctrl↵) or the button sends it. Without children it draws the box
 * and the button; with children it is the root of the parts, which share the draft.
 */
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
  children,
  ...rest
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
    <ComposerContext
      value={{ id, text, empty, disabled, label, placeholder, submitLabel, change, onKeyDown }}
    >
      <form
        data-slot="comment-composer"
        {...rest}
        className={cx("fg-composer", className)}
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        {children ?? (
          <>
            <CommentComposerInput />
            <CommentComposerFooter>
              <CommentComposerSubmit />
            </CommentComposerFooter>
          </>
        )}
      </form>
    </ComposerContext>
  );
}

/** The textarea, with its label for assistive technology. `label` and `placeholder` default to the root's. */
export function CommentComposerInput({
  label,
  className,
  ...rest
}: Omit<ComponentProps<"textarea">, "value" | "onChange"> & { label?: string }) {
  const c = useCommentComposer("CommentComposerInput");
  return (
    <>
      <label htmlFor={c.id} className="fg-sr">
        {label ?? c.label}
      </label>
      <textarea
        id={c.id}
        data-slot="comment-composer-input"
        placeholder={c.placeholder}
        disabled={c.disabled}
        {...rest}
        className={cx("fg-composer-input", className)}
        value={c.text}
        onChange={(event) => c.change(event.target.value)}
        onKeyDown={(event) => {
          rest.onKeyDown?.(event);
          if (!event.defaultPrevented) c.onKeyDown(event);
        }}
      />
    </>
  );
}

/** The row under the box: where the button goes. */
export function CommentComposerFooter({
  asChild,
  className,
  ...rest
}: ComponentProps<"div"> & { asChild?: boolean }) {
  return renderPart("div", cx("fg-composer-foot", className), asChild, {
    "data-slot": "comment-composer-footer",
    ...rest,
  });
}

/** The send button: off while the box is empty. */
export function CommentComposerSubmit({
  children,
  ...rest
}: Omit<ComponentProps<"button">, "type">) {
  const c = useCommentComposer("CommentComposerSubmit");
  return (
    <Button
      data-slot="comment-composer-submit"
      type="submit"
      variant="primary"
      size="sm"
      kbd="⌘↵"
      disabled={c.disabled || c.empty}
      {...(rest as object)}
    >
      {children ?? (
        <>
          <Icon icon={MailSend01Icon} size={12} variant="mono" />
          {c.submitLabel}
        </>
      )}
    </Button>
  );
}

/* ---------------------------------------------------------------- the activity */

interface ActivityContextValue {
  headingId: string;
}
const ActivityContext = createContext<ActivityContextValue | null>(null);

interface ActivityOwn {
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
}

export interface ActivityProps
  extends ActivityOwn, Omit<ComponentProps<"section">, keyof ActivityOwn | "children"> {
  /** Events and comments, oldest first. */
  items: ReadonlyArray<ActivityItem>;
  className?: string;
  children?: undefined;
}

/** `items` stays undefined: with items, `Activity` draws them itself. */
export interface ActivityRootProps extends ComponentProps<"section"> {
  items?: undefined;
}

/**
 * With `items`: the timeline of a record, one line per change, a card per comment, the composer
 * last. Without: the root of the parts (`ActivityHeader`, `ActivityList`…).
 */
export function Activity(props: ActivityProps | ActivityRootProps) {
  const headingId = useId();
  if (props.items === undefined) {
    const { items: _items, className, children, ...rest } = props;
    return (
      <ActivityContext value={{ headingId }}>
        <section
          data-slot="activity"
          aria-labelledby={headingId}
          {...rest}
          className={cx("fg-activity", className)}
        >
          {children}
        </section>
      </ActivityContext>
    );
  }
  const {
    items,
    title = "Activity",
    actions,
    onSubmit,
    draft,
    onDraftChange,
    placeholder,
    submitLabel,
    className,
    ...rest
  } = props;
  return (
    <Activity {...rest} {...(className ? { className } : {})}>
      <ActivityHeader>
        <ActivityTitle>{title}</ActivityTitle>
        {actions}
      </ActivityHeader>
      <ActivityList>
        {items.map((item) =>
          item.kind === "event" ? (
            <ActivityEventItem key={item.id} item={item} />
          ) : (
            <ActivityCommentItem key={item.id} item={item} />
          ),
        )}
      </ActivityList>
      {onSubmit ? (
        <CommentComposer
          onSubmit={onSubmit}
          {...(draft !== undefined ? { value: draft } : {})}
          {...(onDraftChange ? { onChange: onDraftChange } : {})}
          {...(placeholder ? { placeholder } : {})}
          {...(submitLabel ? { submitLabel } : {})}
        />
      ) : null}
    </Activity>
  );
}

/** The bar over the list: the title, then what you put at its end. */
export function ActivityHeader({
  asChild,
  className,
  ...rest
}: ComponentProps<"div"> & { asChild?: boolean }) {
  return renderPart("div", cx("fg-activity-bar", className), asChild, {
    "data-slot": "activity-header",
    ...rest,
  });
}

/** The heading that names the section. */
export function ActivityTitle({ className, ...rest }: ComponentProps<"h2">) {
  const ctx = useContext(ActivityContext);
  return (
    <h2
      data-slot="activity-title"
      {...(ctx ? { id: ctx.headingId } : {})}
      {...rest}
      className={cx("fg-activity-title", className)}
    />
  );
}

/** The list of events and comments: a `Feed`. */
export function ActivityList({ className, ...rest }: ComponentProps<typeof Feed>) {
  return <Feed data-slot="activity-list" {...rest} className={cx("fg-activity-list", className)} />;
}
