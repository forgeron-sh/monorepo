// The messages of a conversation as a log: runs by author, a separator at each day, the "new
// messages" divider, system lines. It stays at the bottom while you are at the bottom, leaves you
// where you are when you have scrolled up (a "Jump to latest" button says how many came), and keeps
// your place when older messages are added on top. New messages from others are announced politely.
// One message is the tab stop (a roving focus: `useCollection`'s item props are on each
// `MessageItem`); the arrows, j, k, Home and End move between messages.
//
// With `messages` alone it is the usual log. With children it is a frame, and the parts compose it:
//
//   <MessageList messages={messages} currentUserId="me">
//     <MessageListScroll>
//       <MessageListOlder />
//       <MessageListRows />
//     </MessageListScroll>
//     <MessageListJump />
//     <MessageListStatus />
//   </MessageList>
//
// The rows are one flat list (`buildConversationRows`), rendered with a plain map: a windowed list
// can take the same rows, render a slice and keep the same `MessageItem`.

import { ArrowDown01Icon } from "@forgeron/icons";
import type { HTMLAttributes, KeyboardEvent, ReactNode, Ref } from "react";
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cx } from "../cx";
import { useCollection, type Collection } from "../hooks/use-collection";
import { Icon } from "../icon";
import {
  buildConversationRows,
  conversationDayLabel,
  conversationPlainText,
  type ConversationMessage,
  type ConversationRow,
} from "./conversation-model";
import { ConversationText, MessageItem, type MessageHandlers } from "./conversation-message";
import { part, type PartProps } from "../part";

export interface MessageListProps
  extends MessageHandlers, Omit<PartProps<"div">, "children" | "onCopy"> {
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
  /** The parts. Without them, the log is built from the props. */
  children?: ReactNode;
}

interface ListContext {
  label: string;
  rows: ReadonlyArray<ConversationRow>;
  nowIso: string;
  timeZone: string | undefined;
  currentUserId: string;
  handlers: MessageHandlers;
  collection: Collection;
  tabId: string | null;
  menuFor: string | null;
  setMenuFor: (id: string | null) => void;
  onMessageKey: (event: KeyboardEvent<HTMLElement>, message: ConversationMessage) => void;
  jump: (id: string) => void;
  scroller: Ref<HTMLDivElement>;
  content: Ref<HTMLDivElement>;
  onScroll: () => void;
  away: boolean;
  fresh: number;
  said: string;
  toBottom: (smooth?: boolean) => void;
  loadingOlder: boolean;
  newMessagesLabel: string;
  empty: string;
}

const ListCtx = createContext<ListContext | null>(null);

function useList(name: string): ListContext {
  const ctx = useContext(ListCtx);
  if (!ctx) throw new Error(`<${name}> goes inside a <MessageList>.`);
  return ctx;
}

const NEAR = 48;

type ItemProps = Omit<HTMLAttributes<HTMLElement>, "onCopy">;

const reducedMotion = () =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------------------------------------------------------- parts */

/** The scrolling area, the `log`; its children go in the column of rows, the collection's container. */
export function MessageListScroll({ children, ...rest }: Omit<PartProps<"div">, "onScroll">) {
  const { label, scroller, content, onScroll, collection } = useList("MessageListScroll");
  return part(
    "div",
    "message-list-scroll",
    "fg-conv-scroll",
    {
      ...rest,
      children: (
        <div
          {...(collection.getContainerProps({ ref: content as Ref<HTMLElement> }) as object)}
          data-slot="message-list-rows"
          className="fg-conv-rows"
        >
          {children}
        </div>
      ),
    },
    { ref: scroller, role: "log", "aria-label": label, "aria-live": "off", onScroll },
  );
}

/** "Loading earlier messages…", while older ones are fetched. */
export function MessageListOlder({ children, ...rest }: PartProps<"p">) {
  const { loadingOlder } = useList("MessageListOlder");
  if (!loadingOlder) return null;
  return part("p", "message-list-older", "fg-conv-older", {
    ...rest,
    children: children ?? "Loading earlier messages…",
  });
}

/** The separator at the start of a day. */
export function MessageListDay({
  row,
  ...rest
}: PartProps<"div"> & { row: Extract<ConversationRow, { type: "day" }> }) {
  const { nowIso, timeZone } = useList("MessageListDay");
  return part(
    "div",
    "message-list-day",
    "fg-conv-day",
    {
      ...rest,
      children: rest.children ?? (
        <time dateTime={row.day}>{conversationDayLabel(row.at, nowIso, timeZone)}</time>
      ),
    },
    { role: "separator" },
  );
}

/** The "New messages" divider. */
export function MessageListUnread({ children, ...rest }: PartProps<"div">) {
  const { newMessagesLabel } = useList("MessageListUnread");
  return part(
    "div",
    "message-list-unread",
    "fg-conv-unread",
    { ...rest, children: children ?? <span>{newMessagesLabel}</span> },
    { role: "separator", "aria-label": newMessagesLabel },
  );
}

/** A line of the system: "Karim joined the channel". */
export function MessageListSystem({
  message,
  ...rest
}: PartProps<"div"> & { message: ConversationMessage }) {
  return part(
    "div",
    "message-list-system",
    "fg-conv-system",
    {
      ...rest,
      children:
        rest.children ??
        (message.body !== undefined ? <ConversationText body={message.body} /> : null),
    },
    { role: "note", "data-mid": message.id },
  );
}

/**
 * The rows of the log: days, the divider, system lines and messages, each message with the item
 * props of the list's collection. `renderRow` replaces how a row is drawn; it gets the usual one.
 */
