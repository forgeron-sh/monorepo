// Toggle, core half: a collapsible block, a summary line and the blocks it hides. The open state is
// an attribute of the node, so it is part of the document (and shared between collaborators).
// Markdown is the HTML every Markdown reader already knows: `<details><summary>`; the static view
// is the same element, so a read-only page collapses with no script.

import type { RichNode } from "../core/types";
import { definePlugin } from "../core/plugin";
import { el } from "../core/view";

const OPEN_TAG = /^ {0,3}<details(\s+open)?\s*>[ \t]*(.*)$/i;
const SUMMARY = /^\s*<summary>(.*?)<\/summary>\s*$/i;
const CLOSE_TAG = /^\s*<\/details>\s*$/i;

/** Whether a toggle node is open. */
export const isToggleOpen = (node: RichNode): boolean => node.attrs?.["open"] === true;

export const toggle = definePlugin({
  id: "toggle",
  name: "Toggle",
  description:
    "A collapsible block: a summary line and the blocks it hides, `<details><summary>` in Markdown.",
  nodes: {
    toggle: {
      markdown: (node, w) => {
        const [first, ...rest] = node.content ?? [];
        const hasSummary = first?.type === "toggleSummary";
        const summary = hasSummary
          ? w
              .inline(first.content ?? [])
              .replace(/\n/g, " ")
              .replace(/<\/summary>/gi, "<\\/summary>")
          : "";
        const body = w.blocks(hasSummary ? rest : (node.content ?? []));
        const open = isToggleOpen(node) ? " open" : "";
        return `<details${open}>\n<summary>${summary}</summary>\n${body ? `\n${body}\n\n` : ""}</details>`;
      },
      render: (node, w) => {
        const [first, ...rest] = node.content ?? [];
        const hasSummary = first?.type === "toggleSummary";
        const body = hasSummary ? rest : (node.content ?? []);
        return [
          el("details", { class: "fg-rt-toggle", open: isToggleOpen(node) }, [
            ...(hasSummary ? w.children({ ...node, content: [first] }) : [el("summary")]),
            el("div", { class: "fg-rt-toggle-body" }, w.children({ ...node, content: body })),
          ]),
        ];
      },
    },
    toggleSummary: {
      render: (node, w) => [el("summary", undefined, w.children(node))],
    },
  },
  blocks: [
    {
      id: "toggle",
      label: "Toggle",
      keywords: ["collapse", "collapsible", "details", "expand", "fold", "accordion", "summary"],
      icon: "list-collapse",
      group: "text",
    },
  ],
  markdown: {
    blocks: [
      {
        id: "toggle",
        priority: 80,
        interrupts: (line) => OPEN_TAG.test(line),
        read: (lines, at, reader) => {
          const head = OPEN_TAG.exec(lines[at] as string);
          if (!head) return undefined;
          let summary = "";
          let i = at + 1;
          // The summary is on the opening line (`<details><summary>x</summary>`) or the next one.
          const sameLine = SUMMARY.exec(head[2] as string);
          if (sameLine) summary = sameLine[1] as string;
          else if ((head[2] as string).trim()) return undefined;
          else {
            const next = SUMMARY.exec(lines[i] ?? "");
            if (next) {
              summary = next[1] as string;
              i++;
            }
          }
          const inner: string[] = [];
          let depth = 1;
          for (; i < lines.length; i++) {
            const line = lines[i] as string;
            if (OPEN_TAG.test(line)) depth++;
            else if (CLOSE_TAG.test(line) && --depth === 0) break;
            inner.push(line);
          }
          // No closing tag: not a toggle, the lines stay what they are (text).
          if (depth !== 0) return undefined;
          const content = reader.blocks(inner);
          const text = reader.inline(summary.replace(/<\\\/summary>/gi, "</summary>").trim());
          return {
            nodes: [
              {
                type: "toggle",
                attrs: { open: !!head[1] },
                content: [
                  { type: "toggleSummary", ...(text.length ? { content: text } : {}) },
                  ...content,
                ],
              },
            ],
            next: i + 1,
          };
        },
      },
    ],
  },
});
