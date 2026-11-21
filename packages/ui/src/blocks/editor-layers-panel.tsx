// The layers of a canvas as a flat tree on the Tree primitive: groups that fold, a visibility and a lock on each layer, a name
// you rename in place, a selection of several. Reorder by dragging (before, after or into a group)
// or with Alt and the arrows; the tree is plain data the editor owns.
//
// `LayersPanel` alone builds the usual panel. With children it is the root of the parts:
//
//   <LayersPanel label="Layers" layers={layers} onChange={setLayers}>
//     <LayersPanelTree>
//       {(row) => (
//         <LayersPanelRow row={row}>
//           <LayersPanelGrip /> <LayersPanelFold /> <LayersPanelMark /> <LayersPanelName />
//           <LayersPanelLock /> <LayersPanelVisibility />
//         </LayersPanelRow>
//       )}
//     </LayersPanelTree>
//   </LayersPanel>

import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  Drag02Icon,
  FolderClosedIcon,
  LockedIcon,
  LockKeyholeOpenIcon,
  Square01Icon,
  ViewIcon,
  ViewOffSlashIcon,
} from "@forgeron/icons";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import type { Part } from "../part";
import { useSortable } from "../sortable";
import { focusTreeItem, Tree, TreeItem } from "../tree";
import {
  editorDescendantIds,
  editorDropLayer,
  editorFindLayer,
  editorFlattenLayers,
  editorIndentLayer,
  editorIsGroup,
  editorOutdentLayer,
  editorReorderLayer,
  editorUpdateLayer,
  type EditorLayer,
  type EditorLayerRow,
  type EditorReorder,
} from "./editor-model";

export interface LayersPanelProps {
  /** Names the tree: "Layers". */
  label: string;
  /** The layers, first on top; a layer with `children` is a group. */
  layers?: ReadonlyArray<EditorLayer>;
  defaultLayers?: ReadonlyArray<EditorLayer>;
  /** Called with the new tree after a rename, a toggle, a reorder or a move. */
  onChange?: (layers: EditorLayer[]) => void;
  /** The ids of the selected layers. */
  selected?: ReadonlyArray<string>;
  defaultSelected?: ReadonlyArray<string>;
  onSelectedChange?: (ids: string[]) => void;
  /** The ids of the groups that are folded. */
  collapsed?: ReadonlyArray<string>;
  defaultCollapsed?: ReadonlyArray<string>;
  onCollapsedChange?: (ids: string[]) => void;
  /** Turns off renaming, toggles, drag and reorder keys; selection still works. */
  readOnly?: boolean;
  /** Written in the panel when there are no layers. */
  empty?: ReactNode;
  /** More at the end of a row: a menu, a badge. */
  rowActions?: (layer: EditorLayer) => ReactNode;
  /** The parts of the panel. Without them, the empty note or the tree with every row. */
  children?: ReactNode;
  className?: string;
}

interface PanelContext {
  label: string;
  tree: ReadonlyArray<EditorLayer>;
  rows: EditorLayerRow[];
  picked: ReadonlyArray<string>;
  setPicked: (ids: string[]) => void;
  folded: ReadonlyArray<string>;
  toggleFold: (id: string, open?: boolean) => void;
  setExpanded: (ids: string[]) => void;
  readOnly: boolean;
  empty: ReactNode;
  rowActions: ((layer: EditorLayer) => ReactNode) | undefined;
  renaming: string | null;
  draft: string;
  setDraft: (draft: string) => void;
  startRename: (row: EditorLayerRow) => void;
  finishRename: (id: string, keep: boolean) => void;
  patch: (id: string, change: Partial<Omit<EditorLayer, "id" | "children">>) => void;
  onKey: (event: KeyboardEvent<HTMLElement>) => void;
  sortable: ReturnType<typeof useSortable<EditorLayerRow>>;
}

const Ctx = createContext<PanelContext | null>(null);
// The ref of the tree is apart: reading the context must not look like reading a ref.
const ListCtx = createContext<RefObject<HTMLElement | null> | null>(null);

function usePanel(part: string): PanelContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error(`<${part}> goes inside a <LayersPanel>.`);
  return ctx;
}

interface RowContext {
  row: EditorLayerRow;
  hidden: boolean;
  locked: boolean;
  canMove: boolean;
  editing: boolean;
  group: boolean;
  folded: boolean;
}

const RowCtx = createContext<RowContext | null>(null);

