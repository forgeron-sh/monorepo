import type { Editor } from "@tiptap/core";
import { GripVerticalIcon } from "@forgeron/icons";
import { Icon, IconButton } from "@forgeron/ui";
import { NodeSelection, Selection } from "@tiptap/pm/state";
import { type RefObject, useEffect, useRef, useState } from "react";
import type { BlockDef } from "../core/blocks";
import { applyBlock, type ApplyBlockOptions } from "../tiptap/commands";
import { Floating } from "./floating";
import { blockIcon, UI_ICONS } from "./icons";

export interface BlockHandleProps extends ApplyBlockOptions {
  editor: Editor;
  /** The element that wraps the editor and is `position: relative`. */
  host: RefObject<HTMLElement | null>;
  /** The blocks the "turn into" menu offers. */
  blocks: ReadonlyArray<BlockDef>;
}

/** The top-level block of the document under a viewport point: its position and node. */
function blockAt(editor: Editor, clientX: number, clientY: number) {
  const { view } = editor;
  const box = view.dom.getBoundingClientRect();
  // The gutter is outside the content: read the block at the content's left edge, same height.
  const left = Math.min(Math.max(clientX, box.left + 1), box.right - 1);
  const hit = view.posAtCoords({ left, top: clientY });
  if (!hit) return null;
  const $pos = view.state.doc.resolve(hit.pos);
  const pos = $pos.depth >= 1 ? $pos.before(1) : hit.inside >= 0 ? hit.inside : hit.pos;
  const node = view.state.doc.nodeAt(pos);
  const dom = view.nodeDOM(pos);
  if (!node || !(dom instanceof HTMLElement)) return null;
  return { pos, node, dom };
}

/** Moves the block at `pos` one place up or down among its siblings. Returns `false` at an end. */
export function moveBlock(editor: Editor, pos: number, direction: "up" | "down"): boolean {
  return editor
    .chain()
    .command(({ tr }) => {
      const node = tr.doc.nodeAt(pos);
      if (!node) return false;
      const $pos = tr.doc.resolve(pos);
      if (direction === "up") {
        const before = $pos.nodeBefore;
        if (!before) return false;
        tr.delete(pos, pos + node.nodeSize).insert(pos - before.nodeSize, node);
        tr.setSelection(Selection.near(tr.doc.resolve(pos - before.nodeSize + 1)));
      } else {
        const after = tr.doc.nodeAt(pos + node.nodeSize);
        if (!after) return false;
        tr.delete(pos, pos + node.nodeSize).insert(pos + after.nodeSize, node);
        tr.setSelection(Selection.near(tr.doc.resolve(pos + after.nodeSize + 1)));
      }
      return true;
    })
    .focus()
    .run();
}

/** ProseMirror's own drag state: it tells the drop handler a block is being moved. */
function setDragging(view: Editor["view"], value: Editor["view"]["dragging"]) {
  view.dragging = value;
}

const TURNABLE = new Set([
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "taskList",
  "blockquote",
  "codeBlock",
]);

/**
 * At the left of the block under the pointer: a "+" that inserts a block below (and opens the
 * slash menu), and a grip that drags the block, or opens its menu: turn into, duplicate, move,
 * delete.
 */
