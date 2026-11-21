// Toggle, editor half: a collapsible block, a summary line and the blocks it hides. The node view
// draws the chevron and hides the blocks when the toggle is closed. `open` is an attribute of the
// node, so with collaboration everyone sees the toggle open or closed together; in a read-only
// editor the chevron only changes this editor's own view and the document is not touched.

import { Node, mergeAttributes } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import { TextSelection } from "@tiptap/pm/state";
import { ListCollapseIcon } from "@forgeron/icons";
import { toggle as toggleCore } from "../toggle";
import { registerBlockIcons } from "../../react/icons";
import { defineEditorPlugin } from "../../tiptap/plugin";
import { ancestor } from "./layout-kit";

registerBlockIcons({ "list-collapse": ListCollapseIcon });

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    toggle: {
      /** Turns the text block under the cursor into a toggle whose summary is its text. */
      setToggle: () => ReturnType;
      /** Opens or closes the toggle the cursor is in; `open` forces a state. */
      toggleOpen: (open?: boolean) => ReturnType;
    };
  }
}

export const ToggleSummary = Node.create({
  name: "toggleSummary",
  content: "inline*",
  defining: true,
  parseHTML: () => [{ tag: "summary" }, { tag: "div.fg-rt-toggle-summary" }],
  renderHTML: ({ HTMLAttributes }) => [
    "div",
    mergeAttributes({ class: "fg-rt-toggle-summary" }, HTMLAttributes),
    0,
  ],
});

