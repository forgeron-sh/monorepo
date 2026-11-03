import { createElement as h } from "react";
import { renderToStaticMarkup as html } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DetailList, Markdown, safeHref, safeImage, ToolCard, ToolIcon } from "./index";

const IMAGES = {
  "img/list.png": "/console-api/api/catalog/crm/assets/img/list.png?v=abc",
  "img/one two.png": "/console-api/api/catalog/crm/assets/img/one%20two.png?v=def",
};
const render = (source: string) => html(h(Markdown, { source, images: IMAGES }));

describe("Markdown", () => {
  it("renders headings with anchors, lists, task lists, tables and code", () => {
    const out = render(
      [
        "# Title",
        "## Install it",
        "- one",
        "- two",
        "- [x] done",
        "- [ ] todo",
        "",
        "| a | b |",
        "| - | - |",
        "| 1 | 2 |",
        "",
        "```bash",
        "forgeron connect crm",
        "```",
        "",
        "Use `inline` code.",
      ].join("\n"),
    );
    expect(out).toContain('id="md-title"');
    expect(out).toContain('id="md-install-it"');
    expect(out).toContain('href="#md-install-it"');
    expect(out).toContain("<table>");
    expect(out).toContain('aria-label="Done"');
    expect(out).toContain('aria-label="Not done"');
    expect(out).toContain("forgeron connect crm");
    expect(out).toContain(">Copy<");
    expect(out).toContain('class="fg-md-inline"');
  });

  it("gives repeated headings distinct ids and rewrites anchors to them", () => {
    const out = render("## Setup\n\n## Setup\n\n[go](#setup)");
    expect(out).toContain('id="md-setup"');
    expect(out).toContain('id="md-setup-1"');
    expect(out).toContain('href="#md-setup"');
  });

  it("never lets raw HTML through as markup", () => {
    const out = render(
      '<script>alert(1)</script>\n\n<img src=x onerror="alert(1)">\n\n<a href="javascript:alert(1)">x</a>\n\n<iframe src="https://evil.example"></iframe>',
    );
    expect(out).not.toMatch(/<script/i);
    expect(out).not.toMatch(/<iframe/i);
    expect(out).not.toMatch(/<img[^>]*onerror/i);
    expect(out).not.toMatch(/<a [^>]*javascript:/i);
  });

  it("drops javascript:, data: and vbscript: links but keeps their text", () => {
    const out = render(
      "[a](javascript:alert(1)) [b](data:text/html;base64,AAAA) [c](vbscript:x) [d](JaVaScRiPt:x) [e](java%0ascript:x)",
    );
    expect(out).not.toMatch(/href="(javascript|data|vbscript)/i);
    expect(out).not.toMatch(/href="java/i);
    for (const t of [">a<", ">b<", ">c<", ">d<", ">e<"]) expect(out).toContain(t);
  });

  it("opens external links safely and marks them", () => {
    const out = render("[docs](https://example.com/docs)");
    expect(out).toContain('href="https://example.com/docs"');
    expect(out).toContain('rel="noopener noreferrer"');
    expect(out).toContain('target="_blank"');
    expect(out).toContain("opens in a new tab");
  });

  it("draws images of the bundle only, lazily and with their alt text", () => {
    const out = render("![Contact list](./img/list.png)");
    expect(out).toContain('src="/console-api/api/catalog/crm/assets/img/list.png?v=abc"');
    expect(out).toContain('alt="Contact list"');
    expect(out).toContain('loading="lazy"');
  });

  it("refuses images from another origin, data addresses and paths that climb out", () => {
    for (const src of [
      "https://evil.example/pixel.png",
      "//evil.example/pixel.png",
      "data:image/svg+xml;base64,AAAA",
      "javascript:alert(1)",
      "../../secret.png",
      "/console-api/api/workspace",
      "img/../../x.png",
      "img\\..\\x.png",
      "%2e%2e/x.png",
      "img/unknown.png",
      "constructor",
    ]) {
      const out = render(`![alt text](${src})`);
      expect(out).not.toContain("<img");
      expect(out).toContain("Image not shown");
    }
  });

  it("requires alt text", () => {
    const out = render("![](img/a.png)");
    expect(out).not.toContain("<img");
    expect(out).toContain("Image without a description");
  });

  it("is inert on a hostile README", () => {
    const out = render(
      [
        "# Hostile",
        "<script>fetch('/console-api/api/members')</script>",
        '<img src="x" onerror="alert(1)">',
        "[click](javascript:alert(1))",
        "![x](https://evil.example/t.gif)",
        "<style>body{display:none}</style>",
      ].join("\n\n"),
    );
    expect(out).not.toMatch(/<(script|style|iframe|object|embed|form)/i);
    expect(out).not.toMatch(/<[a-z][^>]*\son[a-z]+=/i);
    expect(out).not.toContain("evil.example");
  });
});

describe("safeHref", () => {
  it("keeps web, mail and anchors only", () => {
    expect(safeHref("https://a.example/x")?.external).toBe(true);
    expect(safeHref("mailto:a@b.example")?.external).toBe(true);
    expect(safeHref("#usage")).toEqual({ href: "#md-usage", external: false });
    for (const bad of [
      "javascript:x",
      "ftp://x",
      "//x.example",
      "docs/a.md",
      "#",
      "",
      "ja\tvascript:x",
    ])
      expect(safeHref(bad)).toBeNull();
  });
});

describe("safeImage", () => {
  it("answers the address of a listed relative path, and nothing else", () => {
    expect(safeImage("./img/list.png", IMAGES)).toBe(IMAGES["img/list.png"]);
    expect(safeImage("img//list.png", IMAGES)).toBe(IMAGES["img/list.png"]);
    expect(safeImage("img/one%20two.png", IMAGES)).toBe(IMAGES["img/one two.png"]);
    expect(safeImage("img/other.png", IMAGES)).toBeNull();
    expect(safeImage("toString", IMAGES)).toBeNull();
  });
});

describe("ToolCard", () => {
  it("shows the name as the link, the summary and the footer", () => {
    const out = html(
      h(ToolCard, {
        name: "crm",
        summary: "Contacts and deals",
        href: "/tools/crm",
        footer: h("button", null, "Open"),
      }),
    );
    expect(out).toContain('href="/tools/crm"');
    expect(out).toContain("Contacts and deals");
    expect(out).toContain("<button");
  });
  it("makes a two letter mark", () => {
    expect(html(h(ToolIcon, { name: "odoo" }))).toContain(">od<");
  });
});

describe("DetailList", () => {
  it("pairs labels with values", () => {
    const out = html(h(DetailList, { items: [{ label: "Version", value: "1.4.0" }] }));
    expect(out).toContain("<dt>Version</dt>");
    expect(out).toContain("<dd>1.4.0</dd>");
  });
});
