import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup as html } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Banner } from "./banner";
import { Chip } from "./chip";
import { Eyebrow } from "./eyebrow";
import { Icon } from "./icon";
import { Led } from "./led";
import { Logo } from "./logo";
import { LogoTile } from "./logo-tile";
import { MarkBadge } from "./mark-badge";
import { SectionBand, SectionHead } from "./section-head";
import { Stat } from "./stat";
import { Tag } from "./tag";
import { Title } from "./title";

const e = (type: unknown, props: object | null, ...kids: unknown[]): ReactElement =>
  createElement(type as never, props, ...(kids as never[]));
const extra = { className: "x", "data-test": "y" };
const stub = { id: "stub", paths: [], viewBox: "0 0 12 12" } as never;

const cases: Array<[string, string, ReactElement]> = [
  ["chip", "chip", e(Chip, extra, "MCP")],
  ["tag", "tag", e(Tag, { ...extra, strong: "A" }, "b")],
  ["led", "led", e(Led, extra)],
  ["banner", "banner", e(Banner, extra, "Hello")],
  ["eyebrow", "eyebrow", e(Eyebrow, extra, "Hi")],
  ["title", "title", e(Title, extra, "Hi")],
  ["section-head", "section-head", e(SectionHead, { ...extra, index: "/0.1", title: "T" })],
  [
    "section-band",
    "section-band",
    e(SectionBand, { ...extra, from: "/0.1", to: "/0.2", label: "L" }),
  ],
  ["stat", "stat", e(Stat, { ...extra, label: "L", value: "1" })],
  ["icon", "icon", e(Icon, { ...extra, icon: stub })],
  ["logo", "logo", e(Logo, extra)],
  ["logo-tile", "logo-tile", e(LogoTile, { ...extra, name: "Odoo" })],
  ["mark-badge", "mark-badge", e(MarkBadge, extra, "Hi")],
];

describe("single-element atoms forward className and rest", () => {
  it.each(cases)("%s", (_name, slot, el) => {
    const out = html(el);
    expect(out).toContain(`data-slot="${slot}"`);
    expect(out).toContain('data-test="y"');
    expect(out).toMatch(/class="[^"]*\bx\b/);
  });

  it("asChild hands the props to the child", () => {
    const out = html(e(Chip, { asChild: true, ...extra }, e("a", { href: "/z" }, "go")));
    expect(out).toMatch(/^<a /);
    expect(out).toContain('data-test="y"');
    const tag = html(
      e(Tag, { asChild: true, strong: "S", ...extra }, e("a", { href: "/z" }, "go")),
    );
    expect(tag).toMatch(/^<a /);
    expect(tag).toContain("<b>S</b>");
  });
});
