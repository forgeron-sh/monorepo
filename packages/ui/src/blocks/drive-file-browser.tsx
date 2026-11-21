// The files of a folder, as a dense list or a grid of cards: selection by click, ⇧ and ⌘ ranges,
// a lasso, the keyboard (arrows, ⇧ arrows, ⌘A, Escape, Enter, Space, F2, Delete); a right click or
// the ⋯ of a row opens the actions of the selection (ContextMenu, from `useActions(…).menu`);
// items drag onto folders, files from the computer drop on a folder or on the list.
//
// A root with parts. Without children, `FileBrowser` draws the layout it is given: the header and
// a `FileBrowserRow` for each item (list), or `FileBrowserTiles` and `FileBrowserCards` (grid), and
// `FileBrowserEmpty` when there is nothing. With children they are yours:
//
//   <FileBrowser items={items} selected={sel} onSelectedChange={setSel}>
//     <FileBrowserHeader />
//     {items.map((i) => <FileBrowserRow key={i.id} item={i} />)}
//   </FileBrowser>

import type { IconDefinition } from "@forgeron/icons";
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Folder01Icon,
  LockIcon,
  PlayFillIcon,
  StarFillIcon,
  UserGroupIcon,
} from "@forgeron/icons";
import {
  createContext,
  useContext,
  useRef,
  useState,
  type ComponentProps,
  type DragEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { Avatar } from "../avatar";
import { cx } from "../cx";
import { EmptyState } from "../feedback";
import { useCollection } from "../hooks/use-collection";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { isMenuKey, RowMore } from "./lists-editing";
import type { ActionMenuEntry } from "../action-menu";
import { ContextMenu } from "../context-menu";
import {
  DRIVE_DRAG_TYPE,
  FILE_KINDS,
  fileKindOf,
  FileTypeMark,
  formatBytes,
  formatWhen,
  isDriveDrag,
  readDriveDrop,
  type FileKind,
} from "./drive-parts";

export interface DriveItem {
  id: string;
  name: string;
  /** `folder` for a folder; absent, the kind comes from the name's extension. */
  kind?: FileKind;
  /** In bytes; folders usually leave it out. */
  size?: number;
  /** `YYYY-MM-DD HH:mm`, or a date alone. */
  modified?: string;
  /** The owner's name, or anything that stands for it ("me", an app). */
  owner?: string;
  starred?: boolean;
  /** Shared with someone: a mark after the name. */
  shared?: boolean;
  /** Read-only here: a lock, no drag, no drop, no rename. */
  locked?: boolean;
  /** A picture for the grid: an image's own preview. */
  thumbnail?: string;
  /** In place of the kind's icon: a team drive, an app. */
  icon?: IconDefinition;
}

export type FileColumn = "owner" | "modified" | "size";
export type FileSortKey = "name" | FileColumn;
export interface FileSort {
  key: FileSortKey;
  direction: "asc" | "desc";
}

export interface FileBrowserProps {
  items: ReadonlyArray<DriveItem>;
  /** `list` (default): dense rows with columns; `grid`: folders as tiles, files as cards. */
  layout?: "list" | "grid";
  /** The ids selected. */
  selected?: ReadonlyArray<string>;
  defaultSelected?: ReadonlyArray<string>;
  onSelectedChange?: (ids: string[]) => void;
  /** A double click or Enter: open a folder, preview a file. */
  onOpen?: (id: string) => void;
  /**
   * The actions of the items given (the selection, or the one item under the pointer); `[]` for a
   * right click on the empty space. Give `useActions(…).menu`, built for the selection.
   */
  menu?: (ids: string[]) => ReadonlyArray<ActionMenuEntry>;
  /** An entry of the menu chosen, with the ids it acts on. */
  onAction?: (actionId: string, ids: string[]) => void;
  /** Items dropped on a folder; leave out to turn dragging off. */
  onMove?: (ids: string[], folderId: string) => void;
  /** Whether a folder takes the items dragged; every folder that is not locked by default. */
  canDrop?: (folderId: string, ids: string[]) => boolean;
  /** Files dropped from the computer: on a folder (its id), or on the list (null: this folder). */
  onDropFiles?: (files: File[], folderId: string | null) => void;
  /** A name changed in place (F2, or `renaming` from a "Rename" action); leave out for none. */
  onRename?: (id: string, name: string) => void;
  /** The item whose name is being edited. */
  renaming?: string | null;
  onRenamingChange?: (id: string | null) => void;
  /** Delete or Backspace on the selection. */
  onDelete?: (ids: string[]) => void;
  /** The order; by name by default. Folders always come first. */
  sort?: FileSort | null;
  defaultSort?: FileSort;
  onSortChange?: (sort: FileSort) => void;
  /** Makes the headers buttons that sort; true by default. Turn off when the order means something (recent). */
  sortable?: boolean;
  /** The columns after the name, in the list. */
  columns?: ReadonlyArray<FileColumn>;
  /** Other headers: `{ owner: "Shared by" }`. */
  columnLabels?: Partial<Record<FileSortKey, string>>;
  /** `YYYY-MM-DD`: a date of today shows its time, a date of this year leaves out the year. */
  today?: string;
  /** Writes a `modified` value in place of the default. */
  formatDate?: (value: string) => string;
  /** Selects with a rectangle drawn from the empty space; true by default. */
  lasso?: boolean;
  /** Shown when there is no item. */
  empty?: ReactNode;
  /** Names the list for assistive technology. */
  label?: string;
  /** The parts of the browser; without them, the layout drawn from `items`. */
  children?: ReactNode;
  className?: string;
}

/** The kind of an item: its own, else from its name. */
export const driveItemKind = (item: DriveItem): FileKind => item.kind ?? fileKindOf(item.name);
const isFolder = (item: DriveItem) => driveItemKind(item) === "folder";

const COLUMN_LABELS: Record<FileSortKey, string> = {
  name: "Name",
  owner: "Owner",
  modified: "Modified",
  size: "Size",
};

/** The items in order: folders first, then by the key, names breaking ties. */
export function sortDriveItems(
  items: ReadonlyArray<DriveItem>,
  sort: FileSort | null,
): ReadonlyArray<DriveItem> {
  const byName = (a: DriveItem, b: DriveItem) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
  const key = sort?.key ?? "name";
  const dir = sort?.direction === "desc" ? -1 : 1;
  const value = (i: DriveItem) =>
    key === "size" ? (i.size ?? -1) : key === "modified" ? (i.modified ?? "") : (i.owner ?? "");
  return [...items].sort((a, b) => {
    const fa = isFolder(a);
    if (fa !== isFolder(b)) return fa ? -1 : 1;
    if (key === "name") return byName(a, b) * dir;
    const va = value(a);
    const vb = value(b);
    const c = typeof va === "number" ? va - (vb as number) : va.localeCompare(vb as string);
    return c !== 0 ? c * dir : byName(a, b);
  });
}

export { selectionAfterClick } from "../collection-model";

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const ROOT = "\u0000root";

interface BrowserContext {
  list: ReadonlyArray<DriveItem>;
  folders: ReadonlyArray<DriveItem>;
  files: ReadonlyArray<DriveItem>;
  layout: "list" | "grid";
  columns: ReadonlyArray<FileColumn>;
  header: (key: FileSortKey) => ReactNode;
  check: (item: DriveItem) => ReactNode;
  itemProps: (item: DriveItem) => HTMLAttributes<HTMLElement>;
  itemDrag: (item: DriveItem) => Record<string, unknown>;
  stateClass: (item: DriveItem) => string;
  mark: (item: DriveItem, size?: "sm" | "lg" | "xl") => ReactNode;
  nameOf: (item: DriveItem) => ReactNode;
  marks: (item: DriveItem) => ReactNode;
  more: (item: DriveItem) => ReactNode;
  cellOf: (item: DriveItem, col: FileColumn) => ReactNode;
  empty: ReactNode;
  onDropFiles: boolean;
  box: Box | null;
}

const BrowserCtx = createContext<BrowserContext | null>(null);

/** The items, the layout and the helpers of the enclosing `FileBrowser`, for a part of your own. */
export function useFileBrowser(part = "useFileBrowser"): BrowserContext {
  const ctx = useContext(BrowserCtx);
  if (!ctx) throw new Error(`<${part}> goes inside a <FileBrowser>.`);
  return ctx;
}

/** A folder's files, listed or in a grid, selected, dragged, opened and acted on. */
export function FileBrowser({
  items,
  layout = "list",
  selected,
  defaultSelected = [],
  onSelectedChange,
  onOpen,
  menu,
  onAction,
  onMove,
  canDrop,
  onDropFiles,
  onRename,
  renaming,
  onRenamingChange,
  onDelete,
  sort,
  defaultSort = { key: "name", direction: "asc" },
  onSortChange,
  sortable = true,
  columns = ["owner", "modified", "size"],
  columnLabels,
  today,
  formatDate,
  lasso = true,
  empty,
  label = "Files",
  children,
  className,
}: FileBrowserProps) {
  const [order, setOrder] = useControllableState<FileSort | null>({
    value: sort,
    defaultValue: defaultSort,
    onChange: (s) => {
      if (s) onSortChange?.(s);
    },
  });
  const [editing, setEditing] = useControllableState<string | null>({
    value: renaming,
    defaultValue: null,
    onChange: (id) => onRenamingChange?.(id),
  });
  const [over, setOver] = useState<string | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const dragged = useRef<string[]>([]);
  const drawing = useRef<{ x: number; y: number; base: string[]; moved: boolean } | null>(null);
  const body = useRef<HTMLDivElement>(null);

  const list = sortable ? sortDriveItems(items, order) : items;
  const collection = useCollection({
    items: list,
    getId: (i) => i.id,
    selectionMode: "multiple",
    ...(selected ? { selected } : {}),
    defaultSelected,
    ...(onSelectedChange ? { onSelectedChange } : {}),
    orientation: layout === "grid" ? "grid" : "vertical",
    ...(onOpen ? { onAction: onOpen } : {}),
    ignoreTarget: (t) => !!t.closest("input, textarea, [data-fb-stop]"),
  });
  const { selected: selection, selectedSet: selSet, setSelected: setSel } = collection;
  const labels = { ...COLUMN_LABELS, ...columnLabels };
  const when = (v: string | undefined) => (v && formatDate ? formatDate(v) : formatWhen(v, today));
  const target = (id: string) => (selSet.has(id) ? selection : [id]);

  const elements = () =>
    Array.from(body.current?.querySelectorAll<HTMLElement>("[data-fb-item]") ?? []);

  /* ------------------------------------------------------------ keyboard */

  // The arrows, Home and End, ⌘A, Escape, Enter and Space are the collection's; these are the
  // browser's own: the menu key, F2 and Delete.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("input, textarea, [data-fb-stop]")) return;
    const id = target.closest<HTMLElement>("[data-fb-item]")?.dataset.fbItem ?? null;
    const k = event.key;
    if (id && isMenuKey(event) && menu) {
      if (!selSet.has(id)) setSel([id]);
      setMenuFor(id);
    } else if (k === "F2" && id && onRename && !list.find((i) => i.id === id)?.locked) {
      setEditing(id);
    } else if ((k === "Delete" || k === "Backspace") && onDelete && selection.length > 0) {
      onDelete([...selection]);
    } else return;
    event.preventDefault();
  };

  /* ------------------------------------------------------------ pointer */

  const toggle = (id: string) => collection.toggle(id);

  const onContextMenu = (event: MouseEvent) => {
    const el = (event.target as HTMLElement).closest<HTMLElement>("[data-fb-item]");
    if (el) {
      const id = el.dataset.fbItem!;
      if (!selSet.has(id)) collection.select(id);
      collection.focus(id);
      return;
    }
    if (selection.length > 0) setSel([]);
    // Nothing to offer on the empty space: leave the browser's own menu.
    if (!menu || menu([]).length === 0) event.stopPropagation();
  };

  const local = (event: { clientX: number; clientY: number }) => {
    const r = body.current!.getBoundingClientRect();
    return {
      x: event.clientX - r.left + body.current!.scrollLeft,
      y: event.clientY - r.top + body.current!.scrollTop,
    };
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!lasso || event.button !== 0 || !body.current) return;
    const t = event.target as HTMLElement;
    if (t.closest("[data-fb-item], [data-fb-head], button, input, a")) return;
    const p = local(event);
    const keep = event.shiftKey || event.metaKey || event.ctrlKey;
    drawing.current = { ...p, base: keep ? [...selection] : [], moved: false };
    body.current.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const d = drawing.current;
    if (!d || !body.current) return;
    const p = local(event);
    if (!d.moved && Math.abs(p.x - d.x) + Math.abs(p.y - d.y) < 5) return;
    d.moved = true;
    const next = {
      x: Math.min(p.x, d.x),
      y: Math.min(p.y, d.y),
      w: Math.abs(p.x - d.x),
      h: Math.abs(p.y - d.y),
    };
    setBox(next);
    const r = body.current.getBoundingClientRect();
    const left = r.left - body.current.scrollLeft + next.x;
    const top = r.top - body.current.scrollTop + next.y;
    const hits = elements()
      .filter((el) => {
        const e = el.getBoundingClientRect();
        return e.left < left + next.w && e.right > left && e.top < top + next.h && e.bottom > top;
      })
      .map((el) => el.dataset.fbItem!);
    setSel([...d.base, ...hits.filter((h) => !d.base.includes(h))]);
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const d = drawing.current;
    if (!d) return;
    drawing.current = null;
    body.current?.releasePointerCapture?.(event.pointerId);
    setBox(null);
    // A click on the empty space clears the selection.
    if (!d.moved && d.base.length === 0 && selection.length > 0) setSel([]);
  };

  /* ------------------------------------------------------------ drag and drop */

  const allowed = (folder: DriveItem, event: DragEvent) => {
    if (folder.locked || !isFolder(folder) || !isDriveDrag(event.dataTransfer)) return false;
    const files = Array.from(event.dataTransfer.types).includes("Files");
    if (files) return !!onDropFiles;
    if (!onMove) return false;
    const moving = dragged.current;
    if (moving.includes(folder.id)) return false;
    return canDrop ? canDrop(folder.id, moving) : true;
  };

  const itemDrag = (item: DriveItem) => {
    const canDrag = !!onMove && !item.locked && editing !== item.id;
    const folder = isFolder(item);
    return {
      draggable: canDrag,
      ...(canDrag
        ? {
            onDragStart: (event: DragEvent) => {
              const moving = target(item.id);
              if (!selSet.has(item.id)) setSel([item.id]);
              dragged.current = moving;
              event.dataTransfer.effectAllowed = "copyMove";
              event.dataTransfer.setData(DRIVE_DRAG_TYPE, JSON.stringify(moving));
              event.dataTransfer.setData(
                "text/plain",
                list
                  .filter((i) => moving.includes(i.id))
                  .map((i) => i.name)
                  .join("\n"),
              );
            },
            onDragEnd: () => {
              dragged.current = [];
              setOver(null);
            },
          }
        : {}),
      ...(folder && (onMove || onDropFiles)
        ? {
            onDragOver: (event: DragEvent) => {
              if (!allowed(item, event)) return;
              event.preventDefault();
              event.stopPropagation();
              event.dataTransfer.dropEffect = Array.from(event.dataTransfer.types).includes("Files")
                ? "copy"
                : "move";
              if (over !== item.id) setOver(item.id);
            },
            onDragLeave: (event: DragEvent) => {
              if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
              if (over === item.id) setOver(null);
            },
            onDrop: (event: DragEvent) => {
              if (!allowed(item, event)) return;
              event.preventDefault();
              event.stopPropagation();
              setOver(null);
              const drop = readDriveDrop(event.dataTransfer);
              if (drop.files.length > 0) onDropFiles?.(drop.files, item.id);
              else {
                const moving = drop.ids.length > 0 ? drop.ids : dragged.current;
                if (moving.length > 0) onMove?.(moving, item.id);
              }
              dragged.current = [];
            },
          }
        : {}),
    };
  };

  const rootDrop = onDropFiles
    ? {
        onDragOver: (event: DragEvent) => {
          if (!Array.from(event.dataTransfer.types).includes("Files")) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
          if (over !== ROOT) setOver(ROOT);
        },
        onDragLeave: (event: DragEvent) => {
          if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
          setOver(null);
        },
        onDrop: (event: DragEvent) => {
          const files = Array.from(event.dataTransfer.files ?? []);
          if (files.length === 0) return;
          event.preventDefault();
          setOver(null);
          onDropFiles(files, null);
        },
      }
    : {};

  /* ------------------------------------------------------------ parts */

  const commit = (item: DriveItem, value: string) => {
    const name = value.trim();
    setEditing(null);
    if (name && name !== item.name) onRename?.(item.id, name);
    requestAnimationFrame(() => collection.focus(item.id));
  };

  const nameOf = (item: DriveItem) =>
    editing === item.id ? (
      <input
        className="fg-fbr-rename"
        defaultValue={item.name}
        aria-label={`Rename ${item.name}`}
        data-fb-stop=""
        ref={(el) => {
          if (!el || el.dataset.ready) return;
          el.dataset.ready = "1";
          el.focus();
          const dot = isFolder(item) ? -1 : item.name.lastIndexOf(".");
          el.setSelectionRange(0, dot > 0 ? dot : item.name.length);
        }}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") commit(item, e.currentTarget.value);
          if (e.key === "Escape") {
            setEditing(null);
            requestAnimationFrame(() => collection.focus(item.id));
          }
        }}
        onBlur={(e) => {
          if (editing === item.id) commit(item, e.currentTarget.value);
        }}
      />
    ) : (
      <span className="fg-fbr-name">{item.name}</span>
    );

  const marks = (item: DriveItem) => (
    <>
      {item.starred ? (
        <Icon
          icon={StarFillIcon}
          size={12}
          variant="mono"
          className="fg-fbr-star"
          title="Starred"
        />
      ) : null}
      {item.shared ? (
        <Icon
          icon={UserGroupIcon}
          size={12}
          variant="mono"
          className="fg-fbr-mark"
          title="Shared"
        />
      ) : null}
      {item.locked ? (
        <Icon icon={LockIcon} size={12} variant="mono" className="fg-fbr-mark" title="Read-only" />
      ) : null}
    </>
  );

  const more = (item: DriveItem) =>
    menu ? (
      <RowMore
        items={menu(target(item.id))}
        onSelect={(actionId) => onAction?.(actionId, target(item.id))}
        label={`Actions on ${item.name}`}
        open={menuFor === item.id}
        onOpenChange={(open) => {
          if (open && !selSet.has(item.id)) setSel([item.id]);
          setMenuFor(open ? item.id : null);
        }}
        className="fg-fbr-more"
      />
    ) : null;

  const itemProps = (item: DriveItem) =>
    collection.getItemProps(item.id, {
      role: "row",
      "data-fb-item": item.id,
    } as HTMLAttributes<HTMLElement>);

  const stateClass = (item: DriveItem) =>
    cx(
      selSet.has(item.id) && "fg-fbr-sel",
      over === item.id && "fg-fbr-over",
      collection.isFocused(item.id) && "fg-fbr-focus",
    );

  const mark = (item: DriveItem, size: "sm" | "lg" | "xl" = "sm") => (
    <FileTypeMark
      kind={driveItemKind(item)}
      size={size}
      {...(item.icon ? { icon: item.icon } : {})}
    />
  );

  const cellOf = (item: DriveItem, col: FileColumn) => {
    if (col === "owner")
      return item.owner ? (
        <span className="fg-fbr-owner">
          <Avatar name={item.owner} size={18} />
          <span>{item.owner}</span>
        </span>
      ) : (
        "—"
      );
    if (col === "modified") return <span className="fg-fbr-mono">{when(item.modified)}</span>;
    return (
      <span className="fg-fbr-mono">
        {isFolder(item) && item.size === undefined ? "—" : formatBytes(item.size)}
      </span>
    );
  };

  const header = (key: FileSortKey) => {
    const on = sortable && order?.key === key;
    const dir = on && order ? order.direction : null;
    return (
      <span
        key={key}
        role="columnheader"
        className={cx("fg-fbr-h", `fg-fbr-c-${key}`)}
        {...(sortable
          ? { "aria-sort": dir ? (dir === "asc" ? "ascending" : "descending") : "none" }
          : {})}
      >
        {sortable ? (
          <button
            type="button"
            className={cx("fg-fbr-sort", on && "fg-fbr-sort-on")}
            onClick={() =>
              setOrder({
                key,
                direction: on && order?.direction === "asc" ? "desc" : "asc",
              })
            }
          >
            {labels[key]}
            {dir ? (
              <Icon
                icon={dir === "asc" ? ArrowUp01Icon : ArrowDown01Icon}
                size={12}
                variant="mono"
              />
            ) : null}
          </button>
        ) : (
          labels[key]
        )}
      </span>
    );
  };

  const check = (item: DriveItem) => (
    <span role="gridcell" className="fg-fbr-check" data-fb-stop="">
      <span
        className="fg-fbr-box"
        aria-hidden="true"
        onClick={(e) => {
          e.stopPropagation();
          toggle(item.id);
        }}
      />
    </span>
  );

  const folders = list.filter(isFolder);
  const files = list.filter((i) => !isFolder(i));
  const ctx: BrowserContext = {
    list,
    folders,
    files,
    layout,
    columns,
    header,
    check,
    itemProps,
    itemDrag,
    stateClass,
    mark,
    nameOf,
    marks,
    more,
    cellOf,
    empty,
    onDropFiles: Boolean(onDropFiles),
    box,
  };

  const container = collection.getContainerProps();
  const content = (
    <div
      data-slot="file-browser"
      {...container}
      ref={(node: HTMLDivElement | null) => {
        body.current = node;
        container.ref(node);
      }}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        onKeyDown(event);
        if (!event.defaultPrevented) container.onKeyDown?.(event);
      }}
      {...(list.length > 0 ? { role: "grid", "aria-multiselectable": true } : { role: "region" })}
      aria-label={label}
      className={cx(
        "fg-fbr",
        layout === "grid" ? "fg-fbr-grid" : "fg-fbr-list",
        selection.length > 1 && "fg-fbr-multi",
        over === ROOT && "fg-fbr-over-root",
        className,
      )}
      style={
        layout === "list"
          ? {
              ["--fg-fbr-template" as string]: [
                "30px minmax(0, 1fr)",
                ...columns.map((c) => `var(--fg-fbr-${c}, 120px)`),
                "40px",
              ].join(" "),
            }
          : undefined
      }
      tabIndex={list.length === 0 ? 0 : -1}
      onContextMenu={onContextMenu}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      {...rootDrop}
    >
      {children ?? (
        <>
          {list.length === 0 ? (
            <FileBrowserEmpty />
          ) : layout === "grid" ? (
            <>
              <FileBrowserTiles />
              <FileBrowserCards />
            </>
          ) : (
            <>
              <FileBrowserHeader />
              {list.map((item) => (
                <FileBrowserRow key={item.id} item={item} />
              ))}
            </>
          )}
          <FileBrowserLasso />
        </>
      )}
    </div>
  );

  if (!menu) return <BrowserCtx.Provider value={ctx}>{content}</BrowserCtx.Provider>;
  return (
    <BrowserCtx.Provider value={ctx}>
      <ContextMenu
        items={menu(selection.length > 0 ? [...selection] : [])}
        onSelect={(actionId) => onAction?.(actionId, [...selection])}
        label={
          selection.length === 1 ? "Actions on the item" : `Actions on ${selection.length} items`
        }
        areaClassName="fg-fbr-area"
      >
        {content}
      </ContextMenu>
    </BrowserCtx.Provider>
  );
}

