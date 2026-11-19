import type { Editor } from "@tiptap/core";
import { Toolbar, ToolbarButton, ToolbarSeparator } from "@forgeron/ui";
import { useEditorState } from "@tiptap/react";
import { useCallback, useEffect, useState } from "react";
import { Floating } from "./floating";

export interface TableToolbarProps {
  editor: Editor;
}

type Rect = { left: number; right: number; top: number; bottom: number };

function tableRect(editor: Editor): Rect | null {
  if (!editor.isActive("table") || !editor.isEditable) return null;
  const at = editor.view.domAtPos(editor.state.selection.from).node;
  const el = at instanceof Element ? at : at.parentElement;
  const table = el?.closest("table");
  if (!table) return null;
  const r = table.getBoundingClientRect();
  return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
}

/** Rows and columns of the table the cursor is in: shown above it, like the marks above a selection. */
export function TableToolbar({ editor }: TableToolbarProps) {
  const [rect, setRect] = useState<Rect | null>(null);
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      header: e.isActive("tableHeader"),
      canDeleteRow: e.can().deleteRow(),
      canDeleteCol: e.can().deleteColumn(),
    }),
  });
  const refresh = useCallback(() => setRect(tableRect(editor)), [editor]);
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
  if (!rect || !editor.view.hasFocus()) return null;
  const chain = () => editor.chain().focus();
  return (
    <Floating rect={rect} placement="above" className="fg-rt-bubble" label="Table">
      <Toolbar label="Table">
        <ToolbarButton label="+ Row" onClick={() => chain().addRowAfter().run()} />
        <ToolbarButton label="+ Col" onClick={() => chain().addColumnAfter().run()} />
        <ToolbarSeparator />
        <ToolbarButton
          label="− Row"
          disabled={!state.canDeleteRow}
          onClick={() => chain().deleteRow().run()}
        />
        <ToolbarButton
          label="− Col"
          disabled={!state.canDeleteCol}
          onClick={() => chain().deleteColumn().run()}
        />
        <ToolbarSeparator />
        <ToolbarButton
          label="Header"
          pressed={state.header}
          onClick={() => chain().toggleHeaderRow().run()}
        />
        <ToolbarButton label="Delete" onClick={() => chain().deleteTable().run()} />
      </Toolbar>
    </Floating>
  );
}