function useRow(part: string): RowContext {
  const ctx = useContext(RowCtx);
  if (!ctx) throw new Error(`<${part}> goes inside a <LayersPanelRow>.`);
  return ctx;
}

const MARK_OF = (layer: EditorLayer) => (editorIsGroup(layer) ? FolderClosedIcon : Square01Icon);

/** The layers of a canvas: nested, selectable, renamable, reorderable by drag or keyboard. */
export function LayersPanel({
  label,
  layers,
  defaultLayers,
  onChange,
  selected,
  defaultSelected,
  onSelectedChange,
  collapsed,
  defaultCollapsed,
  onCollapsedChange,
  readOnly,
  empty = "No layers yet.",
  rowActions,
  children,
  className,
}: LayersPanelProps) {
  const [tree, setTree] = useControllableState<ReadonlyArray<EditorLayer>>({
    ...(layers !== undefined ? { value: layers } : {}),
    defaultValue: defaultLayers ?? [],
    ...(onChange ? { onChange: (next) => onChange(next as EditorLayer[]) } : {}),
  });
  const [picked, setPicked] = useControllableState<ReadonlyArray<string>>({
    ...(selected !== undefined ? { value: selected } : {}),
    defaultValue: defaultSelected ?? [],
    ...(onSelectedChange ? { onChange: (next) => onSelectedChange([...next]) } : {}),
  });
  const [folded, setFolded] = useControllableState<ReadonlyArray<string>>({
    ...(collapsed !== undefined ? { value: collapsed } : {}),
    defaultValue: defaultCollapsed ?? [],
    ...(onCollapsedChange ? { onChange: (next) => onCollapsedChange([...next]) } : {}),
  });

  const rows = editorFlattenLayers(tree, new Set(folded));
  const list = useRef<HTMLElement>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const focusId = useRef<string | null>(null);

  // After a move or a fold, the focus follows the row.
  useEffect(() => {
    const id = focusId.current;
    if (!id) return;
    focusId.current = null;
    focusTreeItem(list.current, id);
  });

  const toggleFold = (id: string, open?: boolean) => {
    const isFolded = folded.includes(id);
    if (open === undefined ? isFolded : open) setFolded(folded.filter((f) => f !== id));
    else if (!isFolded) setFolded([...folded, id]);
  };

  // The tree says which groups are open now; the panel keeps the ones that are folded.
  const setExpanded = (ids: string[]) => {
    const on = new Set(ids);
    const next = folded.filter((f) => !on.has(f));
    for (const r of rows) {
      if (editorIsGroup(r.layer) && !on.has(r.layer.id) && !next.includes(r.layer.id))
        next.push(r.layer.id);
    }
    setFolded(next);
  };

  const patch = (id: string, change: Partial<Omit<EditorLayer, "id" | "children">>) => {
    if (readOnly) return;
    setTree(editorUpdateLayer(tree, id, change));
  };

  // Whatever the dragged layer holds cannot take it.
  const forbiddenFor = (dragId: string) => {
    const dragged = editorFindLayer(tree, dragId)?.layer;
    return new Set(dragged ? [dragged.id, ...editorDescendantIds(dragged)] : []);
  };
  const rowOf = (id: string) => rows.find((r) => r.layer.id === id);
  const sortable = useSortable({
    items: rows,
    getId: (row) => row.layer.id,
    getLabel: (row) => row.layer.name,
    // A tree moves by its own keys (below): Alt + arrows reorder, indent and outdent.
    keyboard: false,
    disabled: (id) => {
      const row = rowOf(id);
      return (
        !row ||
        readOnly === true ||
        row.layer.locked === true ||
        row.lockedByParent ||
        renaming === id
      );
    },
    nest: (id) => {
      const row = rowOf(id);
      return row !== undefined && editorIsGroup(row.layer);
    },
    nestRange: [0.28, 0.72],
    canDrop: (dragId, overId) => !forbiddenFor(dragId).has(overId),
    onItemDrop: ({ id, overId, position }) => {
      const row = rowOf(overId);
      if (!row) return;
      const next = editorDropLayer(tree, id, row, position);
      if (position === "inside") toggleFold(overId, true);
      commitTree(next, id);
    },
  });

  const commitTree = (next: ReadonlyArray<EditorLayer>, id: string) => {
    if (next === tree) return;
    setTree(next);
    focusId.current = id;
    const at = editorFindLayer(next, id);
    const layer = at?.layer;
    if (layer && at) {
      const siblings =
        at.parentId === null
          ? next.length
          : (editorFindLayer(next, at.parentId)?.layer.children?.length ?? 0);
      sortable.announce(`${layer.name} moved to position ${at.index + 1} of ${siblings}.`);
    }
  };

  const reorder = (id: string, way: EditorReorder) => {
    commitTree(editorReorderLayer(tree, id, way), id);
  };

  const startRename = (row: EditorLayerRow) => {
    if (readOnly || row.layer.locked || row.lockedByParent) return;
    setRenaming(row.layer.id);
    setDraft(row.layer.name);
  };

  const finishRename = (id: string, keep: boolean) => {
    const name = draft.trim();
    setRenaming(null);
    focusId.current = id;
    if (keep && name !== "") patch(id, { name });
    else focusTreeItem(list.current, id);
  };

  // What the tree does not know: Alt + arrows reorder, F2 renames, H hides, L locks.
  const onKey = (event: KeyboardEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.getAttribute("role") !== "treeitem") return;
    const row = rows.find((r) => r.layer.id === target.dataset.lid);
    if (!row) return;
    const id = row.layer.id;
    const { key } = event;
    const mod = event.metaKey || event.ctrlKey;
    const movable = !readOnly && !row.layer.locked && !row.lockedByParent;

    if (event.altKey && !mod) {
      if (!movable) return;
      const way: EditorReorder | null =
        key === "ArrowUp"
          ? "up"
          : key === "ArrowDown"
            ? "down"
            : key === "Home"
              ? "top"
              : key === "End"
                ? "bottom"
                : null;
      if (way) {
        event.preventDefault();
        reorder(id, way);
      } else if (key === "ArrowRight") {
        event.preventDefault();
        const next = editorIndentLayer(tree, id);
        const into = next === tree ? null : editorFindLayer(next, id)?.parentId;
        if (into) toggleFold(into, true);
        commitTree(next, id);
      } else if (key === "ArrowLeft") {
        event.preventDefault();
        commitTree(editorOutdentLayer(tree, id), id);
      }
      return;
    }

    if (key === "F2") {
      event.preventDefault();
      startRename(row);
    } else if (!mod && !readOnly && (key === "h" || key === "H")) {
      event.preventDefault();
      patch(id, { visible: row.layer.visible === false });
    } else if (!mod && !readOnly && (key === "l" || key === "L")) {
      event.preventDefault();
      patch(id, { locked: !row.layer.locked });
    }
  };

  const ctx: PanelContext = {
    label,
    tree,
    rows,
    picked,
    setPicked: (ids) => setPicked(ids),
    folded,
    toggleFold,
    setExpanded,
    readOnly: readOnly === true,
    empty,
    rowActions,
    renaming,
    draft,
    setDraft,
    startRename,
    finishRename,
    patch,
    onKey,
    sortable,
  };

  const empty_ = rows.length === 0 && tree.length === 0;

  return (
    <Ctx.Provider value={ctx}>
      <ListCtx.Provider value={list}>
        {children ??
          (empty_ ? (
            <LayersPanelEmpty className={className} />
          ) : (
            <LayersPanelTree className={className} />
          ))}
      </ListCtx.Provider>
    </Ctx.Provider>
  );
}

