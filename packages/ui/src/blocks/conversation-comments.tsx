// Comments in the margin of a document: each thread is anchored to a block or to a range of text
// (by the block's id and offsets), laid out beside what it is about without overlapping, with an
// open and resolved filter, replies, resolve and reopen, and mentions through the RichComposer.
// The block draws no highlight and edits no text: the document is yours; it only reads where
// the anchors are.
//
// With `threads` alone it is the usual margin. With children it is a frame, and the parts compose
// it (a thread's own parts go inside `InlineCommentsThread`):
//
//   <InlineComments threads={threads} anchorsIn="#doc" onReply={reply} onResolve={resolve}>
//     <InlineCommentsBar />
//     <InlineCommentsLane>
//       <InlineCommentsDraft />
//       <InlineCommentsThreads renderThread={(t) => (
//         <InlineCommentsThread thread={t}>
//           <InlineCommentsQuote /><InlineCommentsEntries /><InlineCommentsComposer /><InlineCommentsActions />
//         </InlineCommentsThread>
//       )} />
//       <InlineCommentsEmpty />
//     </InlineCommentsLane>
//   </InlineComments>

import { CheckmarkCircle01Icon, Message01Icon, RefreshIcon } from "@forgeron/icons";
import {
  createContext,
  Fragment,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Avatar } from "../avatar";
import { Button } from "../button";
import { Segmented } from "../controls";
import { cx } from "../cx";
import { EmptyState } from "../feedback";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { RichComposer, type ComposerSend } from "../composer";
import type { MentionOption, ParsedMention } from "./conversation-model";
import { ConversationText } from "./conversation-message";
import { part, type PartProps } from "../part";
import { structureLayoutThreads, type StructureAnchor } from "./structure-model";
import type { OutlineTarget } from "./structure-outline";

export interface InlineComment {
  id: string;
  author: string;
  avatar?: string;
  /** When it was written, already formatted: "Nov 17, 15:40". */
  at: string;
  /** The text, with mentions as `@[Léa Martin](lea)`. */
  body: string;
}

export interface InlineThread {
  id: string;
  anchor: StructureAnchor;
  status: "open" | "resolved";
  /** The first comment, then its replies. */
  comments: ReadonlyArray<InlineComment>;
}

export type InlineThreadFilter = "open" | "resolved" | "all";

export interface InlineCommentsProps extends Omit<PartProps<"section">, "children" | "onReset"> {
  threads: ReadonlyArray<InlineThread>;
  /**
   * The element of the document whose `[data-block-id]` children are the blocks the anchors name.
   * A selector, a ref or the element. With it, the cards sit beside their anchors.
   */
  anchorsIn?: OutlineTarget;
  /** Where an anchor is, px from the top of the margin; a number or `null` when it is gone. Replaces `anchorsIn`. */
  measure?: (anchor: StructureAnchor) => number | null;
  /** `margin` (default): beside the anchors. `stack`: one under the other, for a narrow screen. */
  layout?: "margin" | "stack";
  filter?: InlineThreadFilter;
  defaultFilter?: InlineThreadFilter;
  onFilterChange?: (filter: InlineThreadFilter) => void;
  /** The thread in front: on its anchor, the others make room. */
  active?: string | null;
  defaultActive?: string | null;
  onActiveChange?: (id: string | null) => void;
  onReply?: (threadId: string, text: string, mentions: ParsedMention[]) => void;
  onResolve?: (threadId: string) => void;
  onReopen?: (threadId: string) => void;
  /** A selection to comment on: a card with a box to write, at that place. */
  draft?: StructureAnchor | null;
  /** The first comment of a new thread. */
  onCreate?: (anchor: StructureAnchor, text: string, mentions: ParsedMention[]) => void;
  onCancelDraft?: () => void;
  /** The people `@` offers. */
  mentions?: ReadonlyArray<MentionOption>;
  /** Space between two cards, px. Default 8. */
  gap?: number;
  /** Names the region. Default "Comments". */
  label?: string;
  /** The parts (`InlineCommentsBar`, `InlineCommentsLane`). Without them, the margin is built from the props. */
  children?: ReactNode;
}

/** Where a text offset of a block is: the block's node and the offset in it. */
function pointIn(block: Element, offset: number): { node: Node; offset: number } | null {
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  let seen = 0;
  let last: Text | null = null;
  for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
    last = n;
    if (seen + n.data.length >= offset) return { node: n, offset: offset - seen };
    seen += n.data.length;
  }
  return last ? { node: last, offset: last.data.length } : null;
}

