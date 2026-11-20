// Footnotes, editor half: an inline node that holds its note, a marker numbered by CSS counters (so
// inserting a footnote renumbers the others with no code), the note opened under the marker while
// the caret is in it, and a numbered list of every note at the foot of the page.
//
// No React and no stored number: the numbers are the order of the markers in the document.

import { Node, mergeAttributes } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import { type EditorState, Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import { Decoration, DecorationSet, type EditorView } from "@tiptap/pm/view";
import { footnote as footnoteCore } from "../footnote";
import { defineEditorPlugin } from "../../tiptap/plugin";
import { startChain } from "./kit";

const key = new PluginKey<State>("fgFootnote");

interface Note {
  pos: number;
  node: PMNode;
}

interface State {
  notes: ReadonlyArray<Note>;
  decorations: DecorationSet;
}

const collect = (doc: PMNode): Note[] => {
  const notes: Note[] = [];
  doc.descendants((node, pos) => {
    if (node.type.name === "footnote") {
      notes.push({ pos, node });
      return false;
    }
    return true;
  });
  return notes;
};

/** The footnote node the caret is in, if any. */
function openNote(state: Pick<EditorState, "selection">) {
  const { $from } = state.selection;
  for (let depth = $from.depth; depth > 0; depth--) {
    if ($from.node(depth).type.name === "footnote") return { pos: $from.before(depth), depth };
  }
  const selected = (state.selection as { node?: PMNode }).node;
  if (selected?.type.name === "footnote") return { pos: $from.pos, depth: -1 };
  return undefined;
}

function footer(view: EditorView, notes: ReadonlyArray<Note>): HTMLElement {
  const section = document.createElement("section");
  section.className = "fg-rt-footnotes";
  section.contentEditable = "false";
  section.setAttribute("aria-label", "Footnotes");
  const list = document.createElement("ol");
  for (const note of notes) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "fg-rt-fn-item";
    const text = note.node.textContent;
    button.textContent = text || "Empty note";
    if (!text) button.classList.add("fg-rt-fn-empty");
    button.addEventListener("mousedown", (event) => event.preventDefault());
    button.addEventListener("click", () => {
      const id = note.node.attrs["id"];
      let pos = note.pos;
      // Positions are those of the last build; fall back to the id if the document moved.
      if (view.state.doc.nodeAt(pos)?.attrs["id"] !== id) {
        const found = collect(view.state.doc).find((n) => n.node.attrs["id"] === id);
        if (!found) return;
        pos = found.pos;
      }
      const target = view.state.doc.nodeAt(pos);
      if (!target) return;
      const inside = pos + 1 + target.content.size;
      view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, inside)));
      view.focus();
    });
    item.append(button);
    list.append(item);
  }
  section.append(list);
  return section;
}

function decorate(
  state: Pick<EditorState, "doc" | "selection">,
  notes: ReadonlyArray<Note>,
): DecorationSet {
  const decorations: Decoration[] = [];
  const open = openNote(state);
  if (open) {
    const node = state.doc.nodeAt(open.pos);
    if (node) {
      decorations.push(
        Decoration.node(open.pos, open.pos + node.nodeSize, { class: "fg-rt-fn-open" }),
      );
    }
  }
  if (notes.length) {
    const signature = notes
      .map((n) => `${n.pos}:${String(n.node.attrs["id"])}:${n.node.textContent}`)
      .join("|");
    decorations.push(
      Decoration.widget(state.doc.content.size, (v) => footer(v, notes), {
        side: 1,
        key: `fn:${signature}`,
        stopEvent: () => true,
        ignoreSelection: true,
      }),
    );
  }
  return DecorationSet.create(state.doc, decorations);
}

const Footnote = Node.create({
  name: "footnote",
  group: "inline",
  inline: true,
  content: "text*",
  isolating: true,
  selectable: true,
  // Above the core's Enter and Backspace, which would split the paragraph or join backwards.
  priority: 1000,
  addAttributes: () => ({
    id: {
      default: null,
      parseHTML: (e) => e.getAttribute("data-id"),
      renderHTML: (attrs) => (attrs["id"] ? { "data-id": String(attrs["id"]) } : {}),
    },
  }),
  parseHTML: () => [{ tag: 'span[data-type="footnote"]', contentElement: ".fg-rt-fn-body" }],
  renderHTML: ({ HTMLAttributes }) => [
    "span",
    mergeAttributes({ "data-type": "footnote", class: "fg-rt-footnote" }, HTMLAttributes),
    ["sup", { class: "fg-rt-fn-mark", contenteditable: "false" }],
    ["span", { class: "fg-rt-fn-body" }, 0],
  ],
  renderText: () => "",
  addKeyboardShortcuts() {
    const leave = () => {
      const open = openNote(this.editor.state);
      if (!open || open.depth < 0) return false;
      const node = this.editor.state.doc.nodeAt(open.pos);
      if (!node) return false;
      return this.editor.commands.setTextSelection(open.pos + node.nodeSize);
    };
    return {
      Enter: leave,
      Escape: leave,
      // Backspace in an empty note removes the footnote.
      Backspace: () => {
        const { selection } = this.editor.state;
        const { $from } = selection;
        if (!selection.empty || $from.parent.type.name !== "footnote") return false;
        if ($from.parent.content.size > 0) return false;
        return this.editor.chain().deleteRange({ from: $from.before(), to: $from.after() }).run();
      },
    };
  },
  addProseMirrorPlugins() {
    return [
      new Plugin<State>({
        key,
        state: {
          init: (_, state) => {
            const notes = collect(state.doc);
            return { notes, decorations: decorate(state, notes) };
          },
          apply(tr, old, _prev, next) {
            if (!tr.docChanged && !tr.selectionSet) return old;
            const notes = tr.docChanged ? collect(next.doc) : old.notes;
            return { notes, decorations: decorate(next, notes) };
          },
        },
        props: {
          decorations: (state) => key.getState(state)?.decorations ?? null,
          handleDOMEvents: {
            // Clicking a marker opens its note, with the caret at its end.
            click: (view, event) => {
              const target = event.target as Element | null;
              const mark = target?.closest?.(".fg-rt-fn-mark");
              if (!mark || !view.editable) return false;
              const body = mark.parentElement?.querySelector(".fg-rt-fn-body");
              if (!body) return false;
              const start = view.posAtDOM(body, 0);
              const node = view.state.doc.nodeAt(start - 1);
              const end = start + (node?.content.size ?? 0);
              view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, end)));
              view.focus();
              return true;
            },
          },
        },
      }),
    ];
  },
});

const newId = (doc: PMNode) => {
  const taken = new Set(collect(doc).map((n) => String(n.node.attrs["id"])));
  let id = "";
  do id = Math.random().toString(36).slice(2, 8);
  while (!id || taken.has(id));
  return id;
};

export const footnote = defineEditorPlugin({
  core: footnoteCore,
  extensions: [Footnote],
  blocks: {
    footnote: {
      apply: ({ editor, range }) => {
        const id = newId(editor.state.doc);
        startChain(editor, range).insertContent({ type: "footnote", attrs: { id } }).run();
        // The caret goes inside the new note, which opens under its marker.
        const found = collect(editor.state.doc).find((n) => n.node.attrs["id"] === id);
        if (found) editor.commands.setTextSelection(found.pos + 1);
      },
      isActive: (editor) => editor.isActive("footnote"),
    },
  },
});
