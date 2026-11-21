// One message of a conversation: author and time on the first of a run, the quote it answers, the
// text (bold, italic, code, links and mentions read from it, never HTML), what became of it
// (sending, failed with a retry, edited, deleted), its files, its reactions, the thread it opened
// and, on hover or focus, its actions: react, reply in a thread, and a menu. MessageList and
// ThreadPanel are made of these.
//
// With `message` alone it is the usual message. With children it is a frame, and the parts compose
// it. Whatever else it is given (`id`, `onClick`, a collection's item props…) goes on the article.
//
//   <MessageItem message={m} currentUserId="me" onReact={react}>
//     <MessageItemSide />
//     <MessageItemMain>
//       <MessageItemHeader /><MessageItemQuote /><MessageItemBody /><MessageItemState />
//       <MessageItemAttachments /><MessageItemReactions /><MessageItemReplies />
//     </MessageItemMain>
//     <MessageItemActions />
//   </MessageItem>

import {
  Copy01Icon,
  Delete02Icon,
  Edit02Icon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  ReplyIcon,
  SmilePlusIcon,
} from "@forgeron/icons";
import { createContext, useContext, useState, type ReactNode } from "react";
import { Avatar } from "../avatar";
import { Button } from "../button";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { IconButton } from "../identity";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { AttachmentList } from "./conversation-attachments";
import { EmojiPicker, type EmojiCategory } from "../emoji-picker";
import { ReactionBar } from "./conversation-emoji";
import {
  conversationPlainText,
  conversationTime,
  parseConversationInline,
  type ConversationInline,
  type ConversationMessage,
} from "./conversation-model";
import { part, type PartProps } from "../part";
import { ActionMenu, type ActionMenuEntry } from "../action-menu";

export interface MessageHandlers {
  /** Whose messages are "yours": edit and delete are offered on them, the author is marked. */
  currentUserId: string;
  /** An emoji pressed or chosen on a message; the caller adds or removes the reaction. */
  onReact?: (messageId: string, emoji: string) => void;
  /** "Reply": the caller puts the message in the composer's reply bar. */
  onReply?: (message: ConversationMessage) => void;
  /** Opens the thread of a message (also from the replies line). */
  onOpenThread?: (message: ConversationMessage) => void;
  onEdit?: (message: ConversationMessage) => void;
  onDelete?: (message: ConversationMessage) => void;
  /** Send a failed message again. */
  onRetry?: (message: ConversationMessage) => void;
  /** Give up on a failed message. */
  onDiscard?: (message: ConversationMessage) => void;
  /** Copy the text; the clipboard by default. */
  onCopy?: (message: ConversationMessage) => void;
  /** A quote pressed: scroll to the message it quotes. */
  onJumpTo?: (messageId: string) => void;
  /** Rows added to the menu of each message, after the usual ones. */
  actions?: (message: ConversationMessage) => ReadonlyArray<ActionMenuEntry>;
  /** A row of `actions` (or `"reply"`, `"thread"`, `"copy"`, `"edit"`, `"delete"`) was chosen. */
  onAction?: (id: string, message: ConversationMessage) => void;
  /** A mention pressed. Without it, mentions are plain marks. */
  onMentionClick?: (mention: { char: string; id: string; label: string }) => void;
  /** Your own emoji set. */
  categories?: ReadonlyArray<EmojiCategory>;
  timeZone?: string | undefined;
}

function Inline({
  parts,
  onMentionClick,
}: {
  parts: ReadonlyArray<ConversationInline>;
  onMentionClick: MessageHandlers["onMentionClick"];
}): ReactNode {
  return parts.map((part, i) => {
    switch (part.kind) {
      case "text":
        return part.text;
      case "bold":
        return (
          <strong key={i}>
            <Inline parts={part.children} onMentionClick={onMentionClick} />
          </strong>
        );
      case "italic":
        return (
          <em key={i}>
            <Inline parts={part.children} onMentionClick={onMentionClick} />
          </em>
        );
      case "code":
        return (
          <code key={i} className="fg-conv-code">
            {part.text}
          </code>
        );
      case "link":
        return (
          <a
            key={i}
            className="fg-conv-link"
            href={part.href}
            target="_blank"
            rel="noreferrer noopener"
          >
            {part.text}
          </a>
        );
      case "mention": {
        const label = `${part.char}${part.label}`;
        return onMentionClick ? (
          <button
            key={i}
            type="button"
            className="fg-conv-mention"
            onClick={() => onMentionClick({ char: part.char, id: part.id, label: part.label })}
          >
            {label}
          </button>
        ) : (
          <span key={i} className="fg-conv-mention">
            {label}
          </span>
        );
      }
    }
  });
}

