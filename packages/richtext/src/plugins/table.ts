// Tables: rows of header and body cells, GFM tables in Markdown.

import { splitRow } from "../core/markdown-kit";
import type { RichNode } from "../core/types";
import { type MarkdownWriter, definePlugin } from "../core/plugin";
import { type ViewAttrs, el } from "../core/view";

const TABLE_SEP = /^ {0,3}\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)*\|?\s*$/;

const startsTable = (line: string, next: string | undefined) =>
  line.includes("|") && next !== undefined && TABLE_SEP.test(next) && next.includes("-");

function tableMd(node: RichNode, w: MarkdownWriter): string {
  const rows = (node.content ?? []).map((row) =>
    (row.content ?? []).map((cell) =>
      (cell.content ?? [])
        .map((b) => w.inline(b.content ?? [], true))
        .join("<br>")
        .replace(/\n/g, " "),
    ),
  );
  if (!rows.length) return "";
  const width = Math.max(...rows.map((r) => r.length), 1);
  const pad = (r: string[]) => Array.from({ length: width }, (_, i) => r[i] ?? "");
  const line = (r: string[]) => `| ${pad(r).join(" | ")} |`;
  const [head, ...rest] = rows as [string[], ...string[][]];
  return [
    line(head),
    `| ${Array.from({ length: width }, () => "---").join(" | ")} |`,
    ...rest.map(line),
  ].join("\n");
}

function cellAttrs(node: RichNode): ViewAttrs | undefined {
  const colspan = Number(node.attrs?.["colspan"]);
  const rowspan = Number(node.attrs?.["rowspan"]);
  const attrs: ViewAttrs = {};
  if (colspan > 1) attrs["colSpan"] = colspan;
  if (rowspan > 1) attrs["rowSpan"] = rowspan;
  return Object.keys(attrs).length ? attrs : undefined;
}

export const table = definePlugin({
  id: "table",
  name: "Table",
  description: "A grid of rows and columns with a header row; GFM tables in Markdown.",
  nodes: {
    table: {
      markdown: tableMd,
      render: (node, w) => [el("table", undefined, [el("tbody", undefined, w.children(node))])],
    },
    tableRow: {
      text: (node, w) => (node.content ?? []).map((c) => w.text(c, " ")).join("\t"),
      render: (node, w) => [el("tr", undefined, w.children(node))],
    },
    tableHeader: { render: (node, w) => [el("th", cellAttrs(node), w.children(node))] },
    tableCell: { render: (node, w) => [el("td", cellAttrs(node), w.children(node))] },
  },
  blocks: [
    {
      id: "table",
      label: "Table",
      keywords: ["grid", "rows", "columns", "cells"],
      icon: "table-01",
      group: "insert",
    },
  ],
  markdown: {
    blocks: [
      {
        id: "table",
        priority: 50,
        interrupts: (line, next) => startsTable(line, next),
        read: (lines, at, reader) => {
          const line = lines[at] as string;
          const nextLine = lines[at + 1];
          if (!startsTable(line, nextLine)) return undefined;
          const head = splitRow(line);
          const sep = splitRow(nextLine as string);
          if (head.length !== sep.length) return undefined;
          const rows: string[][] = [head];
          let i = at + 2;
          while (
            i < lines.length &&
            (lines[i] as string).trim() &&
            (lines[i] as string).includes("|")
          ) {
            rows.push(splitRow(lines[i] as string));
            i++;
          }
          const width = head.length;
          const node: RichNode = {
            type: "table",
            content: rows.map((cells, r) => ({
              type: "tableRow",
              content: Array.from({ length: width }, (_, c) => {
                const content = reader.inline((cells[c] ?? "").trim());
                return {
                  type: r === 0 ? "tableHeader" : "tableCell",
                  content: [{ type: "paragraph", ...(content.length ? { content } : {}) }],
                } as RichNode;
              }),
            })),
          };
          return { nodes: [node], next: i };
        },
      },
    ],
  },
});