/* ---------------------------------------------------------------- parts */

/** The header row of the list: a box column, the name, the columns, the actions. */
export function FileBrowserHeader({ className, children, ...rest }: ComponentProps<"div">) {
  const { columns, header } = useFileBrowser("FileBrowserHeader");
  return (
    <div
      data-slot="file-browser-header"
      role="row"
      data-fb-head=""
      {...rest}
      className={cx("fg-fbr-row fg-fbr-head", className)}
    >
      {children ?? (
        <>
          <span role="columnheader" className="fg-fbr-check">
            <span className="fg-sr">Selected</span>
          </span>
          {header("name")}
          {columns.map(header)}
          <span role="columnheader" className="fg-fbr-actions">
            <span className="fg-sr">Actions</span>
          </span>
        </>
      )}
    </div>
  );
}

type ItemPart = Omit<ComponentProps<"div">, "children"> & {
  item: DriveItem;
  children?: ReactNode;
};

/** One item of the list: its box, name, columns and menu. */
export function FileBrowserRow({ item, className, children, ...rest }: ItemPart) {
  const { itemProps, itemDrag, stateClass, check, mark, nameOf, marks, columns, cellOf, more } =
    useFileBrowser("FileBrowserRow");
  return (
    <div
      data-slot="file-browser-row"
      {...itemProps(item)}
      {...itemDrag(item)}
      {...rest}
      className={cx("fg-fbr-row fg-fbr-item", stateClass(item), className)}
    >
      {children ?? (
        <>
          {check(item)}
          <span role="gridcell" className="fg-fbr-c-name">
            {mark(item)}
            {nameOf(item)}
            {marks(item)}
          </span>
          {columns.map((col) => (
            <span key={col} role="gridcell" className={`fg-fbr-c-${col}`}>
              {cellOf(item, col)}
            </span>
          ))}
          <span role="gridcell" className="fg-fbr-actions">
            {more(item)}
          </span>
        </>
      )}
    </div>
  );
}

