import type { Atom } from "../types";

/** The status primitive and its shared definitions (D-157). */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "status",
    name: "Status",
    summary:
      "A state in a word: a tone indicator and its label; the states of a record named once.",
    imports: ["Status", "StatusIndicator", "StatusLabel", "StatusOf", "defineStatuses"],
    props: [
      {
        name: "tone",
        type: `"neutral" | "success" | "warning" | "danger" | "accent" | "strong"`,
        default: `"neutral"`,
        description: "The color of the indicator, as Led's; strong is drawn in the text color.",
      },
      {
        name: "label",
        type: "ReactNode",
        description:
          "With it, Status is the props-driven one: the dot and the word. Without, the root of the parts.",
      },
      {
        name: "glyph",
        type: "ReactNode",
        description: "Props-driven form: a mark in place of the dot.",
      },
      {
        name: "StatusIndicator",
        type: "children?: ReactNode",
        description:
          "The Led of the root's tone; children replace it with any glyph. Decorative: the word is the state.",
      },
      {
        name: "StatusLabel",
        type: "span",
        description: "The state in a word, what assistive technology reads.",
      },
      { name: "asChild", type: "boolean", description: "The one child element becomes the root." },
      { name: "className", type: "string", description: "On the root and on each part." },
      {
        name: "defineStatuses",
        type: "({ key: { label, tone, glyph?, order? } }) => StatusSet",
        description:
          "Names the states once: items (options for SelectMenu and pickers), get, label, tone, has, keys; StatusKey<typeof set> is the key union.",
      },
      {
        name: "StatusOf",
        type: "{ set, value }",
        description: "A state of a set: its indicator (glyph if any) and its word.",
      },
    ],
  },
];