/** What is said when there are no layers. */
export function LayersPanelEmpty({ className, children, ...rest }: Part<ComponentProps<"p">>) {
  const { empty } = usePanel("LayersPanelEmpty");
  return (
    <p data-slot="layers-panel-empty" {...rest} className={cx("fg-edt-layers-empty", className)}>
      {children ?? empty}
    </p>
  );
}

export type LayersPanelTreeProps = Part<Omit<ComponentProps<"div">, "children">> & {
  /** Draws a row for a layer. Default: grip, fold, mark, name, kind, actions, lock and visibility. */
  children?: (row: EditorLayerRow) => ReactNode;
};

/** The tree itself: keyboard, selection, folding and the live status of drags. */
export function LayersPanelTree({ children, className, ...rest }: LayersPanelTreeProps) {
  const p = usePanel("LayersPanelTree");
  const list = useContext(ListCtx);
  if (p.rows.length === 0 && p.tree.length === 0) return null;
  return (
    <div data-slot="layers-panel" {...rest} className={cx("fg-edt-layers", className)}>
      <Tree
        ref={list}
        render={<div />}
        aria-label={p.label}
        selectionMode="multiple"
        selected={p.picked}
        onSelectedChange={(ids) => p.setPicked(ids)}
        expanded={p.rows
          .filter((r) => editorIsGroup(r.layer) && !p.folded.includes(r.layer.id))
          .map((r) => r.layer.id)}
        onExpandedChange={p.setExpanded}
        onKeyDown={p.onKey}
        className="fg-edt-layers-tree"
      >
        {p.rows.map((row) =>
          children ? (
            children(row)
          ) : (
            <LayersPanelRow key={row.layer.id} row={row}>
              <LayersPanelGrip />
              <LayersPanelFold />
              <LayersPanelMark />
              <LayersPanelName />
              <LayersPanelKind />
              <LayersPanelExtra />
              <LayersPanelLock />
              <LayersPanelVisibility />
            </LayersPanelRow>
          ),
        )}
      </Tree>
      <span className="fg-visually-hidden" role="status">
        {p.sortable.status}
      </span>
    </div>
  );
}