export function BlockHandle({ editor, host, blocks, requestImage }: BlockHandleProps) {
  const [target, setTarget] = useState<{ pos: number; top: number } | null>(null);
  const [menu, setMenu] = useState<{ rect: DOMRect } | null>(null);
  const grip = useRef<HTMLButtonElement>(null);
  const current = useRef<{ pos: number; dom: HTMLElement } | null>(null);
  const menuOpen = useRef(false);
  useEffect(() => {
    menuOpen.current = menu !== null;
  }, [menu]);

  useEffect(() => {
    const root = host.current;
    if (!root) return;
    const move = (e: MouseEvent) => {
      if (menuOpen.current || !editor.isEditable) return;
      if ((e.target as Element | null)?.closest(".fg-rt-handle")) return;
      const hit = blockAt(editor, e.clientX, e.clientY);
      if (!hit) return;
      current.current = { pos: hit.pos, dom: hit.dom };
      const rootBox = root.getBoundingClientRect();
      const line = Number.parseFloat(getComputedStyle(hit.dom).lineHeight) || 24;
      setTarget({
        pos: hit.pos,
        top: hit.dom.getBoundingClientRect().top - rootBox.top + (line - 24) / 2,
      });
    };
    const leave = () => {
      if (!menuOpen.current) setTarget(null);
    };
    const type = () => setTarget(null);
    root.addEventListener("mousemove", move);
    root.addEventListener("mouseleave", leave);
    editor.view.dom.addEventListener("keydown", type);
    return () => {
      root.removeEventListener("mousemove", move);
      root.removeEventListener("mouseleave", leave);
      editor.view.dom.removeEventListener("keydown", type);
    };
  }, [editor, host]);

  // Positions shift while typing: always re-read the block from the live document.
  const live = () => {
    if (!target) return null;
    const node = editor.state.doc.nodeAt(target.pos);
    return node ? { pos: target.pos, node } : null;
  };

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest(".fg-rt-handle-menu, .fg-rt-handle")) return;
      setMenu(null);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(null);
        grip.current?.focus();
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [menu]);

  if (!target) return null;

  const addBelow = () => {
    const at = live();
    if (!at) return;
    const empty = at.node.type.name === "paragraph" && at.node.content.size === 0;
    if (empty) {
      editor
        .chain()
        .focus()
        .command(({ tr }) => {
          tr.setSelection(Selection.near(tr.doc.resolve(at.pos + 1)));
          return true;
        })
        .insertContent("/")
        .run();
      return;
    }
    const end = at.pos + at.node.nodeSize;
    editor
      .chain()
      .focus()
      .insertContentAt(end, { type: "paragraph", content: [{ type: "text", text: "/" }] })
      .run();
  };

  const run = (
    fn: (at: { pos: number; node: NonNullable<ReturnType<typeof live>>["node"] }) => void,
  ) => {
    const at = live();
    setMenu(null);
    if (at) fn(at);
  };

  const turnInto = (block: BlockDef) =>
    run(({ pos }) => {
      editor
        .chain()
        .focus()
        .command(({ tr }) => {
          tr.setSelection(Selection.near(tr.doc.resolve(pos + 1)));
          return true;
        })
        .run();
      applyBlock(editor, block.id, { requestImage });
    });

  const dragStart = (e: React.DragEvent) => {
    const at = live();
    const dom = current.current?.dom;
    if (!at || !dom) return e.preventDefault();
    const { view } = editor;
    const selection = NodeSelection.create(view.state.doc, at.pos);
    view.dispatch(view.state.tr.setSelection(selection));
    setDragging(view, { slice: selection.content(), move: true });
    e.dataTransfer.effectAllowed = "copyMove";
    e.dataTransfer.setData("text/plain", " ");
    e.dataTransfer.setDragImage(dom, 0, 0);
  };

  const at = live();
  const canTurn = at ? TURNABLE.has(at.node.type.name) : false;

  return (
    <>
      <div className="fg-rt-handle" style={{ top: target.top }} contentEditable={false}>
        <IconButton icon={UI_ICONS.plus} label="Add a block below" size="sm" onClick={addBelow} />
        <button
          ref={grip}
          type="button"
          className="fg-iconbtn fg-iconbtn-sm fg-rt-grip"
          aria-label="Drag to move, click for options"
          aria-haspopup="menu"
          aria-expanded={menu !== null}
          draggable
          onDragStart={dragStart}
          onDragEnd={() => {
            setDragging(editor.view, null);
          }}
          onClick={(e) => setMenu({ rect: e.currentTarget.getBoundingClientRect() })}
        >
          <Icon icon={GripVerticalIcon} size={12} variant="mono" />
        </button>
      </div>
      {menu ? (
        <Floating
          rect={menu.rect}
          className="fg-pop fg-rt-menu fg-rt-handle-menu"
          role="menu"
          label="Block options"
        >
          <div className="fg-pop-list">
            {canTurn ? (
              <>
                <p className="fg-rt-menu-head t-mono">Turn into</p>
                {blocks
                  .filter((b) => b.group !== "insert")
                  .map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      role="menuitem"
                      className="fg-pop-row"
                      onClick={() => turnInto(b)}
                    >
                      <Icon icon={blockIcon(b.icon)} size={12} variant="mono" />
                      <span className="fg-pop-label">{b.label}</span>
                    </button>
                  ))}
                <hr className="fg-rt-menu-sep" />
              </>
            ) : null}
            <button
              type="button"
              role="menuitem"
              className="fg-pop-row"
              onClick={() =>
                run(({ pos, node }) =>
                  editor
                    .chain()
                    .focus()
                    .insertContentAt(pos + node.nodeSize, node.toJSON())
                    .run(),
                )
              }
            >
              <Icon icon={UI_ICONS.copy} size={12} variant="mono" />
              <span className="fg-pop-label">Duplicate</span>
            </button>
            <button
              type="button"
              role="menuitem"
              className="fg-pop-row"
              onClick={() => run(({ pos }) => moveBlock(editor, pos, "up"))}
            >
              <span className="fg-rt-menu-gap" aria-hidden="true" />
              <span className="fg-pop-label">Move up</span>
            </button>
            <button
              type="button"
              role="menuitem"
              className="fg-pop-row"
              onClick={() => run(({ pos }) => moveBlock(editor, pos, "down"))}
            >
              <span className="fg-rt-menu-gap" aria-hidden="true" />
              <span className="fg-pop-label">Move down</span>
            </button>
            <button
              type="button"
              role="menuitem"
              className="fg-pop-row fg-rt-danger"
              onClick={() =>
                run(({ pos, node }) =>
                  editor
                    .chain()
                    .focus()
                    .deleteRange({ from: pos, to: pos + node.nodeSize })
                    .run(),
                )
              }
            >
              <Icon icon={UI_ICONS.trash} size={12} variant="mono" />
              <span className="fg-pop-label">Delete</span>
            </button>
          </div>
        </Floating>
      ) : null}
    </>
  );
}