/** The folders of the grid, as tiles under a "Folders" band; nothing without a folder. */
export function FileBrowserTiles({ className, children, ...rest }: ComponentProps<"div">) {
  const { folders } = useFileBrowser("FileBrowserTiles");
  if (folders.length === 0 && children === undefined) return null;
  return (
    <div
      data-slot="file-browser-tiles"
      role="rowgroup"
      aria-label="Folders"
      {...rest}
      className={cx("fg-fbr-section", className)}
    >
      <span className="fg-fbr-eyebrow" aria-hidden="true">
        Folders
      </span>
      <div className="fg-fbr-tiles">
        {children ?? folders.map((item) => <FileBrowserTile key={item.id} item={item} />)}
      </div>
    </div>
  );
}

/** One folder of the grid. */
export function FileBrowserTile({ item, className, children, ...rest }: ItemPart) {
  const { itemProps, itemDrag, stateClass, mark, nameOf, marks, more } =
    useFileBrowser("FileBrowserTile");
  return (
    <div
      data-slot="file-browser-tile"
      {...itemProps(item)}
      {...itemDrag(item)}
      {...rest}
      className={cx("fg-fbr-tile fg-fbr-item", stateClass(item), className)}
    >
      {children ?? (
        <>
          <span role="gridcell" className="fg-fbr-tile-main">
            {mark(item)}
            {nameOf(item)}
            {marks(item)}
          </span>
          <span role="gridcell" className="fg-fbr-actions">
            {more(item)}
          </span>
        </>
      )}
    </div>
  );
}

