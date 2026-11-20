// Callout, core half: a highlighted block with a tone and rich blocks inside. In Markdown it is the
// alert syntax of GitHub and Obsidian, `> [!NOTE]` followed by quoted lines: every other reader
// shows a plain quote with the tag on its first line, so the content stays readable, and with the
// quote plugin missing this plugin reads those lines itself.

import type { RichNode } from "../core/types";
import { definePlugin } from "../core/plugin";
import { el } from "../core/view";

export const CALLOUT_TONES = ["note", "info", "success", "warning", "danger"] as const;
export type CalloutTone = (typeof CALLOUT_TONES)[number];

export const DEFAULT_CALLOUT_TONE: CalloutTone = "note";

/** The tone of a callout node, `note` when the attribute is missing or unknown. */
export function calloutTone(node: RichNode): CalloutTone {
  const tone = node.attrs?.["tone"];
  return CALLOUT_TONES.find((t) => t === tone) ?? DEFAULT_CALLOUT_TONE;
}

/** The emoji icon of a callout node, when it has one (otherwise the tone draws its own). */
export function calloutIcon(node: RichNode): string | undefined {
  const icon = node.attrs?.["icon"];
  return typeof icon === "string" && icon.trim() ? icon.trim() : undefined;
}

/** The other names GitHub gives its alerts, read as the tone closest in meaning. */
const ALIASES: Readonly<Record<string, CalloutTone>> = {
  tip: "success",
  important: "info",
  caution: "danger",
};

const MARKER = /^ {0,3}> ?\[!([A-Za-z]+)\][ \t]*(.*?)[ \t]*$/;
const QUOTE = /^ {0,3}>/;

const toneOfName = (name: string): CalloutTone | undefined => {
  const lower = name.toLowerCase();
  return CALLOUT_TONES.find((t) => t === lower) ?? ALIASES[lower];
};

const startsCallout = (line: string) => {
  const m = MARKER.exec(line);
  return m !== null && toneOfName(m[1] as string) !== undefined;
};

/** A short run with no letter or digit is an icon; anything else after the tag is text. */
const isIcon = (text: string) =>
  text.length > 0 && Array.from(text).length <= 8 && !/[\p{L}\p{N}]/u.test(text);

export const callout = definePlugin({
  id: "callout",
  name: "Callout",
  description:
    "A highlighted block with a tone (note, info, success, warning, danger) and an optional emoji icon, holding other blocks: `> [!NOTE]`.",
  nodes: {
    callout: {
      markdown: (node, w) => {
        const icon = calloutIcon(node);
        const head = `> [!${calloutTone(node).toUpperCase()}]${icon ? ` ${icon}` : ""}`;
        const body = w
          .blocks(node.content ?? [])
          .split("\n")
          .map((line) => (line ? `> ${line}` : ">"));
        return node.content?.length ? [head, ...body].join("\n") : head;
      },
      render: (node, w) => {
        const icon = calloutIcon(node);
        return [
          el("aside", { class: "fg-rt-callout", "data-tone": calloutTone(node), role: "note" }, [
            el("span", { class: "fg-rt-callout-icon", "aria-hidden": "true" }, icon ? [icon] : []),
            el("div", { class: "fg-rt-callout-body" }, w.children(node)),
          ]),
        ];
      },
    },
  },
  blocks: [
    {
      id: "callout",
      label: "Callout",
      keywords: ["note", "info", "warning", "alert", "admonition", "aside", "box", "tip"],
      icon: "information-circle",
      group: "text",
    },
  ],
  markdown: {
    blocks: [
      {
        id: "callout",
        // Above the quote reader: the same lines are a quote when this plugin is not there.
        priority: 75,
        interrupts: (line) => startsCallout(line),
        read: (lines, at, reader) => {
          const head = MARKER.exec(lines[at] as string);
          const tone = head ? toneOfName(head[1] as string) : undefined;
          if (!head || !tone) return undefined;
          const rest = head[2] as string;
          const inner: string[] = [];
          let i = at + 1;
          while (i < lines.length && QUOTE.test(lines[i] as string)) {
            inner.push((lines[i] as string).replace(/^ {0,3}> ?/, ""));
            i++;
          }
          const icon = isIcon(rest) ? rest : undefined;
          // Text after the tag is not an icon: it stays, as the first paragraph.
          const lead = rest && !icon ? [rest, ""] : [];
          const content = reader.blocks([...lead, ...inner]);
          return {
            nodes: [
              {
                type: "callout",
                attrs: { tone, ...(icon ? { icon } : {}) },
                content: content.length ? content : [{ type: "paragraph" }],
              },
            ],
            next: i,
          };
        },
      },
    ],
  },
});
