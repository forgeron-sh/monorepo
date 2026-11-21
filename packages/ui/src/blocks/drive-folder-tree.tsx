// The folders of a drive as a tree, on the Tree primitive (arrows, Home, End, typeahead, Enter):
// children loaded on first opening, and folders that take a drop of files or of items dragged
// from a FileBrowser. The same tree picks a destination in the MoveDialog.
//
// A root with parts. Without children, `FolderTree` draws a `FolderTreeItem` for each folder; with
// children they are yours (the root still takes `folders` for the drops and the loading):
//
//   <FolderTree folders={folders} onSelectedChange={go}>
//     {folders.map((f) => <FolderTreeItem key={f.id} node={f} />)}
//   </FolderTree>

import type { IconDefinition } from "@forgeron/icons";
import { Folder01Icon, LockIcon } from "@forgeron/icons";
import {
  createContext,
  useContext,
  useRef,
  useState,
  type ComponentProps,
  type DragEvent,
  type ReactNode,
} from "react";
import { cx } from "../cx";
import { Spinner } from "../feedback";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { Tree, TreeGroup, TreeItem, TreeItemContent } from "../tree";
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
  /** The items, composed from the parts; without them, one `FolderTreeItem` for each folder. */
  children?: ReactNode;
  className?: string;
}

const isLoaded = (n: FolderNode) => n.children !== undefined;
const isBranch = (n: FolderNode) => (n.children ? n.children.length > 0 : !!n.hasChildren);

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

interface FolderTreeContext {
  open: ReadonlySet<string>;
  disabled: ReadonlySet<string>;
  loading: ReadonlySet<string>;
  over: string | null;
  onOpen: ((id: string) => void) | undefined;
  dragProps: (node: FolderNode) => Record<string, unknown>;
}

const Ctx = createContext<FolderTreeContext | null>(null);

/** Which folders are open, loading or under a drop, for a part of your own. */
export function useFolderTree(part = "useFolderTree"): FolderTreeContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error(`<${part}> goes inside a <FolderTree>.`);
  return ctx;
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
  children,
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
  const [loading, setLoading] = useState<ReadonlySet<string>>(new Set());
  const [over, setOver] = useState<string | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = new Set(openIds);
  const disabled = new Set(disabledIds);

  const load = (node: FolderNode | null) => {
    if (!node || isLoaded(node) || !node.hasChildren || !onLoadChildren || loading.has(node.id))
      return;
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
  };

  // The tree says which folders are open now; the ones that just opened may need their children.
  const applyOpen = (ids: string[]) => {
    setOpenIds(ids);
    for (const id of ids) if (!open.has(id)) load(findFolder(folders, id));
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
                hoverTimer.current = setTimeout(() => applyOpen([...open, node.id]), 700);
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

  return (
    <Ctx.Provider value={{ open, disabled, loading, over, onOpen, dragProps }}>
      <Tree
        data-slot="folder-tree"
        aria-label={label}
        className={cx("fg-ftree", className)}
        expanded={openIds}
        onExpandedChange={applyOpen}
        selected={current ? [current] : []}
        onSelectedChange={(ids) => {
          if (ids[0] !== undefined) select(ids[0]);
        }}
        onActivate={(id) => onOpen?.(id)}
      >
        {children ?? folders.map((node) => <FolderTreeItem key={node.id} node={node} />)}
      </Tree>
    </Ctx.Provider>
  );
}

const LevelCtx = createContext(1);

export interface FolderTreeItemProps extends Omit<
  ComponentProps<typeof TreeItem>,
  "id" | "children"
> {
  /** The folder, with the subfolders it shows once open. */
  node: FolderNode;
}

/** One folder: its row (icon, name, lock) and, once open, its subfolders as `FolderTreeItem`s. */
export function FolderTreeItem({ node, className, ...rest }: FolderTreeItemProps) {
  const { open, disabled, loading, over, onOpen, dragProps } = useFolderTree("FolderTreeItem");
  const level = useContext(LevelCtx);
  const branch = isBranch(node);
  const isOpen = branch && open.has(node.id);
  const off = disabled.has(node.id);
  const waiting = isOpen && (loading.has(node.id) || !isLoaded(node));
  return (
    <TreeItem
      data-slot="folder-tree-item"
      id={node.id}
      textValue={node.name}
      disabled={off}
      hasChildren={branch}
      data-folder={node.id}
      {...rest}
      className={className}
    >
      <TreeItemContent
        className={cx("fg-ftree-row", over === node.id && "fg-ftree-over")}
        onDoubleClick={() => {
          if (!off) onOpen?.(node.id);
        }}
        {...dragProps(node)}
      >
        <Icon icon={node.icon ?? Folder01Icon} size={12} variant="mono" className="fg-tree-icon" />
        <span className="fg-tree-name">{node.name}</span>
        {node.readOnly ? (
          <Icon
            icon={LockIcon}
            size={12}
            variant="mono"
            className="fg-ftree-lock"
            title="Read-only"
          />
        ) : null}
      </TreeItemContent>
      {isOpen ? (
        waiting ? (
          <div
            className="fg-ftree-loading"
            style={{ paddingLeft: `calc(${level} * var(--fg-tree-indent, 16px) + 24px)` }}
          >
            <Spinner label="Loading" />
          </div>
        ) : (
          <LevelCtx.Provider value={level + 1}>
            <TreeGroup>
              {(node.children ?? []).map((child) => (
                <FolderTreeItem key={child.id} node={child} />
              ))}
            </TreeGroup>
          </LevelCtx.Provider>
        )
      ) : null}
    </TreeItem>
  );
}