/** The text of a message: a string is read for its marks, any other node is shown as it is. */
export function ConversationText({
  body,
  onMentionClick,
}: {
  body: string | ReactNode;
  onMentionClick?: MessageHandlers["onMentionClick"];
}) {
  if (typeof body !== "string") return <>{body}</>;
  return <Inline parts={parseConversationInline(body)} onMentionClick={onMentionClick} />;
}

/* ---------------------------------------------------------------- context */

interface MessageContext extends MessageHandlers {
  message: ConversationMessage;
  head: boolean;
  mine: boolean;
  time: string;
  settled: boolean;
  menuItems: ReadonlyArray<ActionMenuEntry>;
  choose: (id: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  picking: boolean;
  setPicking: (open: boolean) => void;
}

const MessageCtx = createContext<MessageContext | null>(null);

/** The message a part is in, with what it can do: for your own parts inside a `MessageItem`. */
export function useMessageItem(who = "useMessageItem"): MessageContext {
  const ctx = useContext(MessageCtx);
  if (!ctx) throw new Error(`<${who}> goes inside a <MessageItem>.`);
  return ctx;
}

/* ---------------------------------------------------------------- parts */

/** The avatar of the first message of a run, the time of the others. */
export function MessageItemSide({ children, ...rest }: PartProps<"div">) {
  const { message, head, time } = useMessageItem("MessageItemSide");
  const author = message.author;
  return part("div", "message-item-side", "fg-conv-msg-side", {
    ...rest,
    children:
      children ??
      (head ? (
        <Avatar
          name={author?.name ?? "?"}
          size={28}
          {...(author?.avatar ? { src: author.avatar } : {})}
        />
      ) : (
        <time className="fg-conv-msg-time" dateTime={message.at}>
          {time}
        </time>
      )),
  });
}

/** The column of the message: header, quote, text, files, reactions, replies. */
export function MessageItemMain(props: PartProps<"div">) {
  return part("div", "message-item-main", "fg-conv-msg-main", props);
}

/** Author, role and time; only on the first message of a run. */
export function MessageItemHeader({ children, ...rest }: PartProps<"header">) {
  const { message, head, time } = useMessageItem("MessageItemHeader");
  if (!head) return null;
  const author = message.author;
  return part("header", "message-item-header", "fg-conv-msg-header", {
    ...rest,
    children: children ?? (
      <>
        <b className="fg-conv-msg-author">{author?.name}</b>
        {author?.role ? <span className="fg-conv-msg-role">{author.role}</span> : null}
        <time className="fg-conv-msg-when" dateTime={message.at}>
          {time}
        </time>
      </>
    ),
  });
}

/** The message this one answers; a press goes to it. */
export function MessageItemQuote({
  children,
  ...rest
}: Omit<PartProps<"button">, "onClick" | "disabled">) {
  const { message, onJumpTo } = useMessageItem("MessageItemQuote");
  const quote = message.replyTo;
  if (!quote) return null;
  return part(
    "button",
    "message-item-quote",
    "fg-conv-quote",
    {
      ...rest,
      children: children ?? (
        <>
          <b>{quote.author}</b>
          <span>{conversationPlainText(quote.text)}</span>
        </>
      ),
    },
    {
      type: "button",
      disabled: !onJumpTo || !quote.id,
      "aria-label": `In reply to ${quote.author}: ${conversationPlainText(quote.text)}`,
      onClick: () => quote.id && onJumpTo?.(quote.id),
    },
  );
}

/** The text, "(edited)", or "This message was deleted.". */
export function MessageItemBody({ children, ...rest }: PartProps<"div">) {
  const { message, onMentionClick } = useMessageItem("MessageItemBody");
  return part("div", "message-item-body", "fg-conv-msg-body", {
    ...rest,
    children: children ?? (
      <>
        {message.deleted ? (
          <em className="fg-conv-deleted">This message was deleted.</em>
        ) : message.body !== undefined ? (
          <ConversationText body={message.body} onMentionClick={onMentionClick} />
        ) : null}
        {message.edited && !message.deleted ? (
          <span className="fg-conv-edited"> (edited)</span>
        ) : null}
      </>
    ),
  });
}

/** "Sending…", or "Not sent." with Retry and Discard; nothing for a message that went through. */
export function MessageItemState({ children, ...rest }: PartProps<"div">) {
  const { message, onRetry, onDiscard } = useMessageItem("MessageItemState");
  if (message.status === "sending") {
    return part("span", "message-item-state", "fg-conv-state", {
      ...rest,
      children: children ?? "Sending…",
    });
  }
  if (message.status !== "failed") return null;
  return part(
    "div",
    "message-item-state",
    "fg-conv-failed-bar",
    {
      ...rest,
      children: children ?? (
        <>
          <span className="fg-conv-failed-text">Not sent.</span>
          {onRetry ? (
            <Button variant="secondary" size="sm" onClick={() => onRetry(message)}>
              Retry
            </Button>
          ) : null}
          {onDiscard ? (
            <Button variant="ghost" size="sm" onClick={() => onDiscard(message)}>
              Discard
            </Button>
          ) : null}
        </>
      ),
    },
    { role: "alert" },
  );
}

/** The files of the message, as tiles. */
export function MessageItemAttachments() {
  const { message } = useMessageItem("MessageItemAttachments");
  if (message.deleted || (message.attachments?.length ?? 0) === 0) return null;
  return <AttachmentList items={message.attachments!} layout="grid" />;
}

/** The reactions of the message. */
export function MessageItemReactions() {
  const { message, currentUserId, onReact, categories } = useMessageItem("MessageItemReactions");
  const reactions = message.reactions ?? [];
  if (message.deleted || reactions.length === 0) return null;
  return (
    <ReactionBar
      reactions={reactions}
      currentUserId={currentUserId}
      canAdd={onReact !== undefined}
      readOnly={onReact === undefined}
      onToggle={(emoji) => onReact?.(message.id, emoji)}
      {...(categories ? { categories } : {})}
    />
  );
}

/** "3 replies · last 09:10": opens the thread. */
export function MessageItemReplies({
  children,
  ...rest
}: Omit<PartProps<"button">, "onClick" | "disabled">) {
  const { message, onOpenThread, timeZone } = useMessageItem("MessageItemReplies");
  const replies = message.replyCount ?? 0;
  if (message.deleted || replies === 0) return null;
  return part(
    "button",
    "message-item-replies",
    "fg-conv-replies",
    {
      ...rest,
      children: children ?? (
        <>
          {replies} {replies === 1 ? "reply" : "replies"}
          {message.lastReplyAt ? (
            <span className="fg-conv-replies-last">
              {" "}
              · last {conversationTime(message.lastReplyAt, timeZone)}
            </span>
          ) : null}
        </>
      ),
    },
    { type: "button", disabled: !onOpenThread, onClick: () => onOpenThread?.(message) },
  );
}

/** The toolbar shown on hover or focus: react, reply in a thread, and the menu. */
export function MessageItemActions({ children, ...rest }: PartProps<"div">) {
  const {
    message,
    settled,
    menuItems,
    choose,
    open,
    setOpen,
    picking,
    setPicking,
    onReact,
    onOpenThread,
    categories,
  } = useMessageItem("MessageItemActions");
  if (!settled || !(onReact || onOpenThread || menuItems.length > 0)) return null;
  const author = message.author;
  return part(
    "div",
    "message-item-actions",
    "fg-conv-msg-actions",
    {
      ...rest,
      children: children ?? (
        <>
          {onReact ? (
            <Popover open={picking} onOpenChange={setPicking}>
              <PopoverTrigger asChild>
                <IconButton icon={SmilePlusIcon} label="Add a reaction" size="sm" variant="boxed" />
              </PopoverTrigger>
              <PopoverContent align="end" aria-label="Add a reaction" style={{ width: 300 }}>
                <EmojiPicker
                  autoFocus
                  {...(categories ? { categories } : {})}
                  onSelect={(emoji) => {
                    onReact(message.id, emoji);
                    setPicking(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          ) : null}
          {onOpenThread ? (
            <IconButton
              icon={MessageSquareIcon}
              label="Reply in thread"
              size="sm"
              variant="boxed"
              onClick={() => onOpenThread(message)}
            />
          ) : null}
          {menuItems.length > 0 ? (
            <ActionMenu
              items={[...menuItems]}
              onSelect={choose}
              label={`Actions on the message of ${author?.name ?? "the system"}`}
              open={open}
              onOpenChange={setOpen}
              align="end"
              trigger={
                <IconButton
                  icon={MoreHorizontalIcon}
                  label="More actions"
                  size="sm"
                  variant="boxed"
                />
              }
            />
          ) : null}
        </>
      ),
    },
    { role: "group", "aria-label": "Message actions" },
  );
}

/* ---------------------------------------------------------------- the message */

export interface MessageItemProps
  extends MessageHandlers, Omit<PartProps<"article">, "children" | "onCopy" | "tabIndex"> {
  message: ConversationMessage;
  /** Shows the author's name, avatar and time. Default `true`. */
  head?: boolean;
  /** `0` for the one message that is a tab stop of its list, `-1` for the others. */
  tabIndex?: number;
  menuOpen?: boolean;
  onMenuOpenChange?: (open: boolean) => void;
  /** The parts. Without them, the message is built from the props. */
  children?: ReactNode;
}

/** One message, with its toolbar and menu. A list gives it `head` and its collection's item props. */
export function MessageItem({
  message,
  head = true,
  tabIndex = -1,
  menuOpen,
  onMenuOpenChange,
  children,
  className,
  asChild,
  currentUserId,
  onReact,
  onReply,
  onOpenThread,
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
}: MessageItemProps) {
  const [open, setOpen] = useControllableState<boolean>({
    value: menuOpen,
    defaultValue: false,
    onChange: (next) => onMenuOpenChange?.(next),
  });
  const [picking, setPicking] = useState(false);
  const author = message.author;
  const mine = author?.id === currentUserId;
  const time = conversationTime(message.at, timeZone);
  const settled = !message.status && !message.deleted;
  const text = typeof message.body === "string" ? message.body : null;

  const items: ActionMenuEntry[] = [];
  if (settled) {
    if (onReply) items.push({ id: "reply", label: "Reply", icon: ReplyIcon });
    if (onOpenThread)
      items.push({ id: "thread", label: "Reply in thread", icon: MessageSquareIcon });
    if (text !== null) items.push({ id: "copy", label: "Copy text", icon: Copy01Icon });
    if (mine && onEdit) items.push({ id: "edit", label: "Edit", icon: Edit02Icon });
    const extra = actions?.(message) ?? [];
    if (extra.length > 0) items.push({ separator: true }, ...extra);
    if (mine && onDelete) {
      items.push(
        { separator: true },
        { id: "delete", label: "Delete", icon: Delete02Icon, danger: true },
      );
    }
  }
  const choose = (id: string) => {
    if (id === "reply") onReply?.(message);
    else if (id === "thread") onOpenThread?.(message);
    else if (id === "copy") {
      if (onCopy) onCopy(message);
      else if (text !== null) void navigator.clipboard?.writeText(conversationPlainText(text));
    } else if (id === "edit") onEdit?.(message);
    else if (id === "delete") onDelete?.(message);
    onAction?.(id, message);
  };

  const ctx: MessageContext = {
    message,
    head,
    mine,
    time,
    settled,
    menuItems: items,
    choose,
    open,
    setOpen,
    picking,
    setPicking,
    currentUserId,
    onReact,
    onReply,
    onOpenThread,
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
  };

  return (
    <MessageCtx.Provider value={ctx}>
      {part(
        "article",
        "message-item",
        cx(
          "fg-conv-msg",
          head && "fg-conv-msg-head",
          mine && "fg-conv-msg-mine",
          message.status === "sending" && "fg-conv-msg-sending",
          message.status === "failed" && "fg-conv-msg-failed",
          message.deleted && "fg-conv-msg-deleted",
          (open || picking) && "fg-conv-msg-active",
        ),
        {
          className,
          asChild,
          ...rest,
          children: children ?? (
            <>
              <MessageItemSide />
              <MessageItemMain>
                <MessageItemHeader />
                <MessageItemQuote />
                <MessageItemBody />
                <MessageItemState />
                <MessageItemAttachments />
                <MessageItemReactions />
                <MessageItemReplies />
              </MessageItemMain>
              <MessageItemActions />
            </>
          ),
        },
        {
          "data-mid": message.id,
          tabIndex,
          "aria-label": `${author?.name ?? "System"}, ${time}`,
        },
      )}
    </MessageCtx.Provider>
  );
}
