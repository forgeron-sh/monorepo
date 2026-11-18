import { createElement as h } from "react";
import { renderToStaticMarkup as html } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AmieIcon, AnvilIcon, GitForkIcon } from "./index";
import { Icon } from "./react";
import { toSvg } from "./render";

/** React closes empty elements with a tag, the SVG printer self-closes them. */
const selfClose = (markup: string) => markup.replace(/<(\w+)([^<>]*)><\/\1>/g, "<$1$2/>");

describe("Icon", () => {
  it("renders nothing for a stub", () => {
    expect(html(h(Icon, { icon: AmieIcon }))).toBe("");
  });

  it("renders the same markup as toSvg", () => {
    const options = {
      variant: "duo" as const,
      size: 48,
      color: "#ededed",
      secondaryColor: "#ff4f1f",
    };
    expect(selfClose(html(h(Icon, { icon: AnvilIcon, ...options })))).toBe(
      toSvg(AnvilIcon, options),
    );
    expect(selfClose(html(h(Icon, { icon: GitForkIcon, variant: "duo" })))).toBe(
      toSvg(GitForkIcon, { variant: "duo" }),
    );
  });

  it("passes other SVG props through and maps attribute names", () => {
    const out = html(h(Icon, { icon: AnvilIcon, className: "nav-icon", id: "x1" }));
    expect(out).toContain('class="nav-icon"');
    expect(out).toContain('id="x1"');
    expect(out).toContain('shape-rendering="crispEdges"');
  });

  it("is named by its title", () => {
    const out = html(h(Icon, { icon: AnvilIcon, title: "Forge" }));
    expect(out).toContain('role="img"');
    expect(out).toContain('aria-label="Forge"');
    expect(out).toContain("<title>Forge</title>");
  });
});
