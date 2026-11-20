// Table of contents, editor half: an atom block whose list follows the headings of the page as it
// is edited (also when another person edits it), and the ids that make its links work. A heading
// gets its id as a decoration derived from its text, never as an attribute: the stored JSON of the
// heading is the same with or without this plugin. The ids are the ones the static view writes.

import { type Editor, Node, mergeAttributes } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { TableOfContentsIcon } from "@forgeron/icons";
import { type TocEntry, toc as tocCore, uniqueSlugs } from "../toc";
import { registerBlockIcons } from "../../react/icons";
import { defineEditorPlugin } from "../../tiptap/plugin";
import { startChain } from "./kit";

registerBlockIcons({ "table-of-contents": TableOfContentsIcon });

interface Found extends TocEntry {
  /** Where the heading starts in the document. */
  pos: number;
}

/** The headings with text, in order, with their ids and positions. */
function headingsOf(doc: PMNode): Found[] {
  const nodes: Array<{ node: PMNode; pos: number }> = [];
  doc.descendants((node, pos) => {
    if (node.type.name === "heading") nodes.push({ node, pos });
    return node.isTextblock ? false : undefined;
  });
  const texts = nodes.map(({ node }) => node.textContent.trim());
  const ids = uniqueSlugs(texts);
  return nodes.flatMap(({ node, pos }, i) =>
    ids[i]
      ? [
          {
            id: ids[i] as string,
            level: Math.min(3, Math.max(1, Number(node.attrs["level"]) || 1)),
            text: texts[i] as string,
            pos,
          },
        ]
      : [],
  );
}

const idsKey = new PluginKey<DecorationSet>("fgRichTextHeadingIds");

function idDecorations(doc: PMNode): DecorationSet {
  return DecorationSet.create(
    doc,
    headingsOf(doc).map((h) =>
      Decoration.node(h.pos, h.pos + (doc.nodeAt(h.pos)?.nodeSize ?? 1), { id: h.id }),
    ),
  );
}

/** Moves the caret to a heading and brings it into view. */
function goTo(editor: Editor, pos: number) {
  if (editor.isEditable) {
    editor.view.dispatch(
      editor.state.tr.setSelection(TextSelection.near(editor.state.doc.resolve(pos + 1))),
    );
    editor.view.focus();
  }
  const dom = editor.view.nodeDOM(pos);
  if (dom instanceof HTMLElement) dom.scrollIntoView?.({ block: "start" });
}

export const TocNode = Node.create({
  name: "toc",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  parseHTML: () => [{ tag: "nav.fg-rt-toc" }],
  renderHTML: ({ HTMLAttributes }) => [
    "nav",
    mergeAttributes(
      { class: "fg-rt-toc", "data-type": "toc", "aria-label": "Table of contents" },
      HTMLAttributes,
    ),
  ],
  renderText: () => "",
  addProseMirrorPlugins: () => [
    new Plugin({
      key: idsKey,
      state: {
        init: (_, state) => idDecorations(state.doc),
        apply: (tr, old) => (tr.docChanged ? idDecorations(tr.doc) : old),
      },
      props: { decorations: (state) => idsKey.getState(state) ?? null },
    }),
  ],
  addNodeView() {
    return ({ editor }) => {
      const dom = document.createElement("nav");
      dom.className = "fg-rt-toc";
      dom.dataset["type"] = "toc";
      dom.contentEditable = "false";
      dom.setAttribute("aria-label", "Table of contents");
      let shown = "";
      const refresh = () => {
        const list = headingsOf(editor.state.doc);
        const signature = JSON.stringify(list.map(({ pos: _pos, ...entry }) => entry));
        // Positions move with every keystroke above: rebuild only when the list itself changed.
        if (signature === shown) return;
        shown = signature;
        dom.replaceChildren();
        if (!list.length) {
          const empty = document.createElement("p");
          empty.className = "fg-rt-toc-empty";
          empty.textContent = "No headings yet";
          dom.append(empty);
          return;
        }
        const ul = document.createElement("ul");
        for (const h of list) {
          const li = document.createElement("li");
          li.dataset["level"] = String(h.level);
          const a = document.createElement("a");
          a.href = `#${h.id}`;
          a.textContent = h.text;
          a.addEventListener("click", (event) => {
            event.preventDefault();
            // The position is read now: the document may have moved since the list was drawn.
            const now = headingsOf(editor.state.doc).find((x) => x.id === h.id);
            if (now) goTo(editor, now.pos);
          });
          li.append(a);
          ul.append(li);
        }
        dom.append(ul);
      };
      refresh();
      editor.on("update", refresh);
      return {
        dom,
        update: (next) => next.type.name === "toc",
        stopEvent: (event) => event.target instanceof HTMLAnchorElement,
        ignoreMutation: () => true,
        destroy: () => void editor.off("update", refresh),
      };
    };
  },
});

export const toc = defineEditorPlugin({
  core: tocCore,
  extensions: [TocNode],
  blocks: {
    toc: {
      apply: ({ editor, range }) => {
        // A paragraph after it: an atom at the end of the page leaves nowhere to type.
        startChain(editor, range)
          .insertContent([{ type: "toc" }, { type: "paragraph" }])
          .run();
      },
      isActive: (editor) => editor.isActive("toc"),
    },
  },
});