/**
 * Where an anchor is, in px from the top of `origin`: the line of its range when the browser can
 * tell, else the top of its block. Null when the block is not in `root`.
 */
export function inlineCommentAnchorTop(
  root: ParentNode,
  anchor: StructureAnchor,
  origin: Element,
): number | null {
  const block = Array.from(root.querySelectorAll("[data-block-id]")).find(
    (el) => el.getAttribute("data-block-id") === anchor.blockId,
  );
  if (!block) return null;
  const base = origin.getBoundingClientRect().top;
  if (anchor.kind === "range") {
    const a = pointIn(block, anchor.start);
    const b = pointIn(block, anchor.end);
    if (a && b && typeof document.createRange === "function") {
      const range = document.createRange();
      range.setStart(a.node, a.offset);
      range.setEnd(b.node, b.offset);
      const rect = range.getBoundingClientRect?.();
      if (rect && (rect.height > 0 || rect.top !== 0)) return rect.top - base;
    }
  }
  return block.getBoundingClientRect().top - base;
}

const resolveRoot = (target: OutlineTarget | undefined): HTMLElement | null => {
  if (typeof document === "undefined" || !target) return null;
  if (typeof target === "string") return document.querySelector<HTMLElement>(target);
  return "current" in target ? target.current : target;
};

const DEFAULT_HEIGHT = 120;

interface CommentsContext {
  list: ReadonlyArray<InlineThread>;
  shown: InlineThreadFilter;
  setShown: (filter: InlineThreadFilter) => void;
  open: number;
  resolved: number;
  front: string | null;
  setFront: (id: string | null) => void;
  replying: string | null;
  setReplying: (id: string | null) => void;
  margin: boolean;
  anchorsIn: OutlineTarget | undefined;
  tops: ReadonlyMap<string, number | null>;
  laid: ReadonlyMap<string, number>;
  laneHeight: number | undefined;
  total: number;
  lane: { current: HTMLDivElement | null };
  card: (id: string) => (el: HTMLElement | null) => void;
  draft: StructureAnchor | null;
  triggers:
    | Array<{ char: string; label: string; options: ReadonlyArray<MentionOption> }>
    | undefined;
  send: (m: ComposerSend, then: (text: string, mentions: ParsedMention[]) => void) => void;
  onReply: InlineCommentsProps["onReply"];
  onResolve: InlineCommentsProps["onResolve"];
  onReopen: InlineCommentsProps["onReopen"];
  onCreate: InlineCommentsProps["onCreate"];
  onCancelDraft: InlineCommentsProps["onCancelDraft"];
}
const CommentsCtx = createContext<CommentsContext | null>(null);
interface ThreadContext {
  thread: InlineThread;
  done: boolean;
}
const ThreadCtx = createContext<ThreadContext | null>(null);

function useComments(name: string): CommentsContext {
  const ctx = useContext(CommentsCtx);
  if (!ctx) throw new Error(`<${name}> goes inside an <InlineComments>.`);
  return ctx;
}
function useThread(name: string): ThreadContext {
  const ctx = useContext(ThreadCtx);
  if (!ctx) throw new Error(`<${name}> goes inside an <InlineCommentsThread>.`);
  return ctx;
}

/* ---------------------------------------------------------------- parts */

/** The Open / Resolved / All filter. */
export function InlineCommentsBar({ children, ...rest }: PartProps<"div">) {
  const { shown, setShown, open, resolved } = useComments("InlineCommentsBar");
  return part("div", "inline-comments-bar", "fg-icom-bar", {
    ...rest,
    children: children ?? (
      <Segmented
        label="Show"
        value={shown}
        onChange={(v) => setShown(v as InlineThreadFilter)}
        options={[
          { value: "open", label: `Open ${open}` },
          { value: "resolved", label: `Resolved ${resolved}` },
          { value: "all", label: "All" },
        ]}
      />
    ),
  });
}

/** The column the cards are laid out in, beside the document. */
export function InlineCommentsLane({ children, style, ...rest }: PartProps<"div">) {
  const { lane, margin, total, laneHeight } = useComments("InlineCommentsLane");
  return part(
    "div",
    "inline-comments-lane",
    "fg-icom-lane",
    {
      ...rest,
      style: margin && total > 0 ? { ...style, height: laneHeight } : style,
      children: children ?? (
        <>
          <InlineCommentsDraft />
          <InlineCommentsThreads />
          <InlineCommentsEmpty />
        </>
      ),
    },
    { ref: lane },
  );
}

