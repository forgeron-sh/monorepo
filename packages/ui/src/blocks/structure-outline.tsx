// The table of contents of a document: from a list of headings, or read from the headings of an
// element of the page, nested by level. The heading you are reading is marked as you scroll
// (scroll-spy), a click scrolls to one, and a branch folds.

import { ArrowRight01Icon } from "@forgeron/icons";
import { useEffect, useId, useRef, useState, type MouseEvent, type RefObject } from "react";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { Tree, TreeGroup, TreeItem, TreeItemContent } from "../tree";
import {
  structureActiveHeading,
  structureHeadingsFrom,
  structureOutlineTree,
  type StructureHeading,
  type StructureOutlineNode,
} from "./structure-model";

export type OutlineHeading = StructureHeading;

/** Where something is on the page: a CSS selector, a ref, or the element itself. */
export type OutlineTarget = string | RefObject<HTMLElement | null> | HTMLElement | null;

export interface OutlineProps {
  /** The headings, in document order: `{ id, text, level }`. */
  headings?: ReadonlyArray<OutlineHeading>;
  /**
   * Instead of `headings`: the element whose headings (`h1` to `h6`) are read, and read again when
   * its content changes. A heading with no id is given one.
   */
  from?: OutlineTarget;
  /** The element that scrolls, when it is not the page. */
  scrollRoot?: OutlineTarget;
  /** How far under the top of the scrolling area a heading counts as reached. Default 96. */
  offset?: number;
  /** Only the headings from this level, up to this one. */
  minLevel?: number;
  maxLevel?: number;
  /** The heading being read: set by scrolling, or by you. */
  active?: string | null;
  defaultActive?: string | null;
  onActiveChange?: (id: string | null) => void;
  /** A click on a heading. It scrolls there as well, unless you call `preventDefault`. */
  onSelect?: (id: string, event: MouseEvent<HTMLAnchorElement>) => void;
  /** A branch folds. Default `true`. */
  collapsible?: boolean;
  /** The branches folded. */
  collapsed?: ReadonlyArray<string>;
  defaultCollapsed?: ReadonlyArray<string>;
  onCollapsedChange?: (ids: string[]) => void;
  /** The heading of the panel. Default "On this page". */
  title?: string;
  /** The whole outline folds behind its title. */
  foldable?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Shown when there is no heading. */
  empty?: string;
  className?: string;
}

const resolve = (target: OutlineTarget | undefined): HTMLElement | null => {
  if (typeof document === "undefined" || !target) return null;
  if (typeof target === "string") return document.querySelector<HTMLElement>(target);
  return "current" in target ? target.current : target;
};

