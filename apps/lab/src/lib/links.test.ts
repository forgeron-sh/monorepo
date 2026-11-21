import { describe, expect, it } from "vitest";
import { REPO, resolveRepoPath, rewriteHref, rewriteMarkdownLinks } from "./links";

const papers = new Map([["docs/blueprint/engine.md", "/papers/blueprint-engine"]]);

describe("resolveRepoPath", () => {
  it("resolves against the folder of the file", () => {
    expect(resolveRepoPath("docs/shaders/design.md", "../blueprint/engine.md")).toBe(
      "docs/blueprint/engine.md",
    );
    expect(resolveRepoPath("docs/icons.md", "../packages/icons/README.md")).toBe(
      "packages/icons/README.md",
    );
    expect(resolveRepoPath("docs/blueprint/format.md", "./engine.md")).toBe(
      "docs/blueprint/engine.md",
    );
  });
});

describe("rewriteHref", () => {
  it("sends a link to another paper to its page, anchor kept", () => {
    expect(rewriteHref("../blueprint/engine.md#2-format", "docs/shaders/design.md", papers)).toBe(
      "/papers/blueprint-engine#2-format",
    );
  });

  it("sends any other file to GitHub, a folder as a tree", () => {
    expect(rewriteHref("../DECISIONS.md", "docs/blueprint/engine.md", papers)).toBe(
      `${REPO}/blob/main/docs/DECISIONS.md`,
    );
    expect(rewriteHref("../../packages/canvas", "docs/benchmarks/canvas-engine.md", papers)).toBe(
      `${REPO}/tree/main/packages/canvas`,
    );
  });

  it("keeps absolute links and anchors", () => {
    expect(rewriteHref("https://example.com/a", "docs/icons.md", papers)).toBe(
      "https://example.com/a",
    );
    expect(rewriteHref("#rules", "docs/icons.md", papers)).toBe("#rules");
    expect(rewriteHref("mailto:a@b.c", "docs/icons.md", papers)).toBe("mailto:a@b.c");
  });
});

describe("rewriteMarkdownLinks", () => {
  const from = "docs/shaders/design.md";

  it("rewrites inline links, images and references", () => {
    const md =
      'See [the engine](../blueprint/engine.md "Engine") and ![x](./a.png).\n\n[d]: ../DECISIONS.md\n';
    expect(rewriteMarkdownLinks(md, from, papers)).toBe(
      `See [the engine](/papers/blueprint-engine "Engine") and ![x](${REPO}/blob/main/docs/shaders/a.png).\n\n[d]: ${REPO}/blob/main/docs/DECISIONS.md\n`,
    );
  });

  it("leaves fenced code alone", () => {
    const md = "```ts\nconst a = [b](../c.md);\n```\n[e](../blueprint/engine.md)";
    expect(rewriteMarkdownLinks(md, from, papers)).toBe(
      "```ts\nconst a = [b](../c.md);\n```\n[e](/papers/blueprint-engine)",
    );
  });
});