/** The quote a thread is anchored to, when it is a range of text. */
export function InlineCommentsQuote({
  anchor,
  ...rest
}: PartProps<"blockquote"> & { anchor?: StructureAnchor }) {
  const thread = useContext(ThreadCtx)?.thread;
  const a = anchor ?? thread?.anchor;
  if (!a || a.kind !== "range" || !a.quote) return null;
  return part("blockquote", "inline-comments-quote", "fg-icom-quote", {
    ...rest,
    children: rest.children ?? a.quote,
  });
}

/** The comments of a thread: the first, then its replies. */
export function InlineCommentsEntries(props: PartProps<"ol">) {
  const { thread } = useThread("InlineCommentsEntries");
  return part("ol", "inline-comments-entries", "fg-icom-list", {
    ...props,
    children:
      props.children ??
      thread.comments.map((c) => (
        <li key={c.id} className="fg-icom-comment" data-slot="inline-comments-entry">
          <div className="fg-icom-head">
            <Avatar name={c.author} size={20} {...(c.avatar ? { src: c.avatar } : {})} />
            <b>{c.author}</b>
            <span className="fg-icom-at">{c.at}</span>
          </div>
          <p className="fg-icom-body">
            <ConversationText body={c.body} />
          </p>
        </li>
      )),
  });
}

/** The box to reply, shown while the person is replying to this thread. */
export function InlineCommentsComposer() {
  const { thread } = useThread("InlineCommentsComposer");
  const { replying, setReplying, triggers, send, onReply } = useComments("InlineCommentsComposer");
  if (replying !== thread.id) return null;
  return (
    <RichComposer
      label="Reply"
      placeholder="Reply…"
      sendLabel="Reply"
      toolbar={false}
      attachmentOptions={false}
      maxRows={5}
      autoFocus
      {...(triggers ? { triggers } : {})}
      onSend={(m) =>
        send(m, (text, found) => {
          onReply?.(thread.id, text, found);
          setReplying(null);
        })
      }
    />
  );
}

/** Reply, Cancel, and Resolve or Reopen. */
export function InlineCommentsActions({ children, ...rest }: PartProps<"div">) {
  const { thread, done } = useThread("InlineCommentsActions");
  const { replying, setReplying, setFront, onReopen, onResolve } =
    useComments("InlineCommentsActions");
  return part("div", "inline-comments-actions", "fg-icom-acts", {
    ...rest,
    children: children ?? (
      <>
        {replying !== thread.id && !done ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setFront(thread.id);
              setReplying(thread.id);
            }}
          >
            <Icon icon={Message01Icon} size={12} variant="mono" />
            Reply
          </Button>
        ) : null}
        {replying === thread.id ? (
          <Button size="sm" variant="ghost" onClick={() => setReplying(null)}>
            Cancel
          </Button>
        ) : null}
        {done ? (
          <Button size="sm" variant="ghost" onClick={() => onReopen?.(thread.id)}>
            <Icon icon={RefreshIcon} size={12} variant="mono" />
            Reopen
          </Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => onResolve?.(thread.id)}>
            <Icon icon={CheckmarkCircle01Icon} size={12} variant="mono" />
            Resolve
          </Button>
        )}
      </>
    ),
  });
}

/** One thread as a card, beside its anchor. Without children: quote, comments, composer, actions. */
export function InlineCommentsThread({
  thread,
  children,
  ...rest
}: Omit<PartProps<"article">, "children"> & { thread: InlineThread; children?: ReactNode }) {
  const { margin, anchorsIn, tops, laid, front, setFront, setReplying, card } =
    useComments("InlineCommentsThread");
  const on = front === thread.id;
  const done = thread.status === "resolved";
  const first = thread.comments[0];
  const lostAnchor = margin && tops.has(thread.id) && tops.get(thread.id) == null && !!anchorsIn;
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape" && event.target === event.currentTarget) {
      setFront(null);
      setReplying(null);
    }
  };
  return (
    <ThreadCtx.Provider value={{ thread, done }}>
      {part(
        "article",
        "inline-comments-thread",
        cx("fg-icom-card", on && "fg-icom-card-active", done && "fg-icom-card-done"),
        {
          ...rest,
          children: children ?? (
            <>
              <InlineCommentsQuote />
              {lostAnchor ? <p className="fg-icom-lost">The text it was about is gone.</p> : null}
              <InlineCommentsEntries />
              <InlineCommentsComposer />
              <InlineCommentsActions />
            </>
          ),
        },
        {
          ref: card(thread.id),
          "data-thread": thread.id,
          "aria-label": `Comment by ${first?.author ?? "someone"}${done ? ", resolved" : ""}`,
          tabIndex: 0,
          style: margin ? { top: laid.get(thread.id) ?? 0 } : undefined,
          onFocus: (e: { target: unknown; currentTarget: unknown }) => {
            if (e.target === e.currentTarget) setFront(thread.id);
          },
          onClick: () => setFront(thread.id),
          onKeyDown,
        },
      )}
    </ThreadCtx.Provider>
  );
}