export const ToggleNode = Node.create({
  name: "toggle",
  group: "block",
  content: "toggleSummary block*",
  defining: true,
  addAttributes: () => ({
    open: {
      default: false,
      parseHTML: (el) => el.hasAttribute("open") || el.getAttribute("data-open") === "true",
      renderHTML: (attrs) => ({ "data-open": attrs["open"] ? "true" : "false" }),
    },
  }),
  parseHTML: () => [
    { tag: 'div[data-type="toggle"]', contentElement: "div.fg-rt-toggle-content" },
    { tag: "details" },
  ],
  renderHTML: ({ HTMLAttributes }) => [
    "div",
    mergeAttributes({ class: "fg-rt-toggle", "data-type": "toggle" }, HTMLAttributes),
    ["span", { class: "fg-rt-toggle-btn", contenteditable: "false" }],
    ["div", { class: "fg-rt-toggle-content" }, 0],
  ],
  addNodeView() {
    return ({ node, editor, getPos }) => {
      const dom = document.createElement("div");
      dom.className = "fg-rt-toggle";
      dom.dataset["type"] = "toggle";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "fg-rt-toggle-btn";
      button.contentEditable = "false";
      const content = document.createElement("div");
      content.className = "fg-rt-toggle-content";
      dom.append(button, content);

      let current: PMNode = node;
      // Only a read-only editor keeps its own state: the document is not ours to change there.
      let local: boolean | undefined;
      const isOpen = () => local ?? current.attrs["open"] === true;
      const sync = () => {
        const open = isOpen();
        dom.dataset["open"] = String(open);
        button.setAttribute("aria-expanded", String(open));
        button.setAttribute("aria-label", open ? "Collapse" : "Expand");
      };
      sync();

      // The caret must stay where it is: the button is not a place to type.
      button.addEventListener("mousedown", (event) => event.preventDefault());
      button.addEventListener("click", () => {
        const pos = typeof getPos === "function" ? getPos() : undefined;
        if (!editor.isEditable || pos === undefined) {
          local = !isOpen();
          sync();
          return;
        }
        const open = !isOpen();
        const { tr } = editor.state;
        tr.setNodeMarkup(pos, undefined, { ...current.attrs, open });
        // A caret inside what is about to be hidden goes to the end of the summary.
        const { from } = editor.state.selection;
        const summaryEnd = pos + 1 + (current.firstChild?.nodeSize ?? 0) - 1;
        if (!open && from > summaryEnd) {
          tr.setSelection(TextSelection.create(tr.doc, summaryEnd));
        }
        // Whether a toggle is open is not an edit to undo.
        tr.setMeta("addToHistory", false);
        editor.view.dispatch(tr);
      });

      return {
        dom,
        contentDOM: content,
        update(next) {
          if (next.type !== current.type) return false;
          if (next.attrs["open"] !== current.attrs["open"]) local = undefined;
          current = next;
          sync();
          return true;
        },
        ignoreMutation: (mutation) =>
          mutation.type !== "selection" && !content.contains(mutation.target),
      };
    };
  },
  addCommands: () => ({
    setToggle:
      () =>
      ({ tr, state, dispatch }) => {
        const { $from } = tr.selection;
        const block = $from.parent;
        if (!block.isTextblock || $from.depth < 1) return false;
        const { toggle, toggleSummary, paragraph } = state.schema.nodes;
        if (!toggle || !toggleSummary || !paragraph) return false;
        const start = $from.before();
        const summary = toggleSummary.create(null, block.content);
        const node = toggle.create({ open: true }, [summary, paragraph.create()]);
        if (!dispatch) return true;
        tr.replaceWith(start, $from.after(), node);
        // The caret goes to the end of the summary: toggle open, summary open, its text.
        tr.setSelection(TextSelection.near(tr.doc.resolve(start + 2 + summary.content.size)));
        return true;
      },
    toggleOpen:
      (open) =>
      ({ tr }) => {
        const { $from } = tr.selection;
        for (let depth = $from.depth; depth > 0; depth--) {
          const node = $from.node(depth);
          if (node.type.name !== "toggle") continue;
          tr.setNodeMarkup($from.before(depth), undefined, {
            ...node.attrs,
            open: open ?? !node.attrs["open"],
          });
          return true;
        }
        return false;
      },
  }),
  addKeyboardShortcuts() {
    return {
      // Enter in the summary: what follows the caret moves into the first block, opened.
      Enter: ({ editor }) => {
        const { $from, empty } = editor.state.selection;
        if (!empty || $from.parent.type.name !== "toggleSummary") return false;
        const toggleDepth = $from.depth - 1;
        const toggle = $from.node(toggleDepth);
        const tail = $from.parent.content.cut($from.parentOffset);
        const paragraph = editor.schema.nodes["paragraph"];
        if (!paragraph) return false;
        const { tr } = editor.state;
        const after = $from.after();
        // After the summary: a new first paragraph with the tail, or the first block as it is.
        tr.insert(after, paragraph.create(null, tail));
        tr.delete($from.pos, $from.end());
        tr.setNodeMarkup($from.before(toggleDepth), undefined, { ...toggle.attrs, open: true });
        tr.setSelection(TextSelection.near(tr.doc.resolve($from.pos + 2)));
        editor.view.dispatch(tr.scrollIntoView());
        return true;
      },
      // Backspace at the start of the summary: the toggle goes back to a paragraph and its blocks.
      Backspace: ({ editor }) => {
        const { $from, empty } = editor.state.selection;
        if (!empty || $from.parent.type.name !== "toggleSummary" || $from.parentOffset !== 0) {
          return false;
        }
        const found = ancestor(editor, "toggle");
        const paragraph = editor.schema.nodes["paragraph"];
        if (!found || !paragraph) return false;
        const kids: PMNode[] = [];
        found.node.forEach((child) => void kids.push(child));
        const [summary, ...rest] = kids;
        if (!summary) return false;
        const { tr } = editor.state;
        tr.replaceWith(found.pos, found.pos + found.node.nodeSize, [
          paragraph.create(null, summary.content),
          ...rest,
        ]);
        tr.setSelection(TextSelection.near(tr.doc.resolve(found.pos + 1)));
        editor.view.dispatch(tr.scrollIntoView());
        return true;
      },
    };
  },
});

export const toggle = defineEditorPlugin({
  core: toggleCore,
  extensions: [ToggleSummary, ToggleNode],
  blocks: {
    toggle: {
      apply: ({ editor, range }) => {
        const chain = editor.chain().focus();
        (range ? chain.deleteRange(range) : chain).setToggle().run();
      },
      isActive: (editor) => editor.isActive("toggle"),
    },
  },
});