/** The files of the grid, as cards under a "Files" band; nothing without a file. */
export function FileBrowserCards({ className, children, ...rest }: ComponentProps<"div">) {
  const { files } = useFileBrowser("FileBrowserCards");
  if (files.length === 0 && children === undefined) return null;
  return (
    <div
      data-slot="file-browser-cards"
      role="rowgroup"
      aria-label="Files"
      {...rest}
      className={cx("fg-fbr-section", className)}
    >
      <span className="fg-fbr-eyebrow" aria-hidden="true">
        Files
      </span>
      <div className="fg-fbr-cards">
        {children ?? files.map((item) => <FileBrowserCard key={item.id} item={item} />)}
      </div>
    </div>
  );
}

/** One file of the grid: its picture, then its mark, name and menu. */
export function FileBrowserCard({ item, className, children, ...rest }: ItemPart) {
  const { itemProps, itemDrag, stateClass, mark, nameOf, marks, more } =
    useFileBrowser("FileBrowserCard");
  return (
    <div
      data-slot="file-browser-card"
      {...itemProps(item)}
      {...itemDrag(item)}
      {...rest}
      className={cx("fg-fbr-card fg-fbr-item", stateClass(item), className)}
    >
      {children ?? (
        <>
          <span role="gridcell" className="fg-fbr-thumb">
            <Thumbnail item={item} />
            {item.starred || item.locked || item.shared ? (
              <span className="fg-fbr-badges">{marks(item)}</span>
            ) : null}
          </span>
          <span role="gridcell" className="fg-fbr-card-foot">
            {mark(item)}
            {nameOf(item)}
            {more(item)}
          </span>
        </>
      )}
    </div>
  );
}