/** The cards of the threads shown by the filter; `renderThread` draws a card your way. */
export function InlineCommentsThreads({
  renderThread,
}: {
  renderThread?: (thread: InlineThread) => ReactNode;
}) {
  const { list } = useComments("InlineCommentsThreads");
  return (
    <>
      {list.map((t) =>
        renderThread ? (
          <Fragment key={t.id}>{renderThread(t)}</Fragment>
        ) : (
          <InlineCommentsThread key={t.id} thread={t} />
        ),
      )}
    </>
  );
}

/** The card with a box to write the first comment of a new thread, at the selection. */
export function InlineCommentsDraft({
  children,
  ...rest
}: Omit<PartProps<"article">, "children"> & { children?: ReactNode }) {
  const { draft, margin, laid, card, triggers, send, onCreate, onCancelDraft } =
    useComments("InlineCommentsDraft");
  if (!draft) return null;
  return part(
    "article",
    "inline-comments-draft",
    "fg-icom-card fg-icom-card-active fg-icom-draft",
    {
      ...rest,
      children: children ?? (
        <>
          <InlineCommentsQuote anchor={draft} />
          <RichComposer
            label="New comment"
            placeholder="Comment…"
            sendLabel="Comment"
            toolbar={false}
            attachmentOptions={false}
            maxRows={6}
            autoFocus
            {...(triggers ? { triggers } : {})}
            onSend={(m) => send(m, (text, found) => onCreate?.(draft, text, found))}
          />
          <div className="fg-icom-acts">
            <Button size="sm" variant="ghost" onClick={onCancelDraft}>
              Cancel
            </Button>
          </div>
        </>
      ),
    },
    {
      ref: card("draft"),
      "aria-label": "New comment",
      style: margin ? { top: laid.get("draft") ?? 0 } : undefined,
    },
  );
}

/** What is shown when the filter leaves no thread. */
export function InlineCommentsEmpty({ children }: { children?: ReactNode }) {
  const { list, draft, shown } = useComments("InlineCommentsEmpty");
  if (list.length > 0 || draft) return null;
  return (
    <>
      {children ?? (
        <EmptyState
          title={shown === "resolved" ? "Nothing resolved" : "No comments"}
          icon={Message01Icon}
          description={
            shown === "resolved"
              ? "Resolved threads are kept here."
              : "Select text in the page to start a thread."
          }
        />
      )}
    </>
  );
}

/* ---------------------------------------------------------------- the margin */

