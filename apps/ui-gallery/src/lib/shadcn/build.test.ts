import { describe, expect, it } from "vitest";
import {
  definingFile,
  prefixTokensInCode,
  prefixTokensInCss,
  relativeSpecifier,
  shadcnTheme,
  specifiersOf,
  tokensOf,
} from "./build";

const tokens = ["bg", "bg-raised", "accent", "font-sans"];

describe("our tokens in the shadcn copy", () => {
  it("prefixes our tokens and leaves the rest", () => {
    expect(
      prefixTokensInCss(
        ".a { color: var(--accent); --bg: red; background: var(--bg-raised); --fg-x: var(--icon-secondary); }",
        tokens,
      ),
    ).toBe(
      ".a { color: var(--fg-accent); --fg-bg: red; background: var(--fg-bg-raised); --fg-x: var(--icon-secondary); }",
    );
    expect(prefixTokensInCss(':root[data-theme="light"] .x {}', tokens)).toBe(
      ":root:not(.dark) .x {}",
    );
  });

  it("prefixes them in code strings only", () => {
    expect(
      prefixTokensInCode('style={{ color: "var(--accent)" }}; get("--bg"); i--bg;', tokens),
    ).toBe('style={{ color: "var(--fg-accent)" }}; get("--fg-bg"); i--bg;');
  });

  it("reads the tokens of a block and maps them to the shadcn names", () => {
    const css = `:root {\n  --bg: #000;\n  --ink: #fff;\n}\n:root[data-theme="light"] {\n  --bg: #eee;\n}`;
    expect(tokensOf(css).get("bg")).toBe("#000");
    expect(tokensOf(css, ':root[data-theme="light"]').get("bg")).toBe("#eee");
    expect(() => shadcnTheme(tokensOf(css))).toThrow(/--bg-raised|--accent|--line/);
  });
});

describe("modules", () => {
  it("finds the import specifiers, not words in strings", () => {
    const code = `import { a } from "./a";\nimport type {\n  B,\n} from "@x/y/z";\nimport "./s.css";\nconst t = "from \\" and \\"";\nconst m = import("./lazy");\nexport * from "./b";`;
    expect(specifiersOf(code).sort()).toEqual(["./a", "./b", "./lazy", "./s.css", "@x/y/z"]);
  });

  it("follows re-exports to the defining file", () => {
    const sources = new Map([
      ["ui/src/index.ts", 'export { Button } from "./button";\nexport * from "./blocks/lists";'],
      ["ui/src/button.tsx", "export function Button() {}"],
      ["ui/src/blocks/lists.ts", 'export { IssueList as List } from "./lists-issue";'],
      ["ui/src/blocks/lists-issue.tsx", "export const IssueList = 1;"],
    ]);
    expect(definingFile(sources, "ui/src/index.ts", "Button")).toBe("ui/src/button.tsx");
    expect(definingFile(sources, "ui/src/index.ts", "List")).toBe("ui/src/blocks/lists-issue.tsx");
    expect(definingFile(sources, "ui/src/index.ts", "Nope")).toBeUndefined();
  });

  it("writes relative specifiers between the copied files", () => {
    expect(relativeSpecifier("blocks/lists-issue.tsx", "cx.ts")).toBe("../cx");
    expect(relativeSpecifier("overlays.tsx", "vendor/icons/glyphs/AIcon.ts")).toBe(
      "./vendor/icons/glyphs/AIcon",
    );
    expect(relativeSpecifier("blocks/a.tsx", "blocks/lists.css")).toBe("./lists.css");
  });
});
