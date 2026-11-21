// Lists: bullets, numbers and to-dos, nested. One plugin each; they share the list item (and read
// from one Markdown reader). `- [ ] x` is a to-do only when `taskList` is present, else a bullet.

import { indentLines } from "../core/markdown-kit";
import type { RichNode } from "../core/types";
import {
  type BlockReader,
  type MarkdownReader,
  type MarkdownWriter,
  definePlugin,
} from "../core/plugin";
import { el } from "../core/view";

const BULLET = /^( {0,3})([-*+])[ \t]+(.*)$/;
const ORDERED = /^( {0,3})(\d{1,9})([.)])[ \t]+(.*)$/;

type Kind = "bullet" | "ordered" | "task";

function listMd(node: RichNode, w: MarkdownWriter, kind: Kind): string {
  const ordered = kind === "ordered";
  const task = kind === "task";
  let n = Number(node.attrs?.["start"]) || 1;
  const items = (node.content ?? []).map((item) => {
    const marker = ordered ? `${n++}. ` : "- ";
    const check = task ? (item.attrs?.["checked"] === true ? "[x] " : "[ ] ") : "";
    const inner = (item.content ?? []).map((child) => w.block(child));
    // A paragraph then a nested list stays tight; other blocks are separated by a blank line.
    let body = "";
    inner.forEach((part, i) => {
      const prev = item.content?.[i - 1];
      const cur = item.content?.[i];
      const tight = i > 0 && cur && prev && w.isList(cur) && prev.type === "paragraph";
      body += i === 0 ? part : tight ? `\n${part}` : `\n\n${part}`;
    });
    return indentLines(`${check}${body}`, marker, " ".repeat(marker.length));
  });
  const loose = (node.content ?? []).some(
    (item) => (item.content ?? []).filter((c) => !w.isList(c)).length > 1,
  );
  return items.join(loose ? "\n\n" : "\n");
}

interface RawItem {
  lines: string[];
  width: number;
  task?: boolean;
  checked?: boolean;
}

function parseList(lines: string[], start: number, reader: MarkdownReader): [RichNode[], number] {
  const first = lines[start] as string;
  const orderedFirst = reader.has("orderedList") ? ORDERED.exec(first) : null;
  const base = (orderedFirst ? orderedFirst[1] : (BULLET.exec(first)?.[1] ?? "")) as string;
  const ordered = !!orderedFirst;
  const startNumber = orderedFirst ? Number(orderedFirst[2]) : 1;
  const tasks = reader.has("taskList");
  const bullets = reader.has("bulletList");
  const items: RawItem[] = [];
  let i = start;
  while (i < lines.length) {
    const line = lines[i] as string;
    const m = ordered ? ORDERED.exec(line) : BULLET.exec(line);
    if (m && (m[1] as string).length <= base.length + 1) {
      const content = (ordered ? m[4] : m[3]) as string;
      const task = !ordered && tasks ? /^\[([ xX])\][ \t]+(.*)$/.exec(content) : null;
      // Without `bulletList` only to-dos make a list.
      if (!ordered && !bullets && !task) break;
      items.push({
        lines: [task ? (task[2] as string) : content],
        width: ordered ? (m[2] as string).length + 2 : 2,
        ...(task ? { task: true, checked: task[1] !== " " } : {}),
      });
      i++;
      continue;
    }
    if (!line.trim()) {
      // A blank line stays in the list when an indented line or another item follows.
      let j = i;
      while (j < lines.length && !(lines[j] as string).trim()) j++;
      const after = lines[j];
      if (!items.length || after === undefined) break;
      const nextItem = ordered ? ORDERED.exec(after) : BULLET.exec(after);
      if (nextItem && (nextItem[1] as string).length <= base.length + 1) {
        i = j;
        continue;
      }
      if (/^\s{2,}\S/.test(after)) {
        (items[items.length - 1] as RawItem).lines.push("");
        i++;
        continue;
      }
      break;
    }
    // Indented text belongs to the last item: its paragraphs, a nested list, a code block.
    if (items.length && /^\s+\S/.test(line)) {
      (items[items.length - 1] as RawItem).lines.push(line);
      i++;
      continue;
    }
    break;
  }
  const lists: RichNode[] = [];
  items.forEach((item, index) => {
    const [head, ...rest] = item.lines;
    const dedented = rest.map((l) => {
      const lead = /^ */.exec(l)?.[0].length ?? 0;
      return l.slice(Math.min(item.width, lead));
    });
    const children = reader.blocks([head as string, ...dedented]);
    const content: RichNode[] =
      children[0]?.type === "paragraph" ? children : [{ type: "paragraph" }, ...children];
    const node: RichNode = item.task
      ? { type: "taskItem", attrs: { checked: !!item.checked }, content }
      : { type: "listItem", content };
    const kind = item.task ? "taskList" : ordered ? "orderedList" : "bulletList";
    const last = lists[lists.length - 1];
    if (last && last.type === kind) (last.content as RichNode[]).push(node);
    else {
      lists.push({
        type: kind,
        ...(kind === "orderedList" && startNumber !== 1 && index === 0
          ? { attrs: { start: startNumber } }
          : {}),
        content: [node],
      });
    }
  });
  return [lists, i];
}

