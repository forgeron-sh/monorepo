// One message of a conversation: author and time on the first of a run, the quote it answers, the
// text (bold, italic, code, links and mentions read from it, never HTML), what became of it
// (sending, failed with a retry, edited, deleted), its files, its reactions, the thread it opened
// and, on hover or focus, its actions: react, reply in a thread, and a menu. MessageList and
// ThreadPanel are made of these.

import {
  Copy01Icon,
  Delete02Icon,
  Edit02Icon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  ReplyIcon,
  SmilePlusIcon,
} from "@forgeron/icons";
import type { KeyboardEvent, ReactNode } from "react";
import { useState } from "react";
import { Avatar } from "../avatar";
import { Button } from "../button";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { IconButton } from "../identity";
import { Popover } from "../popover";
import { AttachmentList } from "./conversation-attachments";
import { EmojiPicker, ReactionBar } from "./conversation-emoji";
import {
  conversationPlainText,
  conversationTime,
  parseConversationInline,
  type ConversationInline,
  type ConversationMessage,
  type EmojiCategory,
} from "./conversation-model";
import { ActionMenu, type ActionMenuEntry } from "./navigation-action-menu";

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

export interface MessageItemProps extends MessageHandlers {
  message: ConversationMessage;
  /** Shows the author's name, avatar and time. Default `true`. */
  head?: boolean;
  /** `0` for the one message that is a tab stop of its list, `-1` for the others. */
  tabIndex?: 0 | -1;
  menuOpen?: boolean;
  onMenuOpenChange?: (open: boolean) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
  className?: string;
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

/** One message, with its toolbar and menu. A list gives it `head`, `tabIndex` and `onKeyDown`. */
export function MessageItem({
  message,
  head = true,
  tabIndex = -1,
  menuOpen,
  onMenuOpenChange,
  onKeyDown,
  className,
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

  const hasToolbar = settled && (onReact || onOpenThread || items.length > 0);
  const replies = message.replyCount ?? 0;
  const reactions = message.reactions ?? [];

  return (
    <article
      className={cx(
        "fg-conv-msg",
        head && "fg-conv-msg-head",
        mine && "fg-conv-msg-mine",
        message.status === "sending" && "fg-conv-msg-sending",
        message.status === "failed" && "fg-conv-msg-failed",
        message.deleted && "fg-conv-msg-deleted",
        (open || picking) && "fg-conv-msg-active",
        className,
      )}
      data-mid={message.id}
      tabIndex={tabIndex}
      aria-label={`${author?.name ?? "System"}, ${time}`}
      onKeyDown={onKeyDown}
    >
      <div className="fg-conv-msg-side">
        {head ? (
          <Avatar
            name={author?.name ?? "?"}
            size={28}
            {...(author?.avatar ? { src: author.avatar } : {})}
          />
        ) : (
          <time className="fg-conv-msg-time" dateTime={message.at}>
            {time}
          </time>
        )}
      </div>
      <div className="fg-conv-msg-main">
        {head ? (
          <header className="fg-conv-msg-header">
            <b className="fg-conv-msg-author">{author?.name}</b>
            {author?.role ? <span className="fg-conv-msg-role">{author.role}</span> : null}
            <time className="fg-conv-msg-when" dateTime={message.at}>
              {time}
            </time>
          </header>
        ) : null}
        {message.replyTo ? (
          <button
            type="button"
            className="fg-conv-quote"
            disabled={!onJumpTo || !message.replyTo.id}
            aria-label={`In reply to ${message.replyTo.author}: ${conversationPlainText(message.replyTo.text)}`}
            onClick={() => message.replyTo?.id && onJumpTo?.(message.replyTo.id)}
          >
            <b>{message.replyTo.author}</b>
            <span>{conversationPlainText(message.replyTo.text)}</span>
          </button>
        ) : null}
        <div className="fg-conv-msg-body">
          {message.deleted ? (
            <em className="fg-conv-deleted">This message was deleted.</em>
          ) : message.body !== undefined ? (
            <ConversationText body={message.body} onMentionClick={onMentionClick} />
          ) : null}
          {message.edited && !message.deleted ? (
            <span className="fg-conv-edited"> (edited)</span>
          ) : null}
        </div>
        {message.status === "sending" ? <span className="fg-conv-state">Sending…</span> : null}
        {message.status === "failed" ? (
          <div className="fg-conv-failed-bar" role="alert">
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
          </div>
        ) : null}
        {!message.deleted && (message.attachments?.length ?? 0) > 0 ? (
          <AttachmentList items={message.attachments!} layout="grid" />
        ) : null}
        {!message.deleted && reactions.length > 0 ? (
          <ReactionBar
            reactions={reactions}
            currentUserId={currentUserId}
            canAdd={onReact !== undefined}
            readOnly={onReact === undefined}
            onToggle={(emoji) => onReact?.(message.id, emoji)}
            {...(categories ? { categories } : {})}
          />
        ) : null}
        {!message.deleted && replies > 0 ? (
          <button
            type="button"
            className="fg-conv-replies"
            disabled={!onOpenThread}
            onClick={() => onOpenThread?.(message)}
          >
            {replies} {replies === 1 ? "reply" : "replies"}
            {message.lastReplyAt ? (
              <span className="fg-conv-replies-last">
                {" "}
                · last {conversationTime(message.lastReplyAt, timeZone)}
              </span>
            ) : null}
          </button>
        ) : null}
      </div>
      {hasToolbar ? (
        <div className="fg-conv-msg-actions" role="group" aria-label="Message actions">
          {onReact ? (
            <Popover
              label="Add a reaction"
              open={picking}
              onOpenChange={setPicking}
              width={300}
              align="end"
              trigger={
                <IconButton icon={SmilePlusIcon} label="Add a reaction" size="sm" variant="boxed" />
              }
            >
              <EmojiPicker
                autoFocus
                {...(categories ? { categories } : {})}
                onSelect={(emoji) => {
                  onReact(message.id, emoji);
                  setPicking(false);
                }}
              />
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
          {items.length > 0 ? (
            <ActionMenu
              items={items}
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
        </div>
      ) : null}
    </article>
  );
}
