// The table of contents of a document: from a list of headings, or read from the headings of an
// element of the page, nested by level. The heading you are reading is marked as you scroll
// (scroll-spy), a click scrolls to one, and a branch folds.
//
// With props it is the whole panel; with children it is the root of the parts:
//
//   <Outline headings={headings}>
//     <OutlineTitle>Contents</OutlineTitle>
//     <OutlineContent><OutlineList /></OutlineContent>
//   </Outline>

import { ArrowRight01Icon } from "@forgeron/icons";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { PartElement as Part } from "../part";
import { Tree, TreeGroup, TreeItem, TreeItemContent, type TreeRootProps } from "../tree";
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
  /** The parts. Without them the outline draws its title and its list. */
  children?: ReactNode;
  className?: string;
}

const resolve = (target: OutlineTarget | undefined): HTMLElement | null => {
  if (typeof document === "undefined" || !target) return null;
  if (typeof target === "string") return document.querySelector<HTMLElement>(target);
  return "current" in target ? target.current : target;
};

const reduced = () =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------------------------------------------------------- context */

interface OutlineContext {
  tree: ReadonlyArray<StructureOutlineNode>;
  current: string | null;
  folded: ReadonlyArray<string>;
  setFolded: (ids: ReadonlyArray<string>) => void;
  branches: string[];
  expanded: string[];
  collapsible: boolean;
  foldable: boolean;
  shown: boolean;
  setShown: (open: boolean) => void;
  panel: string;
  title: string;
  empty: string;
  reach: (id: string) => void;
  go: (id: string, event: MouseEvent<HTMLAnchorElement>) => void;
}

const Ctx = createContext<OutlineContext | null>(null);

/** The state of the enclosing `Outline`: the nested headings, the one read, what is folded. */
export function useOutline(): OutlineContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("Outline parts go inside an <Outline>.");
  return ctx;
}

const holds = (node: StructureOutlineNode, id: string | null): boolean =>
  !!id && node.children.some((c) => c.id === id || holds(c, id));

/* ---------------------------------------------------------------- parts */

export type OutlineTitleProps = Omit<ComponentProps<"p">, "ref"> & { asChild?: boolean };

/** The heading of the panel: a button that folds the whole outline when it is `foldable`. */
export function OutlineTitle({ asChild, className, children, ...rest }: OutlineTitleProps) {
  const { foldable, shown, setShown, panel, title } = useOutline();
  const text = children ?? title;
  if (foldable) {
    return (
      <button
        type="button"
        data-slot="outline-title"
        aria-expanded={shown}
        aria-controls={panel}
        {...(rest as ComponentProps<"button">)}
        className={cx("fg-outline-head fg-outline-head-button", className)}
        onClick={() => setShown(!shown)}
      >
        <Icon
          icon={ArrowRight01Icon}
          size={12}
          variant="mono"
          className={cx("fg-outline-fold", shown && "fg-outline-fold-open")}
        />
        {text}
      </button>
    );
  }
  return (
    <Part
      as="p"
      asChild={asChild}
      data-slot="outline-title"
      {...rest}
      className={cx("fg-outline-head", className)}
    >
      {text}
    </Part>
  );
}

export type OutlineContentProps = Omit<ComponentProps<"div">, "ref"> & { asChild?: boolean };

/** What folds behind the title: the list. */
export function OutlineContent({ asChild, className, children, ...rest }: OutlineContentProps) {
  const { panel, shown } = useOutline();
  return (
    <Part
      asChild={asChild}
      id={panel}
      hidden={!shown}
      data-slot="outline-content"
      {...rest}
      className={className}
    >
      {children}
    </Part>
  );
}

export interface OutlineLinkProps extends Omit<ComponentProps<"a">, "ref" | "id"> {
  /** The id of the heading it goes to. */
  id: string;
}

