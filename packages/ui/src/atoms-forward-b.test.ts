import { createElement as h } from "react";
import { renderToStaticMarkup as html } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CommandLine } from "./command-line";
import { CopyBlock } from "./copy-block";
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
  Notice,
  NoticeAction,
  NoticeDescription,
  NoticeTitle,
  Spinner,
} from "./feedback";
import { Markdown } from "./markdown";
import {
  Page,
  PageActions,
  PageBody,
  PageDescription,
  PageHeader,
  PageTitle,
  PageTitles,
} from "./page";
import { PixelFigure } from "./pixel-figure";
import { PixelText } from "./pixel-text";
import { PixelTitle } from "./pixel-title";
import { SoonTag } from "./soon-tag";

const extra = { className: "x", "data-test": "y" };

describe("atoms forward className and rest", () => {
  const cases: Array<[string, () => string]> = [
    ["soon-tag", () => html(h(SoonTag, extra))],
    ["pixel-text", () => html(h(PixelText, { text: "01", ...extra }))],
    ["pixel-title", () => html(h(PixelTitle, { text: "Pick", ...extra }))],
    ["pixel-figure", () => html(h(PixelFigure, { text: "42", ...extra }))],
    ["copy-block", () => html(h(CopyBlock, { value: "a", label: "A", ...extra }))],
    ["command-line", () => html(h(CommandLine, { ...extra, children: "ls" }))],
    ["markdown", () => html(h(Markdown, { source: "hi", images: {}, ...extra }))],
    ["page", () => html(h(Page, { title: "T", ...extra }))],
    ["notice", () => html(h(Notice, { title: "N", ...extra }))],
    ["empty-state", () => html(h(EmptyState, { title: "E", ...extra }))],
    ["spinner", () => html(h(Spinner, extra))],
  ];
  for (const [slot, render] of cases) {
    it(`forwards on ${slot}`, () => {
      const out = render();
      expect(out).toContain(`data-slot="${slot}"`);
      expect(out).toMatch(/class="[^"]*\bx\b/);
      expect(out).toContain('data-test="y"');
    });
  }

  it("SoonTag asChild hands its class to the child", () => {
    const out = html(h(SoonTag, { asChild: true }, h("a", { href: "/soon" }, "Soon")));
    expect(out).toContain('<a href="/soon"');
    expect(out).toContain("fg-soon");
  });
});

describe("parts forms", () => {
  it("EmptyState", () => {
    const out = html(
      h(
        EmptyState,
        { className: "x" },
        h(EmptyStateIcon, { ...extra }, "!"),
        h(EmptyStateTitle, null, "None"),
        h(EmptyStateDescription, null, "Why"),
        h(EmptyStateActions, null, "Go"),
      ),
    );
    for (const s of [
      "empty-state-icon",
      "empty-state-title",
      "empty-state-description",
      "empty-state-actions",
    ])
      expect(out).toContain(`data-slot="${s}"`);
    expect(out).toContain("fg-empty-title");
  });

  it("Notice", () => {
    const out = html(
      h(
        Notice,
        { tone: "danger" },
        h(NoticeTitle, null, "T"),
        h(NoticeDescription, null, "D"),
        h(NoticeAction, null, "A"),
      ),
    );
    expect(out).toContain('role="alert"');
    expect(out).toContain('data-slot="notice-title"');
    expect(out).toContain('data-slot="notice-description"');
    expect(out.indexOf("notice-action")).toBeGreaterThan(out.indexOf("fg-notice-body"));
  });

  it("Page", () => {
    const out = html(
      h(
        Page,
        null,
        h(
          PageHeader,
          null,
          h(PageTitles, null, h(PageTitle, null, "T"), h(PageDescription, null, "D")),
          h(PageActions, null, "A"),
        ),
        h(PageBody, null, "body"),
      ),
    );
    for (const s of [
      "page-header",
      "page-titles",
      "page-title",
      "page-description",
      "page-actions",
      "page-body",
    ])
      expect(out).toContain(`data-slot="${s}"`);
  });
});
