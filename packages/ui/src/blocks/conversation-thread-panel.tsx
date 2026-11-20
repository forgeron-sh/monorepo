// The side panel of a thread: the message it started from, its replies as a MessageList, a
// composer to answer, and a close. Escape inside the panel closes it. The panel owns no data: it is
// given the root, the replies and what to do with a reply sent.

import { Cancel01Icon } from "@forgeron/icons";
import type { KeyboardEvent } from "react";
import { useId } from "react";
import { cx } from "../cx";
import { IconButton } from "../identity";
import { RichComposer, type ComposerSend, type RichComposerProps } from "../composer";
import { MessageItem, type MessageHandlers } from "./conversation-message";
import { MessageList, type MessageListProps } from "./conversation-message-list";
import type { ConversationMessage } from "./conversation-model";
import { TypingIndicator } from "./conversation-presence";

export interface ThreadPanelProps extends Omit<MessageHandlers, "onOpenThread"> {
  /** The message the thread started from. */
  root: ConversationMessage;
  /** Its replies, oldest first. */
  replies: ReadonlyArray<ConversationMessage>;
  onClose: () => void;
  /** A reply was sent from the panel's composer. */
  onSend: (message: ComposerSend) => void;
  /** Heading. Default "Thread". */
  title?: string;
  /** Who is writing in the thread. */
  typing?: ReadonlyArray<string>;
  /** The composer's props (triggers, sendOn, placeholder…), apart from `onSend`. */
  composer?: Omit<RichComposerProps, "onSend">;
  /** The list's props that are not already set here. */
  list?: Pick<
    MessageListProps,
    "unreadFromId" | "onMarkRead" | "now" | "gapMinutes" | "empty" | "newMessagesLabel"
  >;
  className?: string;
}

/** A thread beside the conversation: root message, replies, composer, close. */
export function ThreadPanel({
  root,
  replies,
  onClose,
  onSend,
  title = "Thread",
  typing = [],
  composer,
  list,
  className,
  ...handlers
}: ThreadPanelProps) {
  const headingId = useId();
  const count = replies.length;
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    // A menu or a picker closes on Escape first; only a key nobody took closes the panel.
    if (event.key === "Escape" && !event.defaultPrevented) {
      event.stopPropagation();
      onClose();
    }
  };
  return (
    <aside
      className={cx("fg-conv-thread", className)}
      aria-labelledby={headingId}
      onKeyDown={onKeyDown}
    >
      <header className="fg-conv-thread-head">
        <h2 id={headingId} className="fg-conv-thread-title">
          {title}
        </h2>
        <span className="fg-conv-thread-count">
          {count} {count === 1 ? "reply" : "replies"}
        </span>
        <IconButton icon={Cancel01Icon} label="Close thread" size="sm" onClick={onClose} />
      </header>
      <div className="fg-conv-thread-root">
        <MessageItem message={root} head tabIndex={0} {...handlers} />
      </div>
      <MessageList
        className="fg-conv-thread-list"
        label={`Replies to ${root.author?.name ?? "the message"}`}
        messages={replies}
        empty="No replies yet."
        {...list}
        {...handlers}
      />
      <TypingIndicator names={typing} />
      <RichComposer
        placeholder="Reply…"
        label="Reply in thread"
        sendLabel="Reply"
        {...composer}
        onSend={onSend}
      />
    </aside>
  );
}
