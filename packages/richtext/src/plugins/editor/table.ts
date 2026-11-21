// Tables, editor half: the Tiptap table, and the toolbar over it (rows, columns, header).

import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import { table as tableCore } from "../table";
import { defineEditorPlugin } from "../../tiptap/plugin";
import { startChain } from "./kit";

export const table = defineEditorPlugin({
  core: tableCore,
  extensions: [Table.configure({ resizable: false }), TableRow, TableHeader, TableCell],
  blocks: {
    table: {
      apply: ({ editor, range }) =>
        void startChain(editor, range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    },
  },
  blockToolbar: [
    {
      id: "table",
      label: "Table",
      node: "table",
      items: [
        { id: "row-add", label: "+ Row", run: (e) => void e.chain().focus().addRowAfter().run() },
        {
          id: "col-add",
          label: "+ Col",
          run: (e) => void e.chain().focus().addColumnAfter().run(),
        },
        {
          id: "row-delete",
          label: "− Row",
          separatorBefore: true,
          disabled: (e) => !e.can().deleteRow(),
          run: (e) => void e.chain().focus().deleteRow().run(),
        },
        {
          id: "col-delete",
          label: "− Col",
          disabled: (e) => !e.can().deleteColumn(),
          run: (e) => void e.chain().focus().deleteColumn().run(),
        },
        {
          id: "header",
          label: "Header",
          separatorBefore: true,
          active: (e) => e.isActive("tableHeader"),
          run: (e) => void e.chain().focus().toggleHeaderRow().run(),
        },
        { id: "delete", label: "Delete", run: (e) => void e.chain().focus().deleteTable().run() },
      ],
    },
  ],
});
