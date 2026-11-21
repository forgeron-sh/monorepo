// The side panel of a thread: the message it started from, its replies as a MessageList, a
// composer to answer, and a close. Escape inside the panel closes it. The panel owns no data: it is
// given the root, the replies and what to do with a reply sent.
//
// With props it is the usual panel. With children it is a frame, and the parts compose it:
//
//   <ThreadPanel root={root} replies={replies} onClose={close} onSend={send} currentUserId="me">
//     <ThreadPanelHeader><ThreadPanelTitle /><ThreadPanelCount /><ThreadPanelClose /></ThreadPanelHeader>
//     <ThreadPanelMessage /><ThreadPanelReplies /><ThreadPanelTyping /><ThreadPanelComposer />
//   </ThreadPanel>

import { Cancel01Icon } from "@forgeron/icons";
import { createContext, useContext, useId, type KeyboardEvent, type ReactNode } from "react";
import { IconButton } from "../identity";
import { RichComposer, type ComposerSend, type RichComposerProps } from "../composer";
import { MessageItem, type MessageHandlers } from "./conversation-message";
import { MessageList, type MessageListProps } from "./conversation-message-list";
import type { ConversationMessage } from "./conversation-model";
import { part, type PartProps } from "../part";
import { TypingIndicator } from "./conversation-presence";

type ListProps = Pick<
  MessageListProps,
  "unreadFromId" | "onMarkRead" | "now" | "gapMinutes" | "empty" | "newMessagesLabel"
>;

interface PanelContext {
  titleId: string;
  title: string;
  root: ConversationMessage;
  replies: ReadonlyArray<ConversationMessage>;
  onClose: () => void;
  onSend: (message: ComposerSend) => void;
  typing: ReadonlyArray<string>;
  composer: Omit<RichComposerProps, "onSend"> | undefined;
  list: ListProps | undefined;
  handlers: Omit<MessageHandlers, "onOpenThread">;
}
const PanelCtx = createContext<PanelContext | null>(null);

function usePanel(name: string): PanelContext {
  const ctx = useContext(PanelCtx);
  if (!ctx) throw new Error(`<${name}> goes inside a <ThreadPanel>.`);
  return ctx;
}

/* ---------------------------------------------------------------- parts */

/** The top line: heading, count of replies, close. */
export function ThreadPanelHeader(props: PartProps<"header">) {
  return part("header", "thread-panel-header", "fg-conv-thread-head", props);
}

/** The heading, which names the panel. */
export function ThreadPanelTitle({ children, ...rest }: PartProps<"h2">) {
  const { titleId, title } = usePanel("ThreadPanelTitle");
  return part(
    "h2",
    "thread-panel-title",
    "fg-conv-thread-title",
    { ...rest, children: children ?? title },
    { id: titleId },
  );
}

/** "3 replies". */
export function ThreadPanelCount({ children, ...rest }: PartProps<"span">) {
  const { replies } = usePanel("ThreadPanelCount");
  const count = replies.length;
  return part("span", "thread-panel-count", "fg-conv-thread-count", {
    ...rest,
    children: children ?? `${count} ${count === 1 ? "reply" : "replies"}`,
  });
}

/** The close button. */
export function ThreadPanelClose({ label = "Close thread" }: { label?: string }) {
  const { onClose } = usePanel("ThreadPanelClose");
  return (
    <IconButton
      data-slot="thread-panel-close"
      icon={Cancel01Icon}
      label={label}
      size="sm"
      onClick={onClose}
    />
  );
}

/** The message the thread started from. */
export function ThreadPanelMessage({ children, ...rest }: PartProps<"div">) {
  const { root, handlers } = usePanel("ThreadPanelMessage");
  return part("div", "thread-panel-message", "fg-conv-thread-root", {
    ...rest,
    children: children ?? <MessageItem message={root} head tabIndex={0} {...handlers} />,
  });
}

/** The replies, as a message list. */
export function ThreadPanelReplies({
  className,
  ...props
}: Partial<Omit<MessageListProps, "messages" | "currentUserId">>) {
  const { root, replies, handlers, list } = usePanel("ThreadPanelReplies");
  return (
    <MessageList
      className={className ? `fg-conv-thread-list ${className}` : "fg-conv-thread-list"}
      label={`Replies to ${root.author?.name ?? "the message"}`}
      messages={replies}
      empty="No replies yet."
      {...list}
      {...handlers}
      {...props}
    />
  );
}

/** Who is writing in the thread. */
export function ThreadPanelTyping() {
  const { typing } = usePanel("ThreadPanelTyping");
  return <TypingIndicator names={typing} />;
}

/** The box to answer; its props come from the panel's `composer`. */
export function ThreadPanelComposer(props: Partial<Omit<RichComposerProps, "onSend">>) {
  const { composer, onSend } = usePanel("ThreadPanelComposer");
  return (
    <RichComposer
      placeholder="Reply…"
      label="Reply in thread"
      sendLabel="Reply"
      {...composer}
      {...props}
      onSend={onSend}
    />
  );
}

/* ---------------------------------------------------------------- the panel */

export interface ThreadPanelProps
  extends
    Omit<MessageHandlers, "onOpenThread">,
    Omit<PartProps<"aside">, "children" | "title" | "onCopy"> {
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
  list?: ListProps;
  /** The parts. Without them, the panel is built from the props. */
  children?: ReactNode;
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
  children,
  className,
  asChild,
  onKeyDown,
  currentUserId,
  onReact,
  onReply,
  onEdit,
  onDelete,
  onRetry,
  onDiscard,
  onCopy,
  onJumpTo,
  actions,
  onAction,
  onMentionClick,
  categories,
  timeZone,
  ...rest
}: ThreadPanelProps) {
  const titleId = useId();
  const handlers = {
    currentUserId,
    onReact,
    onReply,
    onEdit,
    onDelete,
    onRetry,
    onDiscard,
    onCopy,
    onJumpTo,
    actions,
    onAction,
    onMentionClick,
    categories,
    timeZone,
  } as Omit<MessageHandlers, "onOpenThread">;
  const keyDown = (event: KeyboardEvent<HTMLElement>) => {
    (onKeyDown as ((e: KeyboardEvent<HTMLElement>) => void) | undefined)?.(event);
    // A menu or a picker closes on Escape first; only a key nobody took closes the panel.
    if (event.key === "Escape" && !event.defaultPrevented) {
      event.stopPropagation();
      onClose();
    }
  };
  return (
    <PanelCtx.Provider
      value={{ titleId, title, root, replies, onClose, onSend, typing, composer, list, handlers }}
    >
      {part(
        "aside",
        "thread-panel",
        "fg-conv-thread",
        {
          className,
          asChild,
          ...rest,
          children: children ?? (
            <>
              <ThreadPanelHeader>
                <ThreadPanelTitle />
                <ThreadPanelCount />
                <ThreadPanelClose />
              </ThreadPanelHeader>
              <ThreadPanelMessage />
              <ThreadPanelReplies />
              <ThreadPanelTyping />
              <ThreadPanelComposer />
            </>
          ),
        },
        { "aria-labelledby": titleId, onKeyDown: keyDown },
      )}
    </PanelCtx.Provider>
  );
}
