import { createHighlighter, type ThemeRegistration } from "shiki";

// Code in the lab palette: greys, components in ink, strings muted, one touch of ember on keywords.
// Build time only.

const lab: ThemeRegistration = {
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

const highlighter = await createHighlighter({
  themes: [lab],
  langs: ["tsx", "shellscript", "css"],
});

export function highlight(code: string, lang: "tsx" | "shellscript" | "css" = "tsx"): string {
  return highlighter.codeToHtml(code.trimEnd(), { lang, theme: "forgeron-lab" });
}
