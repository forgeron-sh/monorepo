// A generic tree: the WAI-ARIA tree pattern for any kind of node (pages, folders, teams, fields).
// Arrows, Home, End and typeahead, one or several selected, children loaded on first opening,
// a drag that reorders or reparents with a drop line (and Alt + arrows for the keyboard), a name
// edited in place (F2), a right-click menu, counts, and a search that keeps what matches.

import type { IconDefinition } from "@forgeron/icons";
import { ArrowRight01Icon, File01Icon, Folder01Icon, LockIcon } from "@forgeron/icons";
import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { cx } from "../cx";
import { Spinner } from "../feedback";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { ContextMenu, type ActionMenuEntry } from "./navigation-action-menu";
import {
  structureIds,
  structureDropPlacement,
  structureDropZone,
  structureFilter,
  structureFind,
  structureFlatten,
  structureHighlight,
  structureMove,
  structurePath,
  structureShift,
  structureToggle,
  type StructureDropZone,
  type StructureShift,
} from "./structure-model";

export interface TreeNode<D = unknown> {
  id: string;
  label: string;
  /** In place of the default: a folder for a node with children, a page for the others. */
  icon?: IconDefinition;
  /** A figure at the end of the row: pages inside, people in a team. */
  count?: number;
  /** Anything at the end of the row, after the count. */
  badge?: ReactNode;
  /**
   * The children. Absent with `hasChildren`: not loaded yet, `onLoadChildren` is called on the
   * first opening.
   */
  children?: ReadonlyArray<TreeNode<D>> | undefined;
  hasChildren?: boolean;
  /** Seen but neither picked nor dropped on. */
  disabled?: boolean;
  /** Shows a lock: no drag, no rename, nothing dropped inside. */
  readOnly?: boolean;
  /** Yours: the record behind the row, handed back to `renderItem`. */
  data?: D;
}

export interface TreeRowState {
  level: number;
  expanded: boolean;
  selected: boolean;
  /** Under the keyboard focus. */
  focused: boolean;
  /** The query, when a search is on. */
  query: string;
}

export interface TreeMove<D = unknown> {
  /** What was moved, in tree order. */
  ids: string[];
  /** Where it landed: under this node (null: the top level), at this place among its children. */
  parentId: string | null;
  index: number;
  /** The whole tree after the move: keep it as your state. */
  items: TreeNode<D>[];
}

export interface TreeProps<D = unknown> {
  items: ReadonlyArray<TreeNode<D>>;
  /** The open nodes. */
  expanded?: ReadonlyArray<string>;
  defaultExpanded?: ReadonlyArray<string>;
  onExpandedChange?: (ids: string[]) => void;
  /** The selected nodes. */
  selected?: ReadonlyArray<string>;
  defaultSelected?: ReadonlyArray<string>;
  onSelectedChange?: (ids: string[]) => void;
  /** `single` (default), `multiple` (⌘ click, ⇧ click, Space) or `none`: focus only. */
  selectionMode?: "single" | "multiple" | "none";
  /** Enter or a double click. */
  onActivate?: (id: string) => void;
  /** Called the first time a node with `hasChildren` and no `children` opens; a promise shows the wait. */
  onLoadChildren?: (id: string) => void | Promise<unknown>;
  /** What a row shows in place of its label. The icon, the count and the rename stay. */
  renderItem?: (node: TreeNode<D>, state: TreeRowState) => ReactNode;
  /**
   * A drag, or Alt + arrows, moved nodes. Giving it turns both on; the tree does not change
   * itself: keep `items` from the move.
   */
  onMove?: (move: TreeMove<D>) => void;
  /** Whether a drop is allowed; every drop that does not put a node inside itself by default. */
  canDrop?: (ids: string[], targetId: string, zone: StructureDropZone) => boolean;
  /** A new name, from F2 or from `renaming`. Giving it turns the rename on. */
  onRename?: (id: string, label: string) => void;
  /** The node being renamed, when you start the rename from a menu. */
  renaming?: string | null;
  onRenamingChange?: (id: string | null) => void;
  /** The actions of the selection, behind a right click. Give `useActions(…).menu`. */
  menu?: (ids: string[]) => ActionMenuEntry[];
  onAction?: (actionId: string, ids: string[]) => void;
  /** Keeps the nodes whose label holds this text, marks it, and opens the way to them. */
  filter?: string;
  /** Shown when nothing is left. */
  empty?: ReactNode;
  /** Names the tree for assistive technology. */
  label?: string;
  className?: string;
}