const reduced = () =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The headings of a document as a table of contents that follows your reading. */
export function Outline({
  headings,
  from,
  scrollRoot,
  offset = 96,
  minLevel = 1,
  maxLevel = 6,
  active,
  defaultActive = null,
  onActiveChange,
  onSelect,
  collapsible = true,
  collapsed,
  defaultCollapsed = [],
  onCollapsedChange,
  title = "On this page",
  foldable = false,
  open,
  defaultOpen = true,
  onOpenChange,
  empty = "No headings yet",
  className,
}: OutlineProps) {
  const [read, setRead] = useState<ReadonlyArray<OutlineHeading>>([]);
  const [current, setCurrent] = useControllableState<string | null>({
    value: active,
    defaultValue: defaultActive,
    onChange: onActiveChange,
  });
  const [folded, setFolded] = useControllableState<ReadonlyArray<string>>({
    value: collapsed,
    defaultValue: defaultCollapsed,
    onChange: (ids) => onCollapsedChange?.([...ids]),
  });
  const [shown, setShown] = useControllableState<boolean>({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const panel = useId();
  const locked = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Headings read from the page, again whenever it changes.
  useEffect(() => {
    if (headings || from === undefined) return;
    const root = resolve(from);
    if (!root) return;
    let frame = 0;
    const scan = () => {
      frame = 0;
      const next = structureHeadingsFrom(root);
      setRead((prev) =>
        prev.length === next.length &&
        prev.every(
          (h, i) => h.id === next[i]!.id && h.text === next[i]!.text && h.level === next[i]!.level,
        )
          ? prev
          : next,
      );
    };
    scan();
    if (typeof MutationObserver === "undefined") return;
    const watch = new MutationObserver(() => {
      if (!frame) frame = requestAnimationFrame(scan);
    });
    watch.observe(root, { childList: true, subtree: true, characterData: true });
    return () => {
      watch.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [headings, from]);

  const all = (headings ?? read).filter((h) => h.level >= minLevel && h.level <= maxLevel);
  const tree = structureOutlineTree(all);
  const key = all.map((h) => h.id).join("\n");

  // Scroll-spy.
  useEffect(() => {
    if (typeof document === "undefined" || all.length === 0) return;
    const root = resolve(scrollRoot);
    const target: HTMLElement | Window = root ?? window;
    let frame = 0;
    const spy = () => {
      frame = 0;
      if (locked.current) return;
      const base = root ? root.getBoundingClientRect().top : 0;
      const tops = all.flatMap((h) => {
        const el = document.getElementById(h.id);
        return el ? [{ id: h.id, top: el.getBoundingClientRect().top - base }] : [];
      });
      const id = structureActiveHeading(tops, offset);
      if (id) setCurrent(id);
    };
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(spy);
    };
    target.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    spy();
    return () => {
      target.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
      if (frame) cancelAnimationFrame(frame);
    };
    // `all` is read through `key`: it changes when the headings do.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, scrollRoot, offset]);

  useEffect(() => () => void (locked.current && clearTimeout(locked.current)), []);

  const go = (id: string, event: MouseEvent<HTMLAnchorElement>) => {
    onSelect?.(id, event);
    if (event.defaultPrevented) return;
    event.preventDefault();
    reach(id);
  };

  // A heading reached by click, or by Enter and Space on its row.
  const reach = (id: string) => {
    setCurrent(id);
    const el = typeof document === "undefined" ? null : document.getElementById(id);
    if (!el) return;
    // The scroll that follows must not hand the mark to a heading on the way.
    if (locked.current) clearTimeout(locked.current);
    locked.current = setTimeout(() => (locked.current = null), reduced() ? 50 : 700);
    el.scrollIntoView?.({ behavior: reduced() ? "auto" : "smooth", block: "start" });
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
  };

  const holds = (node: StructureOutlineNode, id: string | null): boolean =>
    !!id && node.children.some((c) => c.id === id || holds(c, id));

  // The Tree keeps what is open; the outline keeps what is folded. Without `collapsible`, all open.
  const branches: string[] = [];
  const collect = (nodes: ReadonlyArray<StructureOutlineNode>) => {
    for (const n of nodes) {
      if (n.children.length > 0) branches.push(n.id);
      collect(n.children);
    }
  };
  collect(tree);
  const expanded = collapsible ? branches.filter((id) => !folded.includes(id)) : branches;

  const renderItems = (nodes: ReadonlyArray<StructureOutlineNode>) =>
    nodes.map((node) => {
      const branch = node.children.length > 0;
      const fold = collapsible && branch && folded.includes(node.id);
      return (
        <TreeItem key={node.id} id={node.id} textValue={node.text} className="fg-outline-item">
          <TreeItemContent
            indicator={collapsible}
            className={cx(
              "fg-outline-row",
              current === node.id && "fg-outline-active",
              fold && holds(node, current) && "fg-outline-within",
            )}
          >
            <a
              href={`#${node.id}`}
              className="fg-outline-link"
              tabIndex={-1}
              {...(current === node.id ? { "aria-current": "location" as const } : {})}
              onClick={(e) => go(node.id, e)}
            >
              {node.text}
            </a>
          </TreeItemContent>
          {branch ? (
            <TreeGroup className="fg-outline-list">{renderItems(node.children)}</TreeGroup>
          ) : null}
        </TreeItem>
      );
    });

  return (
    <nav aria-label={title} className={cx("fg-outline", className)}>
      {foldable ? (
        <button
          type="button"
          className="fg-outline-head fg-outline-head-button"
          aria-expanded={shown}
          aria-controls={panel}
          onClick={() => setShown(!shown)}
        >
          <Icon
            icon={ArrowRight01Icon}
            size={12}
            variant="mono"
            className={cx("fg-outline-fold", shown && "fg-outline-fold-open")}
          />
          {title}
        </button>
      ) : (
        <p className="fg-outline-head">{title}</p>
      )}
      <div id={panel} hidden={!shown}>
        {tree.length ? (
          <Tree
            className="fg-outline-list"
            aria-label={title}
            expanded={expanded}
            onExpandedChange={(open) => {
              if (collapsible) setFolded(branches.filter((id) => !open.includes(id)));
            }}
            selected={current ? [current] : []}
            onSelectedChange={(ids) => {
              if (ids[0] && ids[0] !== current) reach(ids[0]);
            }}
            onActivate={reach}
          >
            {renderItems(tree)}
          </Tree>
        ) : (
          <p className="fg-outline-empty">{empty}</p>
        )}
      </div>
    </nav>
  );
}
