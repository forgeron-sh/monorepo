// The messages of a conversation as a log: runs by author, a separator at each day, the "new
// messages" divider, system lines. It stays at the bottom while you are at the bottom, leaves you
// where you are when you have scrolled up (a "Jump to latest" button says how many came), and keeps
// your place when older messages are added on top. New messages from others are announced politely.
// One message is the tab stop; the arrows, Home and End move between messages.
//
// The rows are one flat list (`buildConversationRows`), rendered with a plain map: a windowed list
// can take the same rows, render a slice and keep the same `MessageItem`.

import { ArrowDown01Icon } from "@forgeron/icons";
import type { KeyboardEvent } from "react";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { cx } from "../cx";
import { Icon } from "../icon";
import {
  buildConversationRows,
  conversationDayLabel,
  conversationPlainText,
  type ConversationMessage,
  type ConversationRow,
} from "./conversation-model";
import { ConversationText, MessageItem, type MessageHandlers } from "./conversation-message";

export interface MessageListProps extends MessageHandlers {
  /** Oldest first. */
  messages: ReadonlyArray<ConversationMessage>;
  /** Names the log for assistive technology. Default "Messages". */
  label?: string;
  /** The first message not read yet: the divider goes before it. */
  unreadFromId?: string | null;
  /** Called once when the person reaches the bottom while a divider is shown. */
  onMarkRead?: () => void;
  /** "Now", for Today and Yesterday; the current time by default. Pass it in tests. */
  now?: string;
  /** Minutes of silence that start a new run. Default 5. */
  gapMinutes?: number;
  /** Stay at the bottom while at the bottom. Default `true`. */
  stickToBottom?: boolean;
  /** The list was scrolled to its top: load older messages. */
  onReachTop?: () => void;
  /** Says "Loading earlier messages…" at the top. */
  loadingOlder?: boolean;
  /** Text of the divider. Default "New messages". */
  newMessagesLabel?: string;
  /** Shown when there is no message. */
  empty?: string;
  className?: string;
}

const NEAR = 48;