/** What is shown when the folder has no item: your `empty`, or the default state. */
export function FileBrowserEmpty({ children }: { children?: ReactNode }) {
  const { empty, onDropFiles } = useFileBrowser("FileBrowserEmpty");
  return (
    <>
      {children ?? empty ?? (
        <EmptyState
          variant="hatch"
          icon={Folder01Icon}
          title="This folder is empty"
          description={onDropFiles ? "Drop files here to upload them." : undefined}
        />
      )}
    </>
  );
}

/** The rectangle drawn while selecting from the empty space. */
export function FileBrowserLasso({ className, style, ...rest }: ComponentProps<"span">) {
  const { box } = useFileBrowser("FileBrowserLasso");
  if (!box) return null;
  return (
    <span
      data-slot="file-browser-lasso"
      aria-hidden="true"
      {...rest}
      className={cx("fg-fbr-lasso", className)}
      style={{ left: box.x, top: box.y, width: box.w, height: box.h, ...style }}
    />
  );
}

/** The picture of a file on its card: its own thumbnail, else a drawing of its kind. */
function Thumbnail({ item }: { item: DriveItem }) {
  const kind = driveItemKind(item);
  if (item.thumbnail)
    return <img className="fg-fbr-img" src={item.thumbnail} alt="" loading="lazy" />;
  if (kind === "pdf" || kind === "doc" || kind === "text")
    return (
      <span
        className="fg-fbr-paper"
        style={{ ["--fg-ftype-tone" as string]: FILE_KINDS[kind].tone }}
      >
        <i className="fg-fbr-paper-h" />
        <i />
        <i className="fg-fbr-paper-s" />
        <i />
        <i className="fg-fbr-paper-xs" />
        <i />
      </span>
    );
  if (kind === "sheet") return <span className="fg-fbr-sheet" />;
  if (kind === "slides")
    return (
      <span className="fg-fbr-slides">
        <i />
      </span>
    );
  if (kind === "image" || kind === "video")
    return (
      <span className="fg-fbr-hatch">
        <Icon
          icon={kind === "video" ? PlayFillIcon : FILE_KINDS.image.icon}
          size={24}
          variant="mono"
        />
      </span>
    );
  return <FileTypeMark kind={kind} size="xl" {...(item.icon ? { icon: item.icon } : {})} />;
}
