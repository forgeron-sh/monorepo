// The folders of a drive as a tree: the WAI-ARIA tree pattern (arrows, Home, End, typeahead,
// Enter), children loaded on first opening, and folders that take a drop of files or of items
// dragged from a FileBrowser. The same tree picks a destination in the MoveDialog.

import type { IconDefinition } from "@forgeron/icons";
import { ArrowRight01Icon, Folder01Icon, LockIcon } from "@forgeron/icons";
import { useRef, useState, type DragEvent, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "../cx";
import { Spinner } from "../feedback";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { isDriveDrag, readDriveDrop, type DriveDrop } from "./drive-parts";

export interface FolderNode {
  id: string;
  name: string;
  /** In place of the folder: a home, a team drive. */
  icon?: IconDefinition;
  /**
   * The subfolders. Absent with `hasChildren`: not loaded yet, `onLoadChildren` is called on the
   * first opening.
   */
  children?: ReadonlyArray<FolderNode>;
  /** Has subfolders that are not loaded yet. */
  hasChildren?: boolean;
  /** Shows a lock and refuses drops: an app's folder. */
  readOnly?: boolean;
}

export interface FolderTreeProps {
  folders: ReadonlyArray<FolderNode>;
  /** The open folders. */
  expanded?: ReadonlyArray<string>;
  defaultExpanded?: ReadonlyArray<string>;
  onExpandedChange?: (ids: string[]) => void;
  /** The current folder: the page shown, or the destination picked. */
  selected?: string | null;
  defaultSelected?: string | null;
  onSelectedChange?: (id: string) => void;
  /** Enter or a double click: go to the folder, or confirm a pick. */
  onOpen?: (id: string) => void;
  /** Called the first time a folder with `hasChildren` and no `children` opens; a promise shows the wait. */
  onLoadChildren?: (id: string) => void | Promise<unknown>;
  /** Folders that can be seen but not picked nor dropped on: the items being moved. */
  disabledIds?: ReadonlyArray<string>;
  /** A drop on a folder: items dragged from a list, files from the computer. */
  onDrop?: (folderId: string, drop: DriveDrop) => void;
  /** Whether a folder takes the items dragged; every folder that is not read-only by default. */
  canDrop?: (folderId: string) => boolean;
  /** Names the tree for assistive technology. */
  label?: string;
  className?: string;
}

interface Visible {
  node: FolderNode;
  level: number;
  parent: string | null;
}

const isLoaded = (n: FolderNode) => n.children !== undefined;
const isBranch = (n: FolderNode) => (n.children ? n.children.length > 0 : !!n.hasChildren);

/** The folders shown, in order, with their depth: the closed ones' children are left out. */
function flatten(
  nodes: ReadonlyArray<FolderNode>,
  open: ReadonlySet<string>,
  level = 1,
  parent: string | null = null,
  out: Visible[] = [],
): Visible[] {
  for (const node of nodes) {
    out.push({ node, level, parent });
    if (open.has(node.id) && node.children) flatten(node.children, open, level + 1, node.id, out);
  }
  return out;
}

/** The ids of the folders on the way to `id`, outermost first, `id` excluded; null when absent. */
export function folderPath(nodes: ReadonlyArray<FolderNode>, id: string): string[] | null {
  for (const node of nodes) {
    if (node.id === id) return [];
    if (node.children) {
      const sub = folderPath(node.children, id);
      if (sub) return [node.id, ...sub];
    }
  }
  return null;
}

/** A folder by id, anywhere in the tree. */
export function findFolder(nodes: ReadonlyArray<FolderNode>, id: string): FolderNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const sub = node.children ? findFolder(node.children, id) : null;
    if (sub) return sub;
  }
  return null;
}

