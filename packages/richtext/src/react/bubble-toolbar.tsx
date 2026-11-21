import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import { Toolbar, ToolbarButton, ToolbarSeparator } from "@forgeron/ui";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import type { FieldPanel, ToolbarItem } from "../tiptap/plugin";
import { Floating } from "./floating";

export { normalizeLink } from "../core/view";

export interface BubbleToolbarProps {
  editor: Editor;
  /** What the plugins put in the `bubble` slot, left to right. */
  items: ReadonlyArray<ToolbarItem>;
}

type Rect = { left: number; right: number; top: number; bottom: number };

/** The viewport box of the selection, or `null` when there is nothing to show a toolbar for. */
function selectionRect(editor: Editor): Rect | null {
  const { from, to, empty } = editor.state.selection;
  if (empty) return null;
  try {
    const a = editor.view.coordsAtPos(from);
    const b = editor.view.coordsAtPos(to);
    return {
      left: Math.min(a.left, b.left),
      right: Math.max(a.right, b.right),
      top: Math.min(a.top, b.top),
      bottom: Math.max(a.bottom, b.bottom),
    };
  } catch {
    return null;
  }
}

/** Is the selection inside a node that holds code (a code block)? The toolbar stays away. */
const inCode = (editor: Editor) => editor.state.selection.$from.parent.type.spec.code === true;

const matchesShortcut = (shortcut: string, e: KeyboardEvent) => {
  const key = shortcut.split("+").pop()?.toLowerCase();
  return (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === key;
};

/**
 * The buttons the plugins contribute, floating above a selection (marks, link...). An item with a
 * `field` opens a small form in place of the buttons. Hidden when nothing is selected or inside
 * code.
 */
export function BubbleToolbar({ editor, items }: BubbleToolbarProps) {
  const [rect, setRect] = useState<Rect | null>(null);
  const [panel, setPanel] = useState<string | null>(null);
  const dragging = useRef(false);
  const panelRef = useRef<string | null>(null);
  // Set before the field takes the focus: the editor's blur event must see the panel.
  const openPanel = useCallback((id: string | null) => {
    panelRef.current = id;
    setPanel(id);
  }, []);

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      flags: items.map((i) => [!!i.active?.(e), !!i.disabled?.(e)] as const),
      inCode: inCode(e),
    }),
  });

  const refresh = useCallback(() => {
    if (dragging.current || !editor.isEditable) return setRect(null);
    const focused = editor.view.hasFocus() || panelRef.current !== null;
    const next = focused && !inCode(editor) ? selectionRect(editor) : null;
    setRect(next);
    if (!next) openPanel(null);
  }, [editor, openPanel]);

  useEffect(() => {
    const dom = editor.view.dom;
    const down = () => {
      dragging.current = true;
      setRect(null);
    };
    const up = () => {
      if (!dragging.current) return;
      dragging.current = false;
      refresh();
    };
    const key = (e: KeyboardEvent) => {
      if (editor.state.selection.empty) return;
      const item = items.find((i) => i.shortcut && matchesShortcut(i.shortcut, e));
      if (!item) return;
      e.preventDefault();
      if (item.field) {
        openPanel(item.id);
        refresh();
      } else item.run?.(editor);
    };
    editor.on("selectionUpdate", refresh);
    editor.on("focus", refresh);
    editor.on("blur", refresh);
    editor.on("update", refresh);
    dom.addEventListener("mousedown", down);
    dom.addEventListener("keydown", key);
    document.addEventListener("mouseup", up);
    window.addEventListener("scroll", refresh, true);
    window.addEventListener("resize", refresh);
    return () => {
      editor.off("selectionUpdate", refresh);
      editor.off("focus", refresh);
      editor.off("blur", refresh);
      editor.off("update", refresh);
      dom.removeEventListener("mousedown", down);
      dom.removeEventListener("keydown", key);
      document.removeEventListener("mouseup", up);
      window.removeEventListener("scroll", refresh, true);
      window.removeEventListener("resize", refresh);
    };
  }, [editor, items, refresh, openPanel]);

  if (!rect || state.inCode || items.length === 0) return null;

  const field = panel ? items.find((i) => i.id === panel)?.field : undefined;
  if (field) {
    return (
      <Floating
        rect={rect}
        placement="above"
        className="fg-rt-bubble"
        keepFocus={false}
        label={field.label}
      >
        <FieldForm
          editor={editor}
          field={field}
          onDone={() => openPanel(null)}
          onCancel={() => {
            openPanel(null);
            editor.chain().run();
          }}
        />
      </Floating>
    );
  }

  return (
    <Floating rect={rect} placement="above" className="fg-rt-bubble" label="Text formatting">
      <Toolbar label="Text formatting">
        {items.map((item, i) => {
          const [pressed, disabled] = state.flags[i] ?? [false, false];
          return (
            <Fragment key={item.id}>
              {item.separatorBefore && i > 0 ? <ToolbarSeparator /> : null}
              <ToolbarButton
                label={item.label}
                {...(item.icon ? { icon: item.icon } : {})}
                pressed={pressed}
                disabled={disabled}
                onClick={() => (item.field ? openPanel(item.id) : item.run?.(editor))}
              />
            </Fragment>
          );
        })}
      </Toolbar>
    </Floating>
  );
}

interface FieldFormProps {
  editor: Editor;
  field: FieldPanel;
  onDone: () => void;
  onCancel: () => void;
}

function FieldForm({ editor, field, onDone, onCancel }: FieldFormProps) {
  const [value, setValue] = useState(() => field.initial(editor));
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus(), []);
  const parsed = field.parse(value);
  const active = field.isActive?.(editor) ?? false;
  return (
    <form
      className="fg-toolbar fg-rt-link"
      onSubmit={(e) => {
        e.preventDefault();
        if (parsed === undefined) return;
        field.apply(editor, parsed);
        onDone();
      }}
    >
      <input
        ref={ref}
        className="fg-input fg-rt-link-input"
        aria-label={field.label}
        placeholder={field.placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          }
        }}
      />
      <button type="submit" className="fg-tool" disabled={parsed === undefined}>
        Apply
      </button>
      {active && field.remove ? (
        <button
          type="button"
          className="fg-tool"
          onClick={() => {
            field.remove?.(editor);
            onDone();
          }}
        >
          Remove
        </button>
      ) : null}
    </form>
  );
}
