import type { ShikiConfig } from "astro";

type Theme = Exclude<NonNullable<ShikiConfig["theme"]>, string>;

/**
 * Code in the lab palette, for the blog's code blocks (Shiki, at build time): greys, names in
 * ink, strings muted, one touch of ember on keywords. The same palette as the UI gallery's code.
 */
export const labTheme: Theme = {
  name: "forgeron-lab",
  type: "dark",
  colors: { "editor.background": "#050505", "editor.foreground": "#b5b5b5" },
  tokenColors: [
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: "#5e5e5e" } },
    {
      scope: ["keyword", "storage", "keyword.control", "storage.type", "storage.modifier"],
      settings: { foreground: "#ff4f1f" },
    },
    { scope: ["string", "string.quoted"], settings: { foreground: "#8f8f8f" } },
    {
      scope: ["entity.name.tag", "support.class.component", "entity.name.function"],
      settings: { foreground: "#ededed" },
    },
    { scope: ["entity.other.attribute-name"], settings: { foreground: "#a8a8a8" } },
    { scope: ["constant.numeric", "constant.language"], settings: { foreground: "#ededed" } },
    { scope: ["punctuation", "meta.brace"], settings: { foreground: "#6e6e6e" } },
    { scope: ["variable", "meta.definition.variable"], settings: { foreground: "#d0d0d0" } },
  ],
};