/** The folders of a drive as a tree you drive from the keyboard, and drop files on. */
export function FolderTree({
  folders,
  expanded,
  defaultExpanded = [],
  onExpandedChange,
  selected,
  defaultSelected = null,
  onSelectedChange,
  onOpen,
  onLoadChildren,
  disabledIds = [],
  onDrop,
  canDrop,
  label = "Folders",
  className,
}: FolderTreeProps) {
  const [openIds, setOpenIds] = useControllableState<ReadonlyArray<string>>({
    value: expanded,
    defaultValue: defaultExpanded,
    onChange: (ids) => onExpandedChange?.([...ids]),
  });
  const [current, select] = useControllableState<string | null>({
    value: selected,
    defaultValue: defaultSelected,
    onChange: (id) => {
      if (id !== null) onSelectedChange?.(id);
    },
  });
  const [focusId, setFocusId] = useState<string | null>(null);
  const [loading, setLoading] = useState<ReadonlySet<string>>(new Set());
  const [over, setOver] = useState<string | null>(null);
  const root = useRef<HTMLUListElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = new Set(openIds);
  const disabled = new Set(disabledIds);
  const visible = flatten(folders, open);
  const ids = visible.map((v) => v.node.id);
  const stop =
    (focusId && ids.includes(focusId) && focusId) ||
    (current && ids.includes(current) && current) ||
    ids[0];

  const focusItem = (id: string) => {
    setFocusId(id);
    const items = root.current?.querySelectorAll<HTMLElement>("[data-folder]") ?? [];
    Array.from(items)
      .find((el) => el.dataset.folder === id)
      ?.focus();
  };

  const setOpen = (node: FolderNode, next: boolean) => {
    if (next === open.has(node.id)) return;
    setOpenIds(next ? [...open, node.id] : [...open].filter((x) => x !== node.id));
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

  const choose = (id: string) => {
    if (!disabled.has(id)) select(id);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const el = (event.target as HTMLElement).closest<HTMLElement>("[data-folder]");
    if (!el) return;
    const at = ids.indexOf(el.dataset.folder!);
    const item = visible[at];
    if (!item) return;
    const { node } = item;
    const move = (to: number) => {
      const next = ids[Math.min(Math.max(to, 0), ids.length - 1)];
      if (next) focusItem(next);
    };
    switch (event.key) {
      case "ArrowDown":
        move(at + 1);
        break;
      case "ArrowUp":
        move(at - 1);
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
        else if (visible[at + 1]?.parent === node.id) move(at + 1);
        break;
      case "ArrowLeft":
        if (isBranch(node) && open.has(node.id)) setOpen(node, false);
        else if (item.parent) focusItem(item.parent);
        break;
      case "Enter":
        choose(node.id);
        if (!disabled.has(node.id)) onOpen?.(node.id);
        break;
      case " ":
        choose(node.id);
        break;
      case "*":
        // Opens every sibling of the folder, as in a file manager.
        setOpenIds([
          ...open,
          ...visible
            .filter((v) => v.parent === item.parent && isBranch(v.node))
            .map((v) => v.node.id),
        ]);
        break;
      default: {
        if (event.key.length !== 1 || event.metaKey || event.ctrlKey || event.altKey) return;
        // Typeahead: the next folder whose name starts with the letter.
        const ch = event.key.toLowerCase();
        const order = [...visible.slice(at + 1), ...visible.slice(0, at + 1)];
        const hit = order.find((v) => v.node.name.toLowerCase().startsWith(ch));
        if (hit) focusItem(hit.node.id);
        else return;
      }
    }
    event.preventDefault();
    event.stopPropagation();
  };

  const dropAllowed = (node: FolderNode) =>
    !!onDrop && !node.readOnly && !disabled.has(node.id) && (canDrop ? canDrop(node.id) : true);

  const clearHover = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
  };

  const dragProps = (node: FolderNode) =>
    onDrop
      ? {
          onDragOver: (e: DragEvent) => {
            if (!isDriveDrag(e.dataTransfer) || !dropAllowed(node)) return;
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = Array.from(e.dataTransfer.types).includes("Files")
              ? "copy"
              : "move";
            if (over !== node.id) {
              setOver(node.id);
              clearHover();
              // A closed folder opens after a moment under the pointer, to drop deeper.
              if (isBranch(node) && !open.has(node.id))
                hoverTimer.current = setTimeout(() => setOpen(node, true), 700);
            }
          },
          onDragLeave: (e: DragEvent) => {
            if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
            if (over === node.id) setOver(null);
            clearHover();
          },
          onDrop: (e: DragEvent) => {
            if (!dropAllowed(node)) return;
            e.preventDefault();
            e.stopPropagation();
            clearHover();
            setOver(null);
            onDrop(node.id, readDriveDrop(e.dataTransfer));
          },
        }
      : {};

  const renderLevel = (nodes: ReadonlyArray<FolderNode>, level: number): ReactNode =>
    nodes.map((node, i) => {
      const branch = isBranch(node);
      const isOpen = branch && open.has(node.id);
      const off = disabled.has(node.id);
      const waiting = isOpen && (loading.has(node.id) || !isLoaded(node));
      return (
        <li
          key={node.id}
          role="treeitem"
          data-folder={node.id}
          aria-level={level}
          aria-setsize={nodes.length}
          aria-posinset={i + 1}
          aria-selected={current === node.id}
          {...(branch ? { "aria-expanded": isOpen } : {})}
          {...(off ? { "aria-disabled": true } : {})}
          tabIndex={node.id === stop ? 0 : -1}
          className="fg-ftree-item"
          onFocus={(e) => {
            if (e.target === e.currentTarget) setFocusId(node.id);
          }}
        >
          <div
            className={cx(
              "fg-ftree-row",
              current === node.id && "fg-ftree-current",
              off && "fg-ftree-off",
              over === node.id && "fg-ftree-over",
            )}
            style={{ paddingLeft: `calc(${level - 1} * var(--fg-ftree-indent, 16px) + 4px)` }}
            onClick={() => {
              focusItem(node.id);
              choose(node.id);
            }}
            onDoubleClick={() => {
              if (!off) onOpen?.(node.id);
            }}
            {...dragProps(node)}
          >
            <span
              className={cx("fg-ftree-twisty", isOpen && "fg-ftree-twisty-open")}
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
              icon={node.icon ?? Folder01Icon}
              size={12}
              variant="mono"
              className="fg-ftree-icon"
            />
            <span className="fg-ftree-name">{node.name}</span>
            {node.readOnly ? (
              <Icon
                icon={LockIcon}
                size={12}
                variant="mono"
                className="fg-ftree-lock"
                title="Read-only"
              />
            ) : null}
          </div>
          {isOpen ? (
            waiting ? (
              <div
                className="fg-ftree-loading"
                style={{ paddingLeft: `calc(${level} * var(--fg-ftree-indent, 16px) + 24px)` }}
              >
                <Spinner label="Loading" />
              </div>
            ) : (
              <ul role="group" className="fg-ftree-group">
                {renderLevel(node.children ?? [], level + 1)}
              </ul>
            )
          ) : null}
        </li>
      );
    });

  return (
    <ul
      ref={root}
      role="tree"
      aria-label={label}
      className={cx("fg-ftree", className)}
      onKeyDown={onKeyDown}
    >
      {renderLevel(folders, 1)}
    </ul>
  );
}