/** The comment threads of a document, laid out in its margin beside the text they are about. */
export function InlineComments({
  threads,
  anchorsIn,
  measure,
  layout = "margin",
  filter,
  defaultFilter = "open",
  onFilterChange,
  active,
  defaultActive = null,
  onActiveChange,
  onReply,
  onResolve,
  onReopen,
  draft = null,
  onCreate,
  onCancelDraft,
  mentions = [],
  gap = 8,
  label = "Comments",
  children,
  className,
  asChild,
  ...rest
}: InlineCommentsProps) {
  const [shown, setShown] = useControllableState<InlineThreadFilter>({
    value: filter,
    defaultValue: defaultFilter,
    onChange: onFilterChange,
  });
  const [front, setFront] = useControllableState<string | null>({
    value: active,
    defaultValue: defaultActive,
    onChange: onActiveChange,
  });
  const [replying, setReplying] = useState<string | null>(null);
  const [tops, setTops] = useState<ReadonlyMap<string, number | null>>(new Map());
  const [heights, setHeights] = useState<ReadonlyMap<string, number>>(new Map());
  const [tick, setTick] = useState(0);
  const lane = useRef<HTMLDivElement | null>(null);
  const cards = useRef(new Map<string, HTMLElement>());

  const open = threads.filter((t) => t.status === "open").length;
  const resolved = threads.length - open;
  const list = threads.filter((t) => shown === "all" || t.status === shown);
  const margin = layout === "margin";

  const triggers = mentions.length
    ? [{ char: "@", label: "People", options: mentions }]
    : undefined;

  // Where each anchor is now: again when the document or the window changes.
  const key = [...list.map((t) => t.id), draft ? "draft" : ""].join("|");
  useLayoutEffect(() => {
    if (!margin || !lane.current) return;
    const root = resolveRoot(anchorsIn);
    const next = new Map<string, number | null>();
    const find = (anchor: StructureAnchor) =>
      measure ? measure(anchor) : root ? inlineCommentAnchorTop(root, anchor, lane.current!) : null;
    for (const t of list) next.set(t.id, find(t.anchor));
    if (draft) next.set("draft", find(draft));
    setTops((prev) =>
      prev.size === next.size && [...next].every(([k, v]) => prev.get(k) === v) ? prev : next,
    );
    // The thread list is read through `key`, the anchors through their own values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, margin, anchorsIn, measure, tick, threads, draft]);

  useEffect(() => {
    if (!margin) return;
    const root = resolveRoot(anchorsIn);
    const bump = () => setTick((n) => n + 1);
    window.addEventListener("resize", bump);
    const watchers: Array<{ disconnect: () => void }> = [];
    if (root && typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(bump);
      ro.observe(root);
      watchers.push(ro);
    }
    if (root && typeof MutationObserver !== "undefined") {
      const mo = new MutationObserver(bump);
      mo.observe(root, { childList: true, subtree: true, characterData: true });
      watchers.push(mo);
    }
    return () => {
      window.removeEventListener("resize", bump);
      watchers.forEach((w) => w.disconnect());
    };
  }, [margin, anchorsIn]);

  // Card heights, to keep the cards apart.
  useLayoutEffect(() => {
    if (!margin) return;
    const read = () => {
      const next = new Map<string, number>();
      cards.current.forEach((el, id) => next.set(id, el.offsetHeight || DEFAULT_HEIGHT));
      setHeights((prev) =>
        prev.size === next.size && [...next].every(([k, v]) => prev.get(k) === v) ? prev : next,
      );
    };
    read();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(read);
    cards.current.forEach((el) => ro.observe(el));
    return () => ro.disconnect();
  });

  const ids = [...list.map((t) => t.id), ...(draft ? ["draft"] : [])];
  // A card whose anchor is gone goes after the last one.
  const placed = ids.filter((id) => tops.get(id) != null);
  const lost = ids.filter((id) => tops.get(id) == null);
  const laid = structureLayoutThreads(
    placed.map((id) => ({ id, top: tops.get(id)!, height: heights.get(id) ?? DEFAULT_HEIGHT })),
    gap,
    draft ? "draft" : front,
  );
  let floor = 0;
  laid.forEach(
    (top, id) => (floor = Math.max(floor, top + (heights.get(id) ?? DEFAULT_HEIGHT) + gap)),
  );
  for (const id of lost) {
    laid.set(id, floor);
    floor += (heights.get(id) ?? DEFAULT_HEIGHT) + gap;
  }

  const send = (m: ComposerSend, then: (text: string, mentions: ParsedMention[]) => void) => {
    const text = m.text.trim();
    if (text) then(text, m.mentions);
  };
  const card = (id: string) => (el: HTMLElement | null) => {
    if (el) cards.current.set(id, el);
    else cards.current.delete(id);
  };

  const ctx: CommentsContext = {
    list,
    shown,
    setShown,
    open,
    resolved,
    front,
    setFront,
    replying,
    setReplying,
    margin,
    anchorsIn,
    tops,
    laid,
    laneHeight: margin ? Math.max(floor - gap, 0) : undefined,
    total: ids.length,
    lane,
    card,
    draft,
    triggers,
    send,
    onReply,
    onResolve,
    onReopen,
    onCreate,
    onCancelDraft,
  };

  return (
    <CommentsCtx.Provider value={ctx}>
      {part(
        "section",
        "inline-comments",
        cx("fg-icom", `fg-icom-${layout}`),
        {
          className,
          asChild,
          ...rest,
          children: children ?? (
            <>
              <InlineCommentsBar />
              <InlineCommentsLane />
            </>
          ),
        },
        { "aria-label": label },
      )}
    </CommentsCtx.Provider>
  );
}
