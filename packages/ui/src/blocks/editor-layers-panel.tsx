// The layers of a canvas as a tree: groups that fold, a visibility and a lock on each layer, a name
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
import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import {
  editorDescendantIds,
  editorDropLayer,
  editorDropPlace,
  editorFindLayer,
  editorFlattenLayers,
  editorIndentLayer,
  editorIsGroup,
  editorOutdentLayer,
  editorReorderLayer,
  editorSelectLayers,
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

type DropState = { id: string; place: "before" | "inside" | "after" } | null;

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
  const list = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const [anchor, setAnchor] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [drop, setDrop] = useState<DropState>(null);
  const [said, setSaid] = useState("");
  const focusId = useRef<string | null>(null);

  const tabId = rows.some((r) => r.layer.id === active) ? active : (rows[0]?.layer.id ?? null);

  // After a move or a fold, the focus follows the row.
  useEffect(() => {
    const id = focusId.current;
    if (!id) return;
    focusId.current = null;
    list.current?.querySelector<HTMLElement>(`[data-lid="${CSS.escape(id)}"]`)?.focus();
  });

  const focusRow = (id: string) => {
    setActive(id);
    list.current?.querySelector<HTMLElement>(`[data-lid="${CSS.escape(id)}"]`)?.focus();
  };

  const select = (row: EditorLayerRow, mode: "replace" | "toggle" | "range") => {
    const next = editorSelectLayers(rows, picked, row.layer.id, mode, anchor);
    setPicked(next);
    if (mode !== "range") setAnchor(row.layer.id);
  };

  const toggleFold = (id: string, open?: boolean) => {
    const isFolded = folded.includes(id);
    if (open === undefined ? isFolded : open) setFolded(folded.filter((f) => f !== id));
    else if (!isFolded) setFolded([...folded, id]);
  };

  const patch = (id: string, change: Partial<Omit<EditorLayer, "id" | "children">>) => {
    if (readOnly) return;
    setTree(editorUpdateLayer(tree, id, change));
  };

  const commitTree = (next: ReadonlyArray<EditorLayer>, id: string) => {
    if (next === tree) return;
    setTree(next);
    focusId.current = id;
    setActive(id);
    const at = editorFindLayer(next, id);
    const layer = at?.layer;
    if (layer && at) {
      const siblings =
        at.parentId === null
          ? next.length
          : (editorFindLayer(next, at.parentId)?.layer.children?.length ?? 0);
      setSaid(`${layer.name} moved to position ${at.index + 1} of ${siblings}.`);
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
    else focusRow(id);
  };

  const onKey = (event: KeyboardEvent<HTMLDivElement>, row: EditorLayerRow, i: number) => {
    if (event.target !== event.currentTarget) return;
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

    if (key === "ArrowDown" || key === "ArrowUp") {
      event.preventDefault();
      const to = rows[i + (key === "ArrowDown" ? 1 : -1)];
      if (!to) return;
      focusRow(to.layer.id);
      if (event.shiftKey) select(to, "range");
    } else if (key === "Home" || key === "End") {
      event.preventDefault();
      const to = key === "Home" ? rows[0] : rows[rows.length - 1];
      if (to) focusRow(to.layer.id);
    } else if (key === "ArrowRight") {
      event.preventDefault();
      if (editorIsGroup(row.layer)) {
        if (folded.includes(id)) toggleFold(id, true);
        else if (rows[i + 1]?.parentId === id) focusRow(rows[i + 1]!.layer.id);
      }
    } else if (key === "ArrowLeft") {
      event.preventDefault();
      if (editorIsGroup(row.layer) && !folded.includes(id)) toggleFold(id, false);
      else if (row.parentId) focusRow(row.parentId);
    } else if (key === "Enter") {
      event.preventDefault();
      select(row, event.shiftKey ? "range" : mod ? "toggle" : "replace");
    } else if (key === " ") {
      event.preventDefault();
      select(row, event.shiftKey ? "range" : "toggle");
    } else if (key === "F2") {
      event.preventDefault();
      startRename(row);
    } else if ((key === "a" || key === "A") && mod) {
      event.preventDefault();
      setPicked(rows.map((r) => r.layer.id));
    } else if (!mod && !readOnly && (key === "h" || key === "H")) {
      event.preventDefault();
      patch(id, { visible: row.layer.visible === false });
    } else if (!mod && !readOnly && (key === "l" || key === "L")) {
      event.preventDefault();
      patch(id, { locked: !row.layer.locked });
    }
  };

  const onClickRow = (event: MouseEvent<HTMLDivElement>, row: EditorLayerRow) => {
    if ((event.target as HTMLElement).closest("button, input")) return;
    setActive(row.layer.id);
    select(row, event.shiftKey ? "range" : event.metaKey || event.ctrlKey ? "toggle" : "replace");
  };

  const dragged = dragId ? editorFindLayer(tree, dragId)?.layer : undefined;
  const forbidden = new Set(dragged ? [dragged.id, ...editorDescendantIds(dragged)] : []);

  const onDragOver = (event: DragEvent<HTMLDivElement>, row: EditorLayerRow) => {
    if (!dragId || forbidden.has(row.layer.id)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const box = event.currentTarget.getBoundingClientRect();
    const place = editorDropPlace((event.clientY - box.top) / box.height, editorIsGroup(row.layer));
    if (drop?.id !== row.layer.id || drop.place !== place) setDrop({ id: row.layer.id, place });
  };

  const onDrop = (event: DragEvent<HTMLDivElement>, row: EditorLayerRow) => {
    event.preventDefault();
    if (dragId && drop && !forbidden.has(row.layer.id)) {
      const next = editorDropLayer(tree, dragId, row, drop.place);
      if (drop.place === "inside") toggleFold(row.layer.id, true);
      commitTree(next, dragId);
    }
    setDragId(null);
    setDrop(null);
  };

  if (rows.length === 0 && tree.length === 0) {
    return <p className={cx("fg-edt-layers-empty", className)}>{empty}</p>;
  }

  return (
    <div className={cx("fg-edt-layers", className)}>
      <div
        ref={list}
        role="tree"
        aria-label={label}
        aria-multiselectable="true"
        className="fg-edt-layers-tree"
      >
        {rows.map((row, i) => {
          const { layer } = row;
          const id = layer.id;
          const group = editorIsGroup(layer);
          const isFolded = folded.includes(id);
          const isSelected = picked.includes(id);
          const hidden = layer.visible === false || row.hiddenByParent;
          const locked = layer.locked === true || row.lockedByParent;
          const canMove = !readOnly && !locked;
          const editing = renaming === id;
          return (
            <div
              key={id}
              role="treeitem"
              data-lid={id}
              aria-level={row.depth + 1}
              aria-posinset={row.index + 1}
              aria-setsize={row.siblings}
              aria-selected={isSelected}
              aria-expanded={group ? !isFolded : undefined}
              aria-label={`${layer.name}${layer.kind ? `, ${layer.kind}` : ""}${hidden ? ", hidden" : ""}${locked ? ", locked" : ""}`}
              aria-description={canMove ? "Alt and the arrows move this layer." : undefined}
              tabIndex={id === tabId ? 0 : -1}
              draggable={canMove && !editing}
              className={cx(
                "fg-edt-layer",
                isSelected && "fg-edt-layer-on",
                hidden && "fg-edt-layer-hidden",
                dragId === id && "fg-edt-layer-dragging",
                drop?.id === id && `fg-edt-drop-${drop.place}`,
              )}
              style={{ paddingLeft: 6 + row.depth * 16 }}
              onFocus={(e) => {
                if (e.target === e.currentTarget) setActive(id);
              }}
              onClick={(e) => onClickRow(e, row)}
              onDoubleClick={(e) => {
                if ((e.target as HTMLElement).closest("button, input")) return;
                startRename(row);
              }}
              onKeyDown={(e) => onKey(e, row, i)}
              onDragStart={(e) => {
                setDragId(id);
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", id);
              }}
              onDragOver={(e) => onDragOver(e, row)}
              onDrop={(e) => onDrop(e, row)}
              onDragEnd={() => {
                setDragId(null);
                setDrop(null);
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
            </div>
          );
        })}
      </div>
      <span className="fg-visually-hidden" role="status">
        {said}
      </span>
    </div>
  );
}
