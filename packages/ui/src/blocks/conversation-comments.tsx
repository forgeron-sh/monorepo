// Comments in the margin of a document: each thread is anchored to a block or to a range of text
// (by the block's id and offsets), laid out beside what it is about without overlapping, with an
// open and resolved filter, replies, resolve and reopen, and mentions through the RichComposer.
// The block draws no highlight and edits no text: the document is yours; it only reads where
// the anchors are.

import { CheckmarkCircle01Icon, Message01Icon, RefreshIcon } from "@forgeron/icons";
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
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

export interface InlineCommentsProps {
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
  className?: string;
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
  className,
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
  const lane = useRef<HTMLDivElement>(null);
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

  const onKeyDown = (event: KeyboardEvent<HTMLElement>, id: string) => {
    if (event.key === "Escape" && event.target === event.currentTarget) {
      setFront(null);
      setReplying(null);
    }
    void id;
  };

  const thread = (t: InlineThread) => {
    const on = front === t.id;
    const done = t.status === "resolved";
    const [first, ...rest] = t.comments;
    const lostAnchor = margin && tops.has(t.id) && tops.get(t.id) == null && !!anchorsIn;
    return (
      <article
        key={t.id}
        ref={(el) => {
          if (el) cards.current.set(t.id, el);
          else cards.current.delete(t.id);
        }}
        data-thread={t.id}
        aria-label={`Comment by ${first?.author ?? "someone"}${done ? ", resolved" : ""}`}
        tabIndex={0}
        className={cx("fg-icom-card", on && "fg-icom-card-active", done && "fg-icom-card-done")}
        style={margin ? { top: laid.get(t.id) ?? 0 } : undefined}
        onFocus={(e) => {
          if (e.target === e.currentTarget) setFront(t.id);
        }}
        onClick={() => setFront(t.id)}
        onKeyDown={(e) => onKeyDown(e, t.id)}
      >
        {t.anchor.kind === "range" && t.anchor.quote ? (
          <blockquote className="fg-icom-quote">{t.anchor.quote}</blockquote>
        ) : null}
        {lostAnchor ? <p className="fg-icom-lost">The text it was about is gone.</p> : null}
        <ol className="fg-icom-list">
          {[first, ...rest].filter(Boolean).map((c) => (
            <li key={c!.id} className="fg-icom-comment">
              <div className="fg-icom-head">
                <Avatar name={c!.author} size={20} {...(c!.avatar ? { src: c!.avatar } : {})} />
                <b>{c!.author}</b>
                <span className="fg-icom-at">{c!.at}</span>
              </div>
              <p className="fg-icom-body">
                <ConversationText body={c!.body} />
              </p>
            </li>
          ))}
        </ol>
        {replying === t.id ? (
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
                onReply?.(t.id, text, found);
                setReplying(null);
              })
            }
          />
        ) : null}
        <div className="fg-icom-acts">
          {replying !== t.id && !done ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setFront(t.id);
                setReplying(t.id);
              }}
            >
              <Icon icon={Message01Icon} size={12} variant="mono" />
              Reply
            </Button>
          ) : null}
          {replying === t.id ? (
            <Button size="sm" variant="ghost" onClick={() => setReplying(null)}>
              Cancel
            </Button>
          ) : null}
          {done ? (
            <Button size="sm" variant="ghost" onClick={() => onReopen?.(t.id)}>
              <Icon icon={RefreshIcon} size={12} variant="mono" />
              Reopen
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => onResolve?.(t.id)}>
              <Icon icon={CheckmarkCircle01Icon} size={12} variant="mono" />
              Resolve
            </Button>
          )}
        </div>
      </article>
    );
  };

  const total = ids.length;
  const laneHeight = margin ? Math.max(floor - gap, 0) : undefined;

  return (
    <section aria-label={label} className={cx("fg-icom", `fg-icom-${layout}`, className)}>
      <div className="fg-icom-bar">
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
      </div>
      <div
        ref={lane}
        className="fg-icom-lane"
        style={margin && total > 0 ? { height: laneHeight } : undefined}
      >
        {draft ? (
          <article
            ref={(el) => {
              if (el) cards.current.set("draft", el);
              else cards.current.delete("draft");
            }}
            className="fg-icom-card fg-icom-card-active fg-icom-draft"
            aria-label="New comment"
            style={margin ? { top: laid.get("draft") ?? 0 } : undefined}
          >
            {draft.kind === "range" && draft.quote ? (
              <blockquote className="fg-icom-quote">{draft.quote}</blockquote>
            ) : null}
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
          </article>
        ) : null}
        {list.map(thread)}
        {list.length === 0 && !draft ? (
          <EmptyState
            title={shown === "resolved" ? "Nothing resolved" : "No comments"}
            icon={Message01Icon}
            description={
              shown === "resolved"
                ? "Resolved threads are kept here."
                : "Select text in the page to start a thread."
            }
          />
        ) : null}
      </div>
    </section>
  );
}