const reducedMotion = () =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The log of a conversation: runs, days, the unread divider, anchoring at the bottom, the keyboard. */
export function MessageList({
  messages,
  label = "Messages",
  unreadFromId = null,
  onMarkRead,
  now,
  gapMinutes,
  stickToBottom = true,
  onReachTop,
  loadingOlder,
  newMessagesLabel = "New messages",
  empty = "No messages yet.",
  className,
  currentUserId,
  timeZone,
  onJumpTo,
  ...handlers
}: MessageListProps) {
  const rows = useMemo(
    () =>
      buildConversationRows(messages, {
        ...(timeZone ? { timeZone } : {}),
        ...(gapMinutes !== undefined ? { gapMinutes } : {}),
        unreadFromId,
      }),
    [messages, timeZone, gapMinutes, unreadFromId],
  );
  const nav = useMemo(
    () => messages.filter((m) => m.kind !== "system").map((m) => m.id),
    [messages],
  );
  const [mounted] = useState(() => new Date().toISOString());
  const nowIso = now ?? mounted;

  const scroller = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const stuck = useRef(true);
  const seen = useRef<{ first?: string; last?: string; height: number; count: number } | null>(
    null,
  );
  const reached = useRef(false);
  const marked = useRef(false);
  const [away, setAway] = useState(false);
  const [fresh, setFresh] = useState(0);
  const [said, setSaid] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const idBase = useId();
  const tabId = active && nav.includes(active) ? active : (nav.at(-1) ?? null);

  const toBottom = (smooth = false) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo?.({
      top: el.scrollHeight,
      behavior: smooth && !reducedMotion() ? "smooth" : "auto",
    });
    if (!el.scrollTo) el.scrollTop = el.scrollHeight;
  };

  // Anchoring: runs after the DOM has the new rows, before the browser paints.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const last = messages.at(-1);
    const before = seen.current;
    seen.current = {
      ...(messages[0] ? { first: messages[0].id } : {}),
      ...(last ? { last: last.id } : {}),
      height: el.scrollHeight,
      count: messages.length,
    };
    if (!before) {
      toBottom();
      return;
    }
    if (messages[0]?.id !== before.first && last?.id === before.last) {
      // Older messages came on top: keep what is on screen where it is.
      el.scrollTop += el.scrollHeight - before.height;
      return;
    }
    if (last?.id !== before.last) {
      const added = Math.max(messages.length - before.count, 1);
      const own = last?.author?.id === currentUserId;
      if ((stuck.current && stickToBottom) || own) {
        toBottom();
      } else if (!own) setFresh((n) => n + added);
      if (!own && last && last.kind !== "system" && !last.deleted) {
        const text = typeof last.body === "string" ? conversationPlainText(last.body) : "";
        setSaid(`${last.author?.name ?? "Someone"}: ${text}`.trim());
      }
    }
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  // Images and late content change the height: stay at the bottom if that is where we are.
  useEffect(() => {
    const target = content.current;
    if (!target || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      if (stuck.current && stickToBottom) toBottom();
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [stickToBottom]);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const bottom = distance <= NEAR;
    stuck.current = bottom;
    setAway(!bottom);
    if (bottom) {
      setFresh(0);
      if (unreadFromId && !marked.current) {
        marked.current = true;
        onMarkRead?.();
      }
    }
    if (el.scrollTop < NEAR) {
      if (!reached.current) {
        reached.current = true;
        onReachTop?.();
      }
    } else reached.current = false;
  };
  useEffect(() => {
    marked.current = false;
  }, [unreadFromId]);

  const focusMessage = (id: string) => {
    setActive(id);
    content.current?.querySelector<HTMLElement>(`[data-mid="${CSS.escape(id)}"]`)?.focus();
  };
  const jump = (id: string) => {
    const el = content.current?.querySelector<HTMLElement>(`[data-mid="${CSS.escape(id)}"]`);
    if (!el) return;
    el.scrollIntoView?.({ block: "center", behavior: reducedMotion() ? "auto" : "smooth" });
    el.focus();
    setActive(id);
    onJumpTo?.(id);
  };

  const onMessageKey = (event: KeyboardEvent<HTMLElement>, message: ConversationMessage) => {
    if (event.target !== event.currentTarget) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const index = nav.indexOf(message.id);
    const key = event.key;
    const settled = !message.status && !message.deleted;
    if (key === "ArrowUp" || key === "k") focusMessage(nav[Math.max(index - 1, 0)]!);
    else if (key === "ArrowDown" || key === "j")
      focusMessage(nav[Math.min(index + 1, nav.length - 1)]!);
    else if (key === "Home") focusMessage(nav[0]!);
    else if (key === "End") focusMessage(nav.at(-1)!);
    else if (key === "PageUp") focusMessage(nav[Math.max(index - 10, 0)]!);
    else if (key === "PageDown") focusMessage(nav[Math.min(index + 10, nav.length - 1)]!);
    else if (key === "r" && settled && handlers.onReply) handlers.onReply(message);
    else if (key === "t" && settled && handlers.onOpenThread) handlers.onOpenThread(message);
    else if (key === "e" && settled && message.author?.id === currentUserId && handlers.onEdit)
      handlers.onEdit(message);
    else if (key === "m" || key === "ContextMenu") setMenuFor(message.id);
    else return;
    event.preventDefault();
  };

  const renderRow = (row: ConversationRow) => {
    if (row.type === "day") {
      return (
        <div key={row.key} className="fg-conv-day" role="separator">
          <time dateTime={row.day}>{conversationDayLabel(row.at, nowIso, timeZone)}</time>
        </div>
      );
    }
    if (row.type === "unread") {
      return (
        <div
          key={row.key}
          className="fg-conv-unread"
          role="separator"
          aria-label={newMessagesLabel}
        >
          <span>{newMessagesLabel}</span>
        </div>
      );
    }
    if (row.type === "system") {
      const { message } = row;
      return (
        <div key={row.key} className="fg-conv-system" role="note" data-mid={message.id}>
          {message.body !== undefined ? <ConversationText body={message.body} /> : null}
        </div>
      );
    }
    const { message } = row;
    return (
      <MessageItem
        key={row.key}
        message={message}
        head={row.head}
        tabIndex={message.id === tabId ? 0 : -1}
        menuOpen={menuFor === message.id}
        onMenuOpenChange={(open) => setMenuFor(open ? message.id : null)}
        onKeyDown={(event) => onMessageKey(event, message)}
        currentUserId={currentUserId}
        timeZone={timeZone}
        onJumpTo={jump}
        {...handlers}
      />
    );
  };

  return (
    <div className={cx("fg-conv", className)}>
      <div
        ref={scroller}
        className="fg-conv-scroll"
        role="log"
        aria-label={label}
        aria-live="off"
        onScroll={onScroll}
      >
        <div ref={content} className="fg-conv-rows">
          {loadingOlder ? <p className="fg-conv-older">Loading earlier messages…</p> : null}
          {rows.length === 0 ? <p className="fg-conv-empty">{empty}</p> : rows.map(renderRow)}
        </div>
      </div>
      {away ? (
        <button type="button" className="fg-conv-jump" onClick={() => toBottom(true)}>
          <Icon icon={ArrowDown01Icon} size={12} variant="mono" />
          Jump to latest
          {fresh > 0 ? <span className="fg-conv-jump-count"> · {fresh} new</span> : null}
        </button>
      ) : null}
      <div
        id={`${idBase}-said`}
        className="fg-sr"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {said}
      </div>
    </div>
  );
}
