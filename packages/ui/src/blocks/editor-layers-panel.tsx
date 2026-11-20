// The layers of a canvas as a flat tree on the Tree primitive: groups that fold, a visibility and a lock on each layer, a name
// you rename in place, a selection of several. Reorder by dragging (before, after or into a group)
// or with Alt and the arrows; the tree is plain data the editor owns.

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
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
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
  className?: string;
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

  if (rows.length === 0 && tree.length === 0) {
    return <p className={cx("fg-edt-layers-empty", className)}>{empty}</p>;
  }

  return (
    <div className={cx("fg-edt-layers", className)}>
      <Tree
        ref={list}
        render={<div />}
        aria-label={label}
        selectionMode="multiple"
        selected={picked}
        onSelectedChange={(ids) => setPicked(ids)}
        expanded={rows
          .filter((r) => editorIsGroup(r.layer) && !folded.includes(r.layer.id))
          .map((r) => r.layer.id)}
        onExpandedChange={setExpanded}
        onKeyDown={onKey}
        className="fg-edt-layers-tree"
      >
        {rows.map((row) => {
          const { layer } = row;
          const id = layer.id;
          const group = editorIsGroup(layer);
          const isFolded = folded.includes(id);
          const hidden = layer.visible === false || row.hiddenByParent;
          const locked = layer.locked === true || row.lockedByParent;
          const canMove = !readOnly && !locked;
          const editing = renaming === id;
          return (
            <TreeItem
              key={id}
              id={id}
              render={<div />}
              pickOnClick
              textValue={layer.name}
              hasChildren={group}
              level={row.depth + 1}
              position={row.index + 1}
              setSize={row.siblings}
              data-lid={id}
              aria-label={`${layer.name}${layer.kind ? `, ${layer.kind}` : ""}${hidden ? ", hidden" : ""}${locked ? ", locked" : ""}`}
              aria-description={canMove ? "Alt and the arrows move this layer." : undefined}
              {...sortable.getItemProps(id, {
                className: cx(
                  "fg-edt-layer",
                  picked.includes(id) && "fg-edt-layer-on",
                  hidden && "fg-edt-layer-hidden",
                  sortable.getItemState(id).dragging && "fg-edt-layer-dragging",
                  sortable.getItemState(id).over && `fg-edt-drop-${sortable.getItemState(id).over}`,
                ),
              })}
              style={{ paddingLeft: 6 + row.depth * 16 }}
              onClick={(e) => {
                // Its own buttons and the name field keep their clicks.
                if ((e.target as HTMLElement).closest("button, input")) e.preventDefault();
              }}
              onDoubleClick={(e) => {
                if ((e.target as HTMLElement).closest("button, input")) return;
                startRename(row);
              }}
            >
              {canMove ? (
                <span className="fg-edt-layer-grip" aria-hidden="true">
                  <Icon icon={Drag02Icon} size={12} variant="mono" />
                </span>
              ) : (
                <span className="fg-edt-layer-grip" aria-hidden="true" />
              )}
              {group ? (
                <button
                  type="button"
                  tabIndex={-1}
                  className="fg-edt-layer-fold"
                  aria-label={`${isFolded ? "Expand" : "Collapse"} ${layer.name}`}
                  onClick={() => toggleFold(id)}
                >
                  <Icon
                    icon={isFolded ? ArrowRight01Icon : ArrowDown01Icon}
                    size={12}
                    variant="mono"
                  />
                </button>
              ) : (
                <span className="fg-edt-layer-fold" aria-hidden="true" />
              )}
              <span className="fg-edt-layer-mark" aria-hidden="true">
                <Icon icon={MARK_OF(layer)} size={12} variant="mono" />
              </span>
              {editing ? (
                <input
                  className="fg-edt-layer-input"
                  value={draft}
                  aria-label={`Rename ${layer.name}`}
                  autoFocus
                  onFocus={(e) => e.currentTarget.select()}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") finishRename(id, true);
                    else if (e.key === "Escape") finishRename(id, false);
                  }}
                  onBlur={() => renaming === id && finishRename(id, true)}
                />
              ) : (
                <span className="fg-edt-layer-name">{layer.name}</span>
              )}
              {layer.kind && !editing ? (
                <span className="fg-edt-layer-kind">{layer.kind}</span>
              ) : null}
              {rowActions ? <span className="fg-edt-layer-extra">{rowActions(layer)}</span> : null}
              <button
                type="button"
                tabIndex={-1}
                disabled={readOnly}
                className={cx("fg-edt-layer-btn", layer.locked && "fg-edt-layer-btn-on")}
                aria-pressed={layer.locked === true}
                aria-label={`Lock ${layer.name}`}
                title={layer.locked ? "Unlock" : "Lock"}
                onClick={() => patch(id, { locked: !layer.locked })}
              >
                <Icon
                  icon={layer.locked ? LockedIcon : LockKeyholeOpenIcon}
                  size={12}
                  variant="mono"
                />
              </button>
              <button
                type="button"
                tabIndex={-1}
                disabled={readOnly}
                className={cx("fg-edt-layer-btn", layer.visible === false && "fg-edt-layer-btn-on")}
                aria-pressed={layer.visible === false}
                aria-label={`Hide ${layer.name}`}
                title={layer.visible === false ? "Show" : "Hide"}
                onClick={() => patch(id, { visible: layer.visible === false })}
              >
                <Icon
                  icon={layer.visible === false ? ViewOffSlashIcon : ViewIcon}
                  size={12}
                  variant="mono"
                />
              </button>
            </TreeItem>
          );
        })}
      </Tree>
      <span className="fg-visually-hidden" role="status">
        {sortable.status}
      </span>
    </div>
  );
}
