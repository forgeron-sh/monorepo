import { describe, expect, it } from "vitest";
import { rewriteDocLinks } from "./doc-links";

describe("rewriteDocLinks", () => {
  it("sends a relative .md link to the document on GitHub, anchor kept", () => {
    expect(
      rewriteDocLinks('<a href="engine.md">x</a> <a href="engine.md#2-the-format">y</a>'),
    ).toBe(
      '<a href="https://github.com/forgeron-sh/monorepo/blob/main/docs/blueprint/engine.md">x</a> ' +
        '<a href="https://github.com/forgeron-sh/monorepo/blob/main/docs/blueprint/engine.md#2-the-format">y</a>',
    );
  });

  it("leaves anchors, absolute and site links alone", () => {
    const html = '<a href="#1-file">a</a><a href="https://x.dev/a.md">b</a><a href="/format">c</a>';
    expect(rewriteDocLinks(html)).toBe(html);
  });
});
