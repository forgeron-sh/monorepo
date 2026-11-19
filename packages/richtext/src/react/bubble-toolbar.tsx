import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import { Toolbar, ToolbarButton, ToolbarSeparator } from "@forgeron/ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { safeUrl } from "../core/render";
import { Floating } from "./floating";
import { UI_ICONS } from "./icons";

export interface BubbleToolbarProps {
  editor: Editor;
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

/** `example.com` becomes `https://example.com`; a scheme that can run code gives `undefined`. */
export function normalizeLink(input: string): string | undefined {
  const value = input.trim();
  if (!value) return undefined;
  const withScheme = /^([a-z][a-z0-9+.-]*:|\/|#)/i.test(value) ? value : `https://${value}`;
  return safeUrl(withScheme);
}

/**
 * The marks of a selection, floating above it: bold, italic, underline, strike, code, link. The
 * link opens a field in place of the marks. Hidden when nothing is selected or inside code.
 */
export function BubbleToolbar({ editor }: BubbleToolbarProps) {
  const [rect, setRect] = useState<Rect | null>(null);
  const [linking, setLinking] = useState(false);
  const dragging = useRef(false);
  const linkingRef = useRef(false);
  // Set before the field takes the focus: the editor's blur event must see the link mode.
  const setLink = useCallback((on: boolean) => {
    linkingRef.current = on;
    setLinking(on);
  }, []);

  const marks = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      code: e.isActive("code"),
      link: e.isActive("link"),
      href: (e.getAttributes("link")["href"] as string | undefined) ?? "",
      inCode: e.isActive("codeBlock"),
    }),
  });

  const refresh = useCallback(() => {
    if (dragging.current || !editor.isEditable) return setRect(null);
    const focused = editor.view.hasFocus() || linkingRef.current;
    const next = focused && !editor.isActive("codeBlock") ? selectionRect(editor) : null;
    setRect(next);
    if (!next) setLink(false);
  }, [editor, setLink]);

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
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key.toLowerCase() === "k" &&
        !editor.state.selection.empty
      ) {
        e.preventDefault();
        setLink(true);
        refresh();
      }
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
  }, [editor, refresh, setLink]);

  if (!rect || marks.inCode) return null;
  const chain = () => editor.chain().focus();

  if (linking) {
    return (
      <Floating
        rect={rect}
        placement="above"
        className="fg-rt-bubble"
        keepFocus={false}
        label="Link"
      >
        <LinkField
          initial={marks.href}
          active={marks.link}
          onApply={(href) => {
            chain().extendMarkRange("link").setLink({ href }).run();
            setLink(false);
          }}
          onRemove={() => {
            chain().extendMarkRange("link").unsetLink().run();
            setLink(false);
          }}
          onCancel={() => {
            setLink(false);
            chain().run();
          }}
        />
      </Floating>
    );
  }

  return (
    <Floating rect={rect} placement="above" className="fg-rt-bubble" label="Text formatting">
      <Toolbar label="Text formatting">
        <ToolbarButton
          label="Bold"
          icon={UI_ICONS.bold}
          pressed={marks.bold}
          onClick={() => chain().toggleBold().run()}
        />
        <ToolbarButton
          label="Italic"
          icon={UI_ICONS.italic}
          pressed={marks.italic}
          onClick={() => chain().toggleItalic().run()}
        />
        <ToolbarButton
          label="Underline"
          icon={UI_ICONS.underline}
          pressed={marks.underline}
          onClick={() => chain().toggleUnderline().run()}
        />
        <ToolbarButton
          label="Strikethrough"
          icon={UI_ICONS.strike}
          pressed={marks.strike}
          onClick={() => chain().toggleStrike().run()}
        />
        <ToolbarButton
          label="Code"
          icon={UI_ICONS.code}
          pressed={marks.code}
          onClick={() => chain().toggleCode().run()}
        />
        <ToolbarSeparator />
        <ToolbarButton
          label="Link"
          icon={UI_ICONS.link}
          pressed={marks.link}
          onClick={() => setLink(true)}
        />
      </Toolbar>
    </Floating>
  );
}

interface LinkFieldProps {
  initial: string;
  active: boolean;
  onApply: (href: string) => void;
  onRemove: () => void;
  onCancel: () => void;
}

function LinkField({ initial, active, onApply, onRemove, onCancel }: LinkFieldProps) {
  const [value, setValue] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus(), []);
  const href = normalizeLink(value);
  return (
    <form
      className="fg-toolbar fg-rt-link"
      onSubmit={(e) => {
        e.preventDefault();
        if (href) onApply(href);
      }}
    >
      <input
        ref={ref}
        className="fg-input fg-rt-link-input"
        aria-label="Link address"
        placeholder="example.com"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          }
        }}
      />
      <button type="submit" className="fg-tool" disabled={!href}>
        Apply
      </button>
      {active ? (
        <button type="button" className="fg-tool" onClick={onRemove}>
          Remove
        </button>
      ) : null}
    </form>
  );
}