/** Shared by the three list plugins: whichever is present reads every list kind that is present. */
const listReader: BlockReader = {
  id: "lists",
  priority: 60,
  interrupts: (line, _next, reader) =>
    ((reader.has("bulletList") || reader.has("taskList")) && BULLET.test(line)) ||
    (reader.has("orderedList") && /^ {0,3}1[.)][ \t]+/.test(line)),
  read: (lines, at, reader) => {
    const line = lines[at] as string;
    const ordered = reader.has("orderedList") && ORDERED.test(line);
    const bullet = BULLET.exec(line);
    if (!ordered) {
      if (!bullet) return undefined;
      const isTask = reader.has("taskList") && /^\[([ xX])\][ \t]+/.test(bullet[3] as string);
      if (!reader.has("bulletList") && !isTask) return undefined;
    }
    const [nodes, next] = parseList(lines, at, reader);
    return nodes.length ? { nodes, next } : undefined;
  },
};

export const listItem = definePlugin({
  id: "listItem",
  name: "List item",
  description: "The item of a bulleted or numbered list: what the list plugins hold.",
  nodes: {
    listItem: {
      fillEmpty: true,
      render: (node, w) => [el("li", undefined, w.children(node))],
    },
  },
});

export const bulletList = definePlugin({
  id: "bulletList",
  name: "Bulleted list",
  description: "A list with bullets, nested: `- item`.",
  requires: ["listItem"],
  nodes: {
    bulletList: {
      list: true,
      markdown: (node, w) => listMd(node, w, "bullet"),
      render: (node, w) => [el("ul", undefined, w.children(node))],
    },
  },
  blocks: [
    {
      id: "bullet-list",
      label: "Bulleted list",
      keywords: ["ul", "unordered", "bullets", "list"],
      icon: "left-to-right-list-bullet",
      group: "list",
      shortcut: "-",
    },
  ],
  markdown: { blocks: [listReader] },
});

export const orderedList = definePlugin({
  id: "orderedList",
  name: "Numbered list",
  description: "A numbered list, nested: `1. item`.",
  requires: ["listItem"],
  nodes: {
    orderedList: {
      list: true,
      markdown: (node, w) => listMd(node, w, "ordered"),
      render: (node, w) => {
        const start = Number(node.attrs?.["start"]);
        return [el("ol", start > 1 ? { start } : undefined, w.children(node))];
      },
    },
  },
  blocks: [
    {
      id: "ordered-list",
      label: "Numbered list",
      keywords: ["ol", "ordered", "numbers", "list"],
      icon: "list-ordered",
      group: "list",
      shortcut: "1.",
    },
  ],
  markdown: { blocks: [listReader] },
});

export const taskList = definePlugin({
  id: "taskList",
  name: "To-do list",
  description: "A checklist: `- [ ] to do`, `- [x] done`.",
  nodes: {
    taskList: {
      list: true,
      markdown: (node, w) => listMd(node, w, "task"),
      render: (node, w) => [
        el("ul", { class: "fg-rt-tasks", "data-type": "taskList" }, w.children(node)),
      ],
    },
    taskItem: {
      fillEmpty: true,
      render: (node, w) => {
        const checked = node.attrs?.["checked"] === true;
        return [
          el("li", { "data-type": "taskItem", "data-checked": checked }, [
            el("input", { type: "checkbox", disabled: true, checked, "aria-label": "Done" }),
            el("div", undefined, w.children(node)),
          ]),
        ];
      },
    },
  },
  blocks: [
    {
      id: "task-list",
      label: "To-do list",
      keywords: ["todo", "task", "checkbox", "checklist", "check"],
      icon: "check-list",
      group: "list",
      shortcut: "[ ]",
    },
  ],
  markdown: { blocks: [listReader] },
});

/** The list plugins, item first. */
export const listPlugins = [listItem, bulletList, orderedList, taskList] as const;