const DRAG_TYPE = "application/x-forgeron-tree";

interface Branchy {
  children?: ReadonlyArray<unknown> | undefined;
  hasChildren?: boolean | undefined;
}
const isLoaded = (n: Branchy) => n.children !== undefined;
const isBranch = (n: Branchy) => (n.children ? n.children.length > 0 : !!n.hasChildren);

/** Names the one the tree moved, for the live region. */
const placeText = (label: string, parent: string | null, index: number, size: number) =>
  `${label} moved ${parent ? `into ${parent}` : "to the top level"}, position ${index + 1} of ${size}`;

/** The tree for any node: pages, folders, teams, fields. */
export function Tree<D = unknown>({
  items,
  expanded,
  defaultExpanded = [],
  onExpandedChange,
  selected,
  defaultSelected = [],
  onSelectedChange,
  selectionMode = "single",
  onActivate,
  onLoadChildren,
  renderItem,
  onMove,
  canDrop,
  onRename,
  renaming,
  onRenamingChange,
  menu,
  onAction,
  filter = "",
  empty,
  label = "Tree",
  className,
}: TreeProps<D>) {
  type N = TreeNode<D>;
  const [openIds, setOpenIds] = useControllableState<ReadonlyArray<string>>({
    value: expanded,
    defaultValue: defaultExpanded,
    onChange: (ids) => onExpandedChange?.([...ids]),
  });
  const [picked, setPicked] = useControllableState<ReadonlyArray<string>>({
    value: selected,
    defaultValue: defaultSelected,
    onChange: (ids) => onSelectedChange?.([...ids]),
  });
  const [editing, setEditing] = useControllableState<string | null>({
    value: renaming,
    defaultValue: null,
    onChange: (id) => onRenamingChange?.(id),
  });
  const [focusId, setFocusId] = useState<string | null>(null);
  const [loading, setLoading] = useState<ReadonlySet<string>>(new Set());
  const [dragIds, setDragIds] = useState<string[] | null>(null);
  const [over, setOver] = useState<{ id: string; zone: StructureDropZone } | null>(null);
  const [said, setSaid] = useState("");
  const root = useRef<HTMLUListElement>(null);
  const anchor = useRef<string | null>(null);
  const hover = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelled = useRef(false);

  const found = structureFilter(items, filter, (n) => n.label);
  const open = new Set([...openIds, ...(found?.open ?? [])]);
  const rows = structureFlatten(items, open, found?.visible ?? null);
  const ids = rows.map((r) => r.node.id);
  const pickedSet = new Set(picked);
  const stop =
    (focusId && ids.includes(focusId) && focusId) || ids.find((id) => pickedSet.has(id)) || ids[0];
  const selectable = selectionMode !== "none";
  const moving = !!onMove;

  useEffect(() => () => void (hover.current && clearTimeout(hover.current)), []);

  const focusItem = (id: string) => {
    setFocusId(id);
    const els = root.current?.querySelectorAll<HTMLElement>("[data-tree-id]") ?? [];
    Array.from(els)
      .find((el) => el.dataset.treeId === id)
      ?.focus();
  };

  const setOpen = (node: N, next: boolean) => {
    if (next === open.has(node.id)) return;
    setOpenIds(structureToggle(openIds, node.id, next));
    if (next && !isLoaded(node) && node.hasChildren && onLoadChildren && !loading.has(node.id)) {
      const wait = onLoadChildren(node.id);
      if (wait && typeof (wait as Promise<unknown>).then === "function") {
        setLoading((s) => new Set(s).add(node.id));
        const done = () =>
          setLoading((s) => {
            const n = new Set(s);
            n.delete(node.id);
            return n;
          });
        (wait as Promise<unknown>).then(done, done);
      }
    }
  };

  const choose = (id: string, how: { mod?: boolean; range?: boolean } = {}) => {
    const node = structureFind(items, id);
    if (!selectable || !node || node.disabled) return;
    if (selectionMode === "multiple" && how.range && anchor.current) {
      const a = ids.indexOf(anchor.current);
      const b = ids.indexOf(id);
      if (a !== -1 && b !== -1) {
        const [from, to] = a < b ? [a, b] : [b, a];
        setPicked(ids.slice(from, to + 1).filter((x) => !structureFind(items, x)?.disabled));
        return;
      }
    }
    anchor.current = id;
    if (selectionMode === "multiple" && how.mod) setPicked(structureToggle(picked, id));
    else setPicked([id]);
  };

  /** Which nodes a drag of `id` carries: the selection, when the node is part of it. */
  const carried = (id: string) => {
    const base = pickedSet.has(id) && selectionMode === "multiple" ? [...picked] : [id];
    const set = new Set(base);
    // A node already inside another moved node goes with it.
    const top = base.filter((x) => !(structurePath(items, x) ?? []).some((p) => set.has(p)));
    return structureIds(items).filter((x) => top.includes(x));
  };

  const commitMove = (moveIds: string[], parentId: string | null, index: number) => {
    const next = structureMove(items, moveIds, { parentId, index });
    if (!next || !onMove) return false;
    const list = (parentId ? structureFind(next, parentId)?.children : next) ?? [];
    const at = list.findIndex((n) => n.id === moveIds[0]);
    onMove({ ids: moveIds, parentId, index: at, items: next as N[] });
    const parent = parentId ? structureFind(next, parentId) : null;
    if (parent) setOpenIds(structureToggle(openIds, parent.id, true));
    const first = structureFind(next, moveIds[0]!);
    setSaid(placeText(first?.label ?? "", parent?.label ?? null, at, list.length));
    return true;
  };

  const startRename = (id: string) => {
    const node = structureFind(items, id);
    if (!onRename || !node || node.readOnly || node.disabled) return false;
    cancelled.current = false;
    setEditing(id);
    return true;
  };

  const endRename = (node: N, value: string | null) => {
    setEditing(null);
    const next = value?.trim();
    if (next && next !== node.label) onRename?.(node.id, next);
    requestAnimationFrame(() => focusItem(node.id));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    if ((event.target as HTMLElement).tagName === "INPUT") return;
    const el = (event.target as HTMLElement).closest<HTMLElement>("[data-tree-id]");
    if (!el) return;
    const at = ids.indexOf(el.dataset.treeId!);
    const row = rows[at];
    if (!row) return;
    const { node } = row;
    const move = (to: number) => {
      const next = ids[Math.min(Math.max(to, 0), ids.length - 1)];
      if (next) focusItem(next);
    };

    if (event.altKey && moving && event.key.startsWith("Arrow")) {
      const dirs: Record<string, StructureShift> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowRight: "in",
        ArrowLeft: "out",
      };
      const dir = dirs[event.key] ?? null;
      event.preventDefault();
      event.stopPropagation();
      if (dir && !node.readOnly && !node.disabled) {
        const shift = structureShift(items, node.id, dir);
        if (shift) {
          const parent = shift.parentId ? structureFind(shift.items, shift.parentId) : null;
          onMove({
            ids: [node.id],
            parentId: shift.parentId,
            index: shift.index,
            items: shift.items as N[],
          });
          if (parent) setOpenIds(structureToggle(openIds, parent.id, true));
          const size = (parent ? parent.children : shift.items)?.length ?? 0;
          setSaid(placeText(node.label, parent?.label ?? null, shift.index, size));
          requestAnimationFrame(() => focusItem(node.id));
        }
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        if (event.shiftKey && selectionMode === "multiple") {
          const next = ids[at + 1];
          if (next) {
            if (!anchor.current) anchor.current = node.id;
            choose(next, { range: true });
            focusItem(next);
          }
        } else move(at + 1);
        break;
      case "ArrowUp":
        if (event.shiftKey && selectionMode === "multiple") {
          const next = ids[at - 1];
          if (next) {
            if (!anchor.current) anchor.current = node.id;
            choose(next, { range: true });
            focusItem(next);
          }
        } else move(at - 1);
        break;
      case "Home":
        move(0);
        break;
      case "End":
        move(ids.length - 1);
        break;
      case "ArrowRight":
        if (!isBranch(node)) break;
        if (!open.has(node.id)) setOpen(node, true);
        else if (rows[at + 1]?.parent === node.id) move(at + 1);
        break;
      case "ArrowLeft":
        if (isBranch(node) && open.has(node.id)) setOpen(node, false);
        else if (row.parent) focusItem(row.parent);
        break;
      case "Enter":
        if (node.disabled) break;
        choose(node.id);
        onActivate?.(node.id);
        break;
      case " ":
        choose(node.id, { mod: true });
        break;
      case "F2":
        if (!startRename(node.id)) return;
        break;
      case "*":
        setOpenIds([
          ...new Set([
            ...openIds,
            ...rows
              .filter((r) => r.parent === row.parent && isBranch(r.node))
              .map((r) => r.node.id),
          ]),
        ]);
        break;
      case "a":
      case "A":
        if (!(event.metaKey || event.ctrlKey) || selectionMode !== "multiple") return;
        setPicked(ids.filter((x) => !structureFind(items, x)?.disabled));
        break;
      default: {
        if (event.key.length !== 1 || event.metaKey || event.ctrlKey || event.altKey) return;
        const ch = event.key.toLowerCase();
        const order = [...rows.slice(at + 1), ...rows.slice(0, at + 1)];
        const hit = order.find((r) => r.node.label.toLowerCase().startsWith(ch));
        if (hit) focusItem(hit.node.id);
        else return;
      }
    }
    event.preventDefault();
    event.stopPropagation();
  };

  const clearHover = () => {
    if (hover.current) clearTimeout(hover.current);
    hover.current = null;
  };

  const dragProps = (node: N) => {
    if (!moving) return {};
    const fixed = !!node.readOnly || !!node.disabled || editing === node.id;
    return {
      draggable: !fixed,
      onDragStart: (e: DragEvent) => {
        if (fixed) return e.preventDefault();
        e.dataTransfer.setData(DRAG_TYPE, node.id);
        e.dataTransfer.effectAllowed = "move";
        setDragIds(carried(node.id));
      },
      onDragEnd: () => {
        setDragIds(null);
        setOver(null);
        clearHover();
      },
      onDragOver: (e: DragEvent<HTMLElement>) => {
        if (!dragIds) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const zone = structureDropZone(
          e.clientY - rect.top,
          rect.height,
          !node.readOnly && !node.disabled,
        );
        const place = structureDropPlacement(items, node.id, zone);
        const ok =
          !!place &&
          !dragIds.includes(node.id) &&
          !!structureMove(items, dragIds, place) &&
          (!canDrop || canDrop(dragIds, node.id, zone));
        if (!ok) {
          if (over) setOver(null);
          clearHover();
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "move";
        if (over?.id !== node.id || over.zone !== zone) {
          setOver({ id: node.id, zone });
          clearHover();
          // A closed branch opens after a moment under the pointer, to drop deeper.
          if (zone === "inside" && isBranch(node) && !open.has(node.id))
            hover.current = setTimeout(() => setOpen(node, true), 700);
        }
      },
      onDragLeave: (e: DragEvent) => {
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
        if (over?.id === node.id) setOver(null);
        clearHover();
      },
      onDrop: (e: DragEvent<HTMLElement>) => {
        if (!dragIds || !over || over.id !== node.id) return;
        e.preventDefault();
        e.stopPropagation();
        clearHover();
        const place = structureDropPlacement(items, node.id, over.zone);
        const moved = dragIds;
        setOver(null);
        setDragIds(null);
        if (place) commitMove(moved, place.parentId, place.index);
      },
    };
  };

  const onContextMenu = (event: MouseEvent) => {
    const el = (event.target as HTMLElement).closest<HTMLElement>("[data-tree-row]");
    if (!el) return;
    const id = el.dataset.treeRow!;
    if (!pickedSet.has(id)) choose(id);
    setFocusId(id);
  };

  const rowContent = (node: N, state: TreeRowState) => {
    if (editing === node.id) {
      return (
        <input
          className="fg-tree-rename"
          aria-label={`Rename ${node.label}`}
          defaultValue={node.label}
          autoFocus
          onFocus={(e) => e.currentTarget.select()}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              endRename(node, e.currentTarget.value);
            } else if (e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
              cancelled.current = true;
              endRename(node, null);
            }
          }}
          onBlur={(e) => {
            if (!cancelled.current) endRename(node, e.currentTarget.value);
            cancelled.current = false;
          }}
        />
      );
    }
    if (renderItem) return renderItem(node, state);
    return (
      <span className="fg-tree-name">
        {structureHighlight(node.label, filter).map((s, i) =>
          s.match ? (
            <mark key={i} className="fg-tree-mark">
              {s.text}
            </mark>
          ) : (
            <Fragment key={i}>{s.text}</Fragment>
          ),
        )}
      </span>
    );
  };

  const renderLevel = (nodes: ReadonlyArray<N>, level: number): ReactNode => {
    const shown = found ? nodes.filter((n) => found.visible.has(n.id)) : nodes;
    return shown.map((node, i) => {
      const branch = isBranch(node);
      const isOpen = branch && open.has(node.id);
      const on = pickedSet.has(node.id);
      const waiting = isOpen && (loading.has(node.id) || !isLoaded(node));
      const zone = over?.id === node.id ? over.zone : null;
      const state: TreeRowState = {
        level,
        expanded: isOpen,
        selected: on,
        focused: focusId === node.id,
        query: filter,
      };
      return (
        <li
          key={node.id}
          role="treeitem"
          data-tree-id={node.id}
          aria-level={level}
          aria-setsize={shown.length}
          aria-posinset={i + 1}
          {...(selectable ? { "aria-selected": on } : {})}
          {...(branch ? { "aria-expanded": isOpen } : {})}
          {...(node.disabled ? { "aria-disabled": true } : {})}
          tabIndex={node.id === stop ? 0 : -1}
          className="fg-tree-item"
          onFocus={(e) => {
            if (e.target === e.currentTarget) setFocusId(node.id);
          }}
        >
          <div
            data-tree-row={node.id}
            className={cx(
              "fg-tree-row",
              on && "fg-tree-current",
              node.disabled && "fg-tree-off",
              dragIds?.includes(node.id) && "fg-tree-dragging",
              zone && `fg-tree-drop-${zone}`,
            )}
            style={{ paddingLeft: `calc(${level - 1} * var(--fg-tree-indent, 16px) + 4px)` }}
            onClick={(e) => {
              if (editing === node.id) return;
              focusItem(node.id);
              choose(node.id, { mod: e.metaKey || e.ctrlKey, range: e.shiftKey });
            }}
            onDoubleClick={() => {
              if (!node.disabled && editing !== node.id) onActivate?.(node.id);
            }}
            {...dragProps(node)}
          >
            <span
              className={cx("fg-tree-twisty", isOpen && "fg-tree-twisty-open")}
              aria-hidden="true"
              onClick={(e) => {
                if (!branch) return;
                e.stopPropagation();
                setOpen(node, !isOpen);
                focusItem(node.id);
              }}
            >
              {branch ? <Icon icon={ArrowRight01Icon} size={12} variant="mono" /> : null}
            </span>
            <Icon
              icon={node.icon ?? (branch ? Folder01Icon : File01Icon)}
              size={12}
              variant="mono"
              className="fg-tree-icon"
            />
            {rowContent(node, state)}
            {node.readOnly ? (
              <Icon
                icon={LockIcon}
                size={12}
                variant="mono"
                className="fg-tree-lock"
                title="Read-only"
              />
            ) : null}
            {node.count !== undefined ? <span className="fg-tree-count">{node.count}</span> : null}
            {node.badge ? <span className="fg-tree-badge">{node.badge}</span> : null}
          </div>
          {isOpen ? (
            waiting ? (
              <div
                className="fg-tree-loading"
                style={{ paddingLeft: `calc(${level} * var(--fg-tree-indent, 16px) + 24px)` }}
              >
                <Spinner label="Loading" />
              </div>
            ) : (
              <ul role="group" className="fg-tree-group">
                {renderLevel(node.children ?? [], level + 1)}
              </ul>
            )
          ) : null}
        </li>
      );
    });
  };

  const list = (
    <ul
      ref={root}
      role="tree"
      aria-label={label}
      {...(selectionMode === "multiple" ? { "aria-multiselectable": true } : {})}
      className={cx("fg-tree", className)}
      onKeyDown={onKeyDown}
      onContextMenu={menu ? onContextMenu : undefined}
    >
      {renderLevel(items, 1)}
    </ul>
  );

  const body = (
    <>
      {rows.length === 0 && empty ? <div className="fg-tree-empty">{empty}</div> : list}
      <span className="fg-visually-hidden" role="status" aria-live="polite">
        {said}
      </span>
    </>
  );

  if (!menu) return body;
  const target = [...picked];
  return (
    <ContextMenu
      items={menu(target)}
      onSelect={(actionId) => onAction?.(actionId, target)}
      label={target.length > 1 ? `Actions on ${target.length} items` : "Actions on the item"}
      areaClassName="fg-tree-area"
    >
      {body}
    </ContextMenu>
  );
}
