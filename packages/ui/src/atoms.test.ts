import { textSvg } from "@forgeron/blueprint";
import { CloudIcon, LockIcon } from "@forgeron/icons";
import { createElement as h } from "react";
import { renderToStaticMarkup as html } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  Badge,
  Button,
  Chip,
  Command,
  EnvTag,
  Icon,
  Label,
  Led,
  Link,
  Logo,
  PixelText,
  PixelTitle,
  Tag,
  Title,
} from "./index";

describe("Button", () => {
  it("is a button by default and a link with href", () => {
    expect(html(h(Button, null, "Deploy"))).toBe(
      '<button type="button" class="fg-btn fg-btn-secondary">Deploy</button>',
    );
    expect(html(h(Button, { href: "#start", variant: "primary", size: "lg" }, "Go"))).toBe(
      '<a href="#start" class="fg-btn fg-btn-primary fg-btn-lg">Go</a>',
    );
  });
  it("draws the square marker before the label and keeps the shortcut", () => {
    const out = html(h(Button, { marker: true, kbd: "⌘K", variant: "ink" }, "Search"));
    expect(out).toContain('class="fg-btn fg-btn-ink"');
    expect(out).toMatch(
      /^<button[^>]*><span class="fg-led fg-led-current" aria-hidden="true"><\/span>Search/,
    );
    expect(out).toContain('<span class="fg-btn-kbd" aria-hidden="true">⌘K</span>');
  });
});

describe("Led", () => {
  it("is decorative next to its word, named when alone", () => {
    expect(html(h(Led, { tone: "success" }))).toBe(
      '<span class="fg-led fg-led-success" aria-hidden="true"></span>',
    );
    expect(html(h(Led, { label: "Building" }))).toBe(
      '<span class="fg-led" role="img" aria-label="Building"></span>',
    );
  });
});

describe("Badge and EnvTag", () => {
  it("puts a square LED in the tone's color, and keeps the case of identifiers", () => {
    expect(html(h(Badge, { tone: "success", dot: true, children: "Live" }))).toBe(
      '<span class="fg-badge fg-badge-success"><span class="fg-led fg-led-current" aria-hidden="true"></span>Live</span>',
    );
    expect(html(h(Badge, { mono: true, children: "v1.4.0" }))).toContain(
      'class="fg-badge fg-badge-mono"',
    );
  });
  it("tells the channel by shape", () => {
    expect(html(h(EnvTag, { env: "preview" }))).toContain("fg-env fg-env-preview");
    expect(html(h(EnvTag, { env: "production" }))).toContain(">Production</span>");
  });
});

describe("Tag, Chip, Label, Link, Command", () => {
  it("brackets a tag with its strong part", () => {
    expect(html(h(Tag, { strong: "/1.2" }, "Start"))).toBe(
      '<span class="fg-tag"><b>/1.2</b> Start</span>',
    );
    expect(html(h(Tag, null, "crm · v1.4.0"))).toBe('<span class="fg-tag">crm · v1.4.0</span>');
  });
  it("lights the active chip", () => {
    expect(html(h(Chip, { active: true, children: "MCP" }))).toBe(
      '<span class="fg-chip fg-chip-active">MCP</span>',
    );
  });
  it("sets the eyebrow label and the text link", () => {
    expect(html(h(Label, { children: "Version" }))).toBe(
      '<span class="fg-label-eyebrow text-eyebrow">Version</span>',
    );
    expect(html(h(Link, { href: "/docs", children: "Read the SDK" }))).toBe(
      '<a href="/docs" class="fg-link">Read the SDK</a>',
    );
  });
  it("hides the prompt from assistive technology", () => {
    expect(html(h(Command, { children: "npx forgeron init" }))).toBe(
      '<code class="fg-cmd"><span class="fg-cmd-prompt" aria-hidden="true">$</span>npx forgeron init</code>',
    );
    expect(html(h(Command, { framed: false, children: "forgeron dev" }))).toContain(
      'class="fg-cmd-inline"',
    );
  });
});

describe("Title and pixel text", () => {
  it("sets a heading in the pixel font", () => {
    expect(html(h(Title, { as: "h1", size: "hero", children: "Forge" }))).toBe(
      '<h1 class="fg-title fg-title-hero">Forge</h1>',
    );
  });
  it("draws exactly what the pixel face draws", () => {
    for (const text of ["forgeron", "/0.1", "01", "Forge your tools"]) {
      const expected = textSvg(text).replace("/>", "></path>");
      expect(html(h(PixelText, { text }))).toBe(expected);
    }
  });
  it("names the drawing when given a label", () => {
    expect(html(h(PixelText, { text: "/0.1", label: "/0.1" }))).toContain(
      'role="img" aria-label="/0.1"',
    );
  });
  it("keeps the words of a pixel title readable by assistive technology", () => {
    const out = html(h(PixelTitle, { text: "One tool,\nfive layers.", as: "h2" }));
    expect(out).toMatch(
      /^<h2 class="fg-pixel-title fg-pixel-title-h2"><span class="fg-sr">One tool, five layers\.<\/span>/,
    );
    expect(out.match(/<svg/g)).toHaveLength(4);
    expect(out.match(/aria-hidden="true"/g)?.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Logo", () => {
  it("draws the anvil and the wordmark, named once", () => {
    const out = html(h(Logo, null));
    expect(out).toMatch(/^<span class="fg-logo" role="img" aria-label="Forgeron">/);
    expect(out).toContain('style="width:22px;height:22px"');
    expect(out).toContain('style="height:11px;width:74px"');
    expect(out).toContain(textSvg("forgeron").replace("/>", "></path>"));
  });
  it("leaves the wordmark out of the symbol", () => {
    expect(html(h(Logo, { variant: "symbol", size: 20 }))).not.toContain("fg-logo-word");
  });
});

describe("Icon", () => {
  it("draws the secondary pixels in ember, in a square box", () => {
    const out = html(h(Icon, { icon: CloudIcon, size: 24 }));
    expect(out).toMatch(/^<span class="fg-icon" style="width:24px;height:24px"><svg/);
    expect(out).toContain('viewBox="0 0 12 12"');
    expect(out).toContain("fill:var(--accent)");
    expect(out).toContain('aria-hidden="true"');
  });
  it("is named with a title", () => {
    expect(html(h(Icon, { icon: LockIcon, title: "Locked" }))).toContain('aria-label="Locked"');
  });
});
