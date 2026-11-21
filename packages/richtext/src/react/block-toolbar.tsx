import type { Editor } from "@tiptap/core";
import { Toolbar, ToolbarButton, ToolbarSeparator } from "@forgeron/ui";
import { useEditorState } from "@tiptap/react";
import { Fragment, useCallback, useEffect, useState } from "react";
import type { BlockToolbar, ToolbarItem } from "../tiptap/plugin";
import { Floating } from "./floating";

export interface BlockToolbarsProps {
  editor: Editor;
  /** What the plugins put in the `blockToolbar` slot. */
  toolbars: ReadonlyArray<BlockToolbar>;
}

type Rect = { left: number; right: number; top: number; bottom: number };

/** The toolbar whose node holds the cursor, with the box of that node in the viewport. */
function locate(editor: Editor, toolbars: ReadonlyArray<BlockToolbar>) {
  if (!editor.isEditable) return null;
  const { $from } = editor.state.selection;
  for (let depth = $from.depth; depth > 0; depth--) {
    const name = $from.node(depth).type.name;
    const toolbar = toolbars.find((t) => t.node === name);
    if (!toolbar) continue;
    const dom = editor.view.nodeDOM($from.before(depth));
    if (!(dom instanceof HTMLElement)) return null;
    const r = dom.getBoundingClientRect();
    return {
      toolbar,
      rect: { left: r.left, right: r.right, top: r.top, bottom: r.bottom } as Rect,
    };
  }
  return null;
}

/**
 * A toolbar over the block the cursor is in, like the marks above a selection: rows and columns of
 * a table. Which toolbar and what is in it come from the plugins.
 */
export function BlockToolbars({ editor, toolbars }: BlockToolbarsProps) {
  const [at, setAt] = useState<ReturnType<typeof locate>>(null);
  const items = at?.toolbar.items ?? ([] as ReadonlyArray<ToolbarItem>);
  const flags = useEditorState({
    editor,
    selector: ({ editor: e }) => items.map((i) => [!!i.active?.(e), !!i.disabled?.(e)] as const),
  });
  const refresh = useCallback(() => setAt(locate(editor, toolbars)), [editor, toolbars]);
  useEffect(() => {
    editor.on("selectionUpdate", refresh);
    editor.on("update", refresh);
    editor.on("blur", refresh);
    window.addEventListener("scroll", refresh, true);
    window.addEventListener("resize", refresh);
    return () => {
      editor.off("selectionUpdate", refresh);
      editor.off("update", refresh);
      editor.off("blur", refresh);
      window.removeEventListener("scroll", refresh, true);
      window.removeEventListener("resize", refresh);
    };
  }, [editor, refresh]);
  if (!at || !editor.view.hasFocus()) return null;
  return (
    <Floating rect={at.rect} placement="above" className="fg-rt-bubble" label={at.toolbar.label}>
      <Toolbar label={at.toolbar.label}>
        {items.map((item, i) => {
          const [pressed, disabled] = flags[i] ?? [false, false];
          return (
            <Fragment key={item.id}>
              {item.separatorBefore && i > 0 ? <ToolbarSeparator /> : null}
              <ToolbarButton
                label={item.label}
                {...(item.icon ? { icon: item.icon } : {})}
                pressed={item.active ? pressed : undefined}
                disabled={disabled}
                onClick={() => item.run?.(editor)}
              />
            </Fragment>
          );
        })}
      </Toolbar>
    </Floating>
  );
}