/** The link to one heading: marks itself as the location when it is the one read. */
export function OutlineLink({ id, className, onClick, children, ...rest }: OutlineLinkProps) {
  const { current, go } = useOutline();
  return (
    <a
      href={`#${id}`}
      tabIndex={-1}
      data-slot="outline-link"
      {...(current === id ? { "aria-current": "location" as const } : {})}
      {...rest}
      className={cx("fg-outline-link", className)}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) go(id, e);
      }}
    >
      {children}
    </a>
  );
}

export interface OutlineItemProps extends Omit<ComponentProps<"li">, "ref" | "id"> {
  node: StructureOutlineNode;
}

/** One heading and the ones under it. Its children replace the link. */
export function OutlineItem({ node, className, children, ...rest }: OutlineItemProps) {
  const { current, folded, collapsible } = useOutline();
  const branch = node.children.length > 0;
  const fold = collapsible && branch && folded.includes(node.id);
  return (
    <TreeItem
      id={node.id}
      textValue={node.text}
      data-slot="outline-item"
      {...rest}
      className={cx("fg-outline-item", className)}
    >
      <TreeItemContent
        indicator={collapsible}
        className={cx(
          "fg-outline-row",
          current === node.id && "fg-outline-active",
          fold && holds(node, current) && "fg-outline-within",
        )}
      >
        {children ?? <OutlineLink id={node.id}>{node.text}</OutlineLink>}
      </TreeItemContent>
      {branch ? (
        <TreeGroup className="fg-outline-list">
          <OutlineItems nodes={node.children} />
        </TreeGroup>
      ) : null}
    </TreeItem>
  );
}

/** The items of some nodes (default: the top ones), one `OutlineItem` each. */
export function OutlineItems({ nodes }: { nodes?: ReadonlyArray<StructureOutlineNode> }) {
  const { tree } = useOutline();
  return (nodes ?? tree).map((node) => <OutlineItem key={node.id} node={node} />);
}

export interface OutlineListProps extends Omit<
  TreeRootProps,
  "items" | "expanded" | "onExpandedChange" | "selected" | "onSelectedChange" | "onActivate"
> {
  /** Shown when there is no heading. Default: the `empty` of the outline. */
  empty?: ReactNode;
}

/** The tree of headings, or the empty note. Its children replace the default `OutlineItems`. */
export function OutlineList({ empty, className, children, ...rest }: OutlineListProps) {
  const ctx = useOutline();
  if (ctx.tree.length === 0) {
    return (
      <p data-slot="outline-empty" className="fg-outline-empty">
        {empty ?? ctx.empty}
      </p>
    );
  }
  return (
    <Tree
      data-slot="outline-list"
      aria-label={ctx.title}
      {...rest}
      className={cx("fg-outline-list", className)}
      expanded={ctx.expanded}
      onExpandedChange={(open) => {
        if (ctx.collapsible) ctx.setFolded(ctx.branches.filter((id) => !open.includes(id)));
      }}
      selected={ctx.current ? [ctx.current] : []}
      onSelectedChange={(ids) => {
        if (ids[0] && ids[0] !== ctx.current) ctx.reach(ids[0]);
      }}
      onActivate={ctx.reach}
    >
      {children ?? <OutlineItems />}
    </Tree>
  );
}

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
  children,
  className,
  ...rest
}: OutlineProps & Omit<ComponentProps<"nav">, keyof OutlineProps | "ref">) {
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

  const ctx: OutlineContext = {
    tree,
    current,
    folded,
    setFolded,
    branches,
    expanded,
    collapsible,
    foldable,
    shown,
    setShown,
    panel,
    title,
    empty,
    reach,
    go,
  };

  return (
    <Ctx.Provider value={ctx}>
      <nav aria-label={title} data-slot="outline" {...rest} className={cx("fg-outline", className)}>
        {children ?? (
          <>
            <OutlineTitle />
            <OutlineContent>
              <OutlineList />
            </OutlineContent>
          </>
        )}
      </nav>
    </Ctx.Provider>
  );
}