export type LayersPanelRowProps = Part<
  Omit<ComponentProps<typeof TreeItem>, "id" | "hasChildren" | "level" | "position" | "setSize">
> & { row: EditorLayerRow };

/** One layer: a tree item that selects, drags, renames on double click and holds its parts. */
export function LayersPanelRow({ row, className, style, children, ...rest }: LayersPanelRowProps) {
  const p = usePanel("LayersPanelRow");
  const { layer } = row;
  const id = layer.id;
  const group = editorIsGroup(layer);
  const hidden = layer.visible === false || row.hiddenByParent;
  const locked = layer.locked === true || row.lockedByParent;
  const canMove = !p.readOnly && !locked;
  const editing = p.renaming === id;
  const state = p.sortable.getItemState(id);
  return (
    <RowCtx.Provider
      value={{ row, hidden, locked, canMove, editing, group, folded: p.folded.includes(id) }}
    >
      <TreeItem
        id={id}
        render={<div />}
        pickOnClick
        textValue={layer.name}
        hasChildren={group}
        level={row.depth + 1}
        position={row.index + 1}
        setSize={row.siblings}
        data-lid={id}
        data-slot="layers-panel-row"
        aria-label={`${layer.name}${layer.kind ? `, ${layer.kind}` : ""}${hidden ? ", hidden" : ""}${locked ? ", locked" : ""}`}
        aria-description={canMove ? "Alt and the arrows move this layer." : undefined}
        {...p.sortable.getItemProps(id, {
          className: cx(
            "fg-edt-layer",
            p.picked.includes(id) && "fg-edt-layer-on",
            hidden && "fg-edt-layer-hidden",
            state.dragging && "fg-edt-layer-dragging",
            state.over && `fg-edt-drop-${state.over}`,
            className,
          ),
        })}
        style={{ paddingLeft: 6 + row.depth * 16, ...style }}
        onClick={(e) => {
          // Its own buttons and the name field keep their clicks.
          if ((e.target as HTMLElement).closest("button, input")) e.preventDefault();
        }}
        onDoubleClick={(e) => {
          if ((e.target as HTMLElement).closest("button, input")) return;
          p.startRename(row);
        }}
        {...rest}
      >
        {children}
      </TreeItem>
    </RowCtx.Provider>
  );
}

/** The drag handle; blank when the layer cannot move. */
export function LayersPanelGrip({
  className,
  ...rest
}: Part<Omit<ComponentProps<"span">, "children">>) {
  const { canMove } = useRow("LayersPanelGrip");
  return (
    <span
      aria-hidden="true"
      data-slot="layers-panel-grip"
      {...rest}
      className={cx("fg-edt-layer-grip", className)}
    >
      {canMove ? <Icon icon={Drag02Icon} size={12} variant="mono" /> : null}
    </span>
  );
}

/** The arrow that folds a group; blank for a layer. */
export function LayersPanelFold({
  className,
  ...rest
}: Part<Omit<ComponentProps<"button">, "children">>) {
  const p = usePanel("LayersPanelFold");
  const r = useRow("LayersPanelFold");
  if (!r.group) return <span className="fg-edt-layer-fold" aria-hidden="true" />;
  const { layer } = r.row;
  return (
    <button
      type="button"
      tabIndex={-1}
      data-slot="layers-panel-fold"
      aria-label={`${r.folded ? "Expand" : "Collapse"} ${layer.name}`}
      onClick={() => p.toggleFold(layer.id)}
      {...rest}
      className={cx("fg-edt-layer-fold", className)}
    >
      <Icon icon={r.folded ? ArrowRight01Icon : ArrowDown01Icon} size={12} variant="mono" />
    </button>
  );
}

