// The marks: bold, italic, underline, strike, code and link. One plugin each, so an editor can
// take the ones it wants. `markPlugins` lists them in the order the bubble toolbar shows them.

import { closingBracket, codeSpan, destination, escapeUrl, textNode } from "../core/markdown-kit";
import { definePlugin } from "../core/plugin";
import { el, safeUrl } from "../core/view";

export const bold = definePlugin({
  id: "bold",
  name: "Bold",
  description: "Strong text, `**bold**` in Markdown.",
  marks: {
    bold: {
      rank: 1,
      markdown: {
        open: () => "**",
        close: () => "**",
        read: [
          ["*", 2],
          ["_", 2],
        ],
      },
      render: (_m, children) => el("strong", undefined, children),
    },
  },
});

export const italic = definePlugin({
  id: "italic",
  name: "Italic",
  description: "Emphasised text, `*italic*` in Markdown.",
  marks: {
    italic: {
      rank: 2,
      markdown: {
        open: () => "*",
        close: () => "*",
        read: [
          ["*", 1],
          ["_", 1],
        ],
      },
      render: (_m, children) => el("em", undefined, children),
    },
  },
});

export const strike = definePlugin({
  id: "strike",
  name: "Strikethrough",
  description: "Struck-through text, `~~strike~~` in Markdown.",
  marks: {
    strike: {
      rank: 3,
      markdown: { open: () => "~~", close: () => "~~", read: [["~", 2]] },
      render: (_m, children) => el("s", undefined, children),
    },
  },
});

export const underline = definePlugin({
  id: "underline",
  name: "Underline",
  description: "Underlined text. Markdown has no word for it: `<u>underline</u>`.",
  marks: {
    underline: {
      rank: 4,
      markdown: { open: () => "<u>", close: () => "</u>" },
      render: (_m, children) => el("u", undefined, children),
    },
  },
  markdown: {
    inline: [
      {
        chars: "<",
        read: (src, at, marks, reader) => {
          if (!src.startsWith("<u>", at)) return undefined;
          const end = src.indexOf("</u>", at + 3);
          if (end === -1) return undefined;
          return {
            nodes: reader.inline(src.slice(at + 3, end), [...marks, { type: "underline" }]),
            end: end + 4,
          };
        },
      },
    ],
  },
});

export const code = definePlugin({
  id: "code",
  name: "Inline code",
  description: "Code inside a line of text, between backticks.",
  marks: {
    code: {
      rank: 5,
      markdown: { literal: codeSpan },
      render: (_m, children) => el("code", { class: "fg-rt-inline-code" }, children),
    },
  },
  markdown: {
    inline: [
      {
        chars: "`",
        read: (src, at, marks) => {
          const run = /^`+/.exec(src.slice(at))?.[0] ?? "`";
          const end = src.indexOf(run, at + run.length);
          if (end !== -1 && src[end + run.length] !== "`") {
            let value = src.slice(at + run.length, end).replace(/\n/g, " ");
            if (/^ .* $/.test(value) && value.trim()) value = value.slice(1, -1);
            return {
              nodes: [textNode(value, [...marks, { type: "code" }])],
              end: end + run.length,
            };
          }
          // A run of backticks that closes nothing is plain text.
          return { nodes: [textNode(run, marks)], end: at + run.length };
        },
      },
    ],
  },
});

export const link = definePlugin({
  id: "link",
  name: "Link",
  description: "A link on a piece of text: `[text](https://example.com)`. Only safe URLs render.",
  marks: {
    link: {
      rank: 0,
      markdown: {
        open: () => "[",
        close: (m) => `](${escapeUrl(String(m.attrs?.["href"] ?? ""))})`,
      },
      render: (m, children) => {
        const href = safeUrl(m.attrs?.["href"]);
        return el(
          "a",
          { ...(href ? { href } : {}), rel: "noopener noreferrer nofollow" },
          children,
        );
      },
    },
  },
  markdown: {
    inline: [
      {
        chars: "[",
        read: (src, at, marks, reader) => {
          const close = closingBracket(src, at);
          const dest = close === -1 ? undefined : destination(src, close + 1);
          if (close === -1 || !dest) return undefined;
          return {
            nodes: reader.inline(src.slice(at + 1, close), [
              ...marks,
              { type: "link", attrs: { href: dest.url } },
            ]),
            end: dest.end,
          };
        },
      },
    ],
  },
});

/** The six marks, in the order of the bubble toolbar. */
export const markPlugins = [bold, italic, underline, strike, code, link] as const;
