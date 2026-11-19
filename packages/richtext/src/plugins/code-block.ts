// Fenced code blocks: a language and some text, between ``` fences in Markdown.

import type { RichNode } from "../core/types";
import { definePlugin } from "../core/plugin";
import { el, str } from "../core/view";

const FENCE = /^ {0,3}(`{3,}|~{3,})\s*([^`\s]*)\s*$/;

const codeOf = (content: ReadonlyArray<{ text?: string }> | undefined) =>
  (content ?? []).map((c) => c.text ?? "").join("");

export const codeBlock = definePlugin({
  id: "codeBlock",
  name: "Code block",
  description: "A block of code with an optional language, between fences.",
  nodes: {
    codeBlock: {
      markdown: (node) => {
        const code = codeOf(node.content);
        const longest = Math.max(2, ...(code.match(/^`{3,}/gm) ?? []).map((r) => r.length));
        const fence = "`".repeat(longest + 1);
        const lang = node.attrs?.["language"] ? String(node.attrs["language"]) : "";
        return `${fence}${lang}\n${code}\n${fence}`;
      },
      render: (node) => {
        const language = str(node.attrs?.["language"]);
        return [
          el("pre", { class: "fg-rt-code" }, [
            el("code", language ? { "data-language": language } : undefined, [
              codeOf(node.content),
            ]),
          ]),
        ];
      },
    },
  },
  blocks: [
    {
      id: "code-block",
      label: "Code",
      keywords: ["pre", "snippet", "source", "fence"],
      icon: "code-xml",
      group: "text",
      shortcut: "```",
    },
  ],
  markdown: {
    blocks: [
      {
        id: "codeBlock",
        priority: 100,
        interrupts: (line) => FENCE.test(line),
        read: (lines, at) => {
          const fence = FENCE.exec(lines[at] as string);
          if (!fence) return undefined;
          const mark = (fence[1] as string)[0] as string;
          const size = (fence[1] as string).length;
          const closer = new RegExp(`^ {0,3}${mark}{${size},}\\s*$`);
          const body: string[] = [];
          let i = at + 1;
          while (i < lines.length && !closer.test(lines[i] as string)) {
            body.push(lines[i] as string);
            i++;
          }
          const node: RichNode = { type: "codeBlock" };
          if (fence[2]) node.attrs = { language: fence[2] };
          if (body.length) node.content = [{ type: "text", text: body.join("\n") }];
          return { nodes: [node], next: i + 1 };
        },
      },
    ],
  },
});