/** The icon that says group or layer. */
export function LayersPanelMark({
  className,
  ...rest
}: Part<Omit<ComponentProps<"span">, "children">>) {
  const { row } = useRow("LayersPanelMark");
  return (
    <span
      aria-hidden="true"
      data-slot="layers-panel-mark"
      {...rest}
      className={cx("fg-edt-layer-mark", className)}
    >
      <Icon icon={MARK_OF(row.layer)} size={12} variant="mono" />
    </span>
  );
}

/** The name, or its field while it is renamed (F2, double click). */
export function LayersPanelName({
  className,
  ...rest
}: Part<Omit<ComponentProps<"span">, "children">>) {
  const p = usePanel("LayersPanelName");
  const r = useRow("LayersPanelName");
  const { layer } = r.row;
  if (r.editing) {
    return (
      <input
        className="fg-edt-layer-input"
        data-slot="layers-panel-input"
        value={p.draft}
        aria-label={`Rename ${layer.name}`}
        autoFocus
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => p.setDraft(e.target.value)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") p.finishRename(layer.id, true);
          else if (e.key === "Escape") p.finishRename(layer.id, false);
        }}
        onBlur={() => p.renaming === layer.id && p.finishRename(layer.id, true)}
      />
    );
  }
  return (
    <span data-slot="layers-panel-name" {...rest} className={cx("fg-edt-layer-name", className)}>
      {layer.name}
    </span>
  );
}

/** The kind of the layer, as small text. Nothing without a `kind`, or while renaming. */
export function LayersPanelKind({
  className,
  ...rest
}: Part<Omit<ComponentProps<"span">, "children">>) {
  const r = useRow("LayersPanelKind");
  if (!r.row.layer.kind || r.editing) return null;
  return (
    <span data-slot="layers-panel-kind" {...rest} className={cx("fg-edt-layer-kind", className)}>
      {r.row.layer.kind}
    </span>
  );
}

/** What the root's `rowActions` draws for the layer: a menu, a badge. Or your children. */
export function LayersPanelExtra({ className, children, ...rest }: Part<ComponentProps<"span">>) {
  const p = usePanel("LayersPanelExtra");
  const { row } = useRow("LayersPanelExtra");
  const content = children ?? p.rowActions?.(row.layer);
  if (!content) return null;
  return (
    <span data-slot="layers-panel-extra" {...rest} className={cx("fg-edt-layer-extra", className)}>
      {content}
    </span>
  );
}

/** The lock button. */
export function LayersPanelLock({
  className,
  ...rest
}: Part<Omit<ComponentProps<"button">, "children">>) {
  const p = usePanel("LayersPanelLock");
  const { row } = useRow("LayersPanelLock");
  const { layer } = row;
  return (
    <button
      type="button"
      tabIndex={-1}
      disabled={p.readOnly}
      data-slot="layers-panel-lock"
      aria-pressed={layer.locked === true}
      aria-label={`Lock ${layer.name}`}
      title={layer.locked ? "Unlock" : "Lock"}
      onClick={() => p.patch(layer.id, { locked: !layer.locked })}
      {...rest}
      className={cx("fg-edt-layer-btn", layer.locked && "fg-edt-layer-btn-on", className)}
    >
      <Icon icon={layer.locked ? LockedIcon : LockKeyholeOpenIcon} size={12} variant="mono" />
    </button>
  );
}

/** The show and hide button. */
export function LayersPanelVisibility({
  className,
  ...rest
}: Part<Omit<ComponentProps<"button">, "children">>) {
  const p = usePanel("LayersPanelVisibility");
  const { row } = useRow("LayersPanelVisibility");
  const { layer } = row;
  return (
    <button
      type="button"
      tabIndex={-1}
      disabled={p.readOnly}
      data-slot="layers-panel-visibility"
      aria-pressed={layer.visible === false}
      aria-label={`Hide ${layer.name}`}
      title={layer.visible === false ? "Show" : "Hide"}
      onClick={() => p.patch(layer.id, { visible: layer.visible === false })}
      {...rest}
      className={cx(
        "fg-edt-layer-btn",
        layer.visible === false && "fg-edt-layer-btn-on",
        className,
      )}
    >
      <Icon icon={layer.visible === false ? ViewOffSlashIcon : ViewIcon} size={12} variant="mono" />
    </button>
  );
}
