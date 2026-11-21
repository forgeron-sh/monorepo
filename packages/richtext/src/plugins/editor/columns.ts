// Columns, editor half: a `columns` node holding `column` nodes, slash entries that insert two,
// three or four, and a toolbar over the block to add or remove a column. The schema accepts any
// number of columns (two people may add one at the same time in a shared document, and the merged
// result must stay valid); the commands keep to 2 to 4. A narrow container stacks them in CSS.

import { Node, mergeAttributes } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
import { Layout2ColumnIcon, Layout3ColumnIcon } from "@forgeron/icons";
import { MAX_COLUMNS, MIN_COLUMNS, columns as columnsCore, emptyColumns } from "../columns";
import { registerBlockIcons } from "../../react/icons";
import { type BlockAction, defineEditorPlugin } from "../../tiptap/plugin";
import { ancestor } from "./layout-kit";

registerBlockIcons({ "layout-2-column": Layout2ColumnIcon, "layout-3-column": Layout3ColumnIcon });

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    columns: {
      /** Inserts a block of `count` columns (2 to 4) at the cursor. */
      insertColumns: (count: number) => ReturnType;
      /** Adds an empty column after the one the cursor is in, up to four. */
      addColumn: () => ReturnType;
      /** Removes the column the cursor is in with what it holds, down to two. */
      removeColumn: () => ReturnType;
    };
  }
}

export const ColumnNode = Node.create({
  name: "column",
  content: "block+",
  isolating: true,
  defining: true,
  parseHTML: () => [{ tag: 'div[data-type="column"]' }],
  renderHTML: ({ HTMLAttributes }) => [
    "div",
    mergeAttributes({ class: "fg-rt-column", "data-type": "column" }, HTMLAttributes),
    0,
  ],
});

export const ColumnsNode = Node.create({
  name: "columns",
  group: "block",
  content: "column+",
  isolating: true,
  defining: true,
  parseHTML: () => [{ tag: 'div[data-type="columns"]', contentElement: ".fg-rt-columns-grid" }],
  renderHTML: ({ HTMLAttributes }) => [
    "div",
    mergeAttributes({ class: "fg-rt-columns", "data-type": "columns" }, HTMLAttributes),
    ["div", { class: "fg-rt-columns-grid" }, 0],
  ],
  addCommands: () => ({
    insertColumns:
      (count) =>
      ({ tr, state, dispatch }) => {
        const { $from } = tr.selection;
        // Not inside another set of columns: they do not nest.
        for (let d = $from.depth; d > 0; d--) if ($from.node(d).type.name === "column") return true;
        if (!$from.parent.isTextblock || $from.depth < 1) return false;
        const node = state.schema.nodeFromJSON(emptyColumns(count));
        if (!dispatch) return true;
        // An empty text block is replaced; otherwise the columns come after the block.
        const replace = $from.parent.content.size === 0;
        const at = replace ? $from.before() : $from.after();
        tr.replaceWith(at, replace ? $from.after() : at, node);
        // Inside the first column: columns, column, paragraph.
        tr.setSelection(TextSelection.near(tr.doc.resolve(at + 3)));
        return true;
      },
    addColumn:
      () =>
      ({ tr, state, dispatch }) => {
        const { $from } = tr.selection;
        let column = -1;
        let group = -1;
        for (let d = $from.depth; d > 0; d--) {
          const name = $from.node(d).type.name;
          if (name === "column" && column < 0) column = d;
          if (name === "columns") {
            group = d;
            break;
          }
        }
        if (column < 0 || group < 0 || $from.node(group).childCount >= MAX_COLUMNS) return false;
        const { column: columnType, paragraph } = state.schema.nodes;
        if (!columnType || !paragraph) return false;
        if (!dispatch) return true;
        const at = $from.after(column);
        tr.insert(at, columnType.create(null, paragraph.create()));
        tr.setSelection(TextSelection.near(tr.doc.resolve(at + 2)));
        return true;
      },
    removeColumn:
      () =>
      ({ tr, dispatch }) => {
        const { $from } = tr.selection;
        let column = -1;
        for (let d = $from.depth; d > 0; d--) {
          const name = $from.node(d).type.name;
          if (name === "column" && column < 0) column = d;
          if (name === "columns") {
            if (column < 0 || $from.node(d).childCount <= MIN_COLUMNS) return false;
            if (!dispatch) return true;
            const from = $from.before(column);
            const index = $from.index(d);
            tr.delete(from, $from.after(column));
            // The caret goes to the column that took its place, the one before for the last.
            tr.setSelection(TextSelection.near(tr.doc.resolve(from), index === 0 ? 1 : -1));
            return true;
          }
        }
        return false;
      },
  }),
});

const insert = (count: number): BlockAction => ({
  apply: ({ editor, range }) => {
    const chain = editor.chain().focus();
    (range ? chain.deleteRange(range) : chain).insertColumns(count).run();
  },
  isActive: (editor) => editor.isActive("columns"),
});

export const columns = defineEditorPlugin({
  core: columnsCore,
  extensions: [ColumnNode, ColumnsNode],
  blocks: { "columns-2": insert(2), "columns-3": insert(3), "columns-4": insert(4) },
  blockToolbar: [
    {
      id: "columns",
      label: "Columns",
      node: "columns",
      items: [
        {
          id: "column-add",
          label: "+ Column",
          disabled: (e) => (ancestor(e, "columns")?.node.childCount ?? 0) >= MAX_COLUMNS,
          run: (e) => void e.chain().focus().addColumn().run(),
        },
        {
          id: "column-delete",
          label: "− Column",
          disabled: (e) => (ancestor(e, "columns")?.node.childCount ?? 0) <= MIN_COLUMNS,
          run: (e) => void e.chain().focus().removeColumn().run(),
        },
        {
          id: "delete",
          label: "Delete",
          separatorBefore: true,
          run: (e) => {
            const found = ancestor(e, "columns");
            if (!found) return;
            e.chain()
              .focus()
              .deleteRange({ from: found.pos, to: found.pos + found.node.nodeSize })
              .run();
          },
        },
      ],
    },
  ],
});