export function MessageListRows({
  renderRow,
}: {
  renderRow?: (row: ConversationRow, usual: ReactNode) => ReactNode;
}) {
  const {
    rows,
    empty,
    collection,
    tabId,
    menuFor,
    setMenuFor,
    onMessageKey,
    jump,
    currentUserId,
    timeZone,
    handlers,
  } = useList("MessageListRows");
  if (rows.length === 0) return <p className="fg-conv-empty">{empty}</p>;
  const usual = (row: ConversationRow): ReactNode => {
    if (row.type === "day") return <MessageListDay key={row.key} row={row} />;
    if (row.type === "unread") return <MessageListUnread key={row.key} />;
    if (row.type === "system") return <MessageListSystem key={row.key} message={row.message} />;
    const { message } = row;
    return (
      <MessageItem
        key={row.key}
        message={message}
        head={row.head}
        {...(collection.getItemProps(message.id) as ItemProps)}
        tabIndex={message.id === tabId ? 0 : -1}
        menuOpen={menuFor === message.id}
        onMenuOpenChange={(open) => setMenuFor(open ? message.id : null)}
        onKeyDown={(event) => onMessageKey(event, message)}
        {...handlers}
        currentUserId={currentUserId}
        timeZone={timeZone}
        onJumpTo={jump}
      />
    );
  };
  return <>{rows.map((row) => (renderRow ? renderRow(row, usual(row)) : usual(row)))}</>;
}

/** "Jump to latest", with how many came; shown when scrolled away from the bottom. */
export function MessageListJump({ children, ...rest }: Omit<PartProps<"button">, "onClick">) {
  const { away, fresh, toBottom } = useList("MessageListJump");
  if (!away) return null;
  return part(
    "button",
    "message-list-jump",
    "fg-conv-jump",
    {
      ...rest,
      children: children ?? (
        <>
          <Icon icon={ArrowDown01Icon} size={12} variant="mono" />
          Jump to latest
          {fresh > 0 ? <span className="fg-conv-jump-count"> · {fresh} new</span> : null}
        </>
      ),
    },
    { type: "button", onClick: () => toBottom(true) },
  );
}

/** The polite live region that says who wrote. */
export function MessageListStatus(props: PartProps<"div">) {
  const { said } = useList("MessageListStatus");
  return part(
    "div",
    "message-list-status",
    "fg-sr",
    { ...props, children: props.children ?? said },
    { role: "status", "aria-live": "polite", "aria-atomic": "true" },
  );
}

/* ---------------------------------------------------------------- the list */

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
  loadingOlder = false,
  newMessagesLabel = "New messages",
  empty = "No messages yet.",
  children,
  className,
  asChild,
  currentUserId,
  timeZone,
  onJumpTo,
  onReact,
  onReply,
  onOpenThread,
  onEdit,
  onDelete,
  onRetry,
  onDiscard,
  onCopy,
  actions,
  onAction,
  onMentionClick,
  categories,
  ...rest
}: MessageListProps) {
  const handlers: MessageHandlers = {
    currentUserId,
    timeZone,
    onReact,
    onReply,
    onOpenThread,
    onEdit,
    onDelete,
    onRetry,
    onDiscard,
    onCopy,
    actions,
    onAction,
    onMentionClick,
    categories,
  };
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

  // The arrows, j, k, Home and End are the collection's; each message is an item that holds the
  // focus (roving), and a key typed inside a message (a button, the composer) is left alone.
  const collection = useCollection({
    items: nav,
    getId: (id) => id,
    selectionMode: "none",
    vimKeys: true,
    focused: active,
    onFocusedChange: setActive,
    ignoreTarget: (target) => !target.matches("[data-collection-item]"),
  });
  const jump = (id: string) => {
    const el = content.current?.querySelector<HTMLElement>(`[data-mid="${CSS.escape(id)}"]`);
    if (!el) return;
    el.scrollIntoView?.({ block: "center", behavior: reducedMotion() ? "auto" : "smooth" });
    collection.focus(id);
    onJumpTo?.(id);
  };

  const onMessageKey = (event: KeyboardEvent<HTMLElement>, message: ConversationMessage) => {
    if (event.target !== event.currentTarget) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const index = nav.indexOf(message.id);
    const key = event.key;
    const settled = !message.status && !message.deleted;
    // The arrows, j, k, Home and End are left to the collection.
    if (key === "PageUp") collection.focus(nav[Math.max(index - 10, 0)]!);
    else if (key === "PageDown") collection.focus(nav[Math.min(index + 10, nav.length - 1)]!);
    else if (key === "r" && settled && onReply) onReply(message);
    else if (key === "t" && settled && onOpenThread) onOpenThread(message);
    else if (key === "e" && settled && message.author?.id === currentUserId && onEdit)
      onEdit(message);
    else if (key === "m" || key === "ContextMenu") setMenuFor(message.id);
    else return;
    event.preventDefault();
  };

  const ctx: ListContext = {
    label,
    rows,
    nowIso,
    timeZone,
    currentUserId,
    handlers,
    collection,
    tabId,
    menuFor,
    setMenuFor,
    onMessageKey,
    jump,
    scroller,
    content,
    onScroll,
    away,
    fresh,
    said,
    toBottom,
    loadingOlder,
    newMessagesLabel,
    empty,
  };

  return (
    <ListCtx.Provider value={ctx}>
      {part("div", "message-list", "fg-conv", {
        className: cx(className),
        asChild,
        ...rest,
        children: children ?? (
          <>
            <MessageListScroll>
              <MessageListOlder />
              <MessageListRows />
            </MessageListScroll>
            <MessageListJump />
            <MessageListStatus />
          </>
        ),
      })}
    </ListCtx.Provider>
  );
}
