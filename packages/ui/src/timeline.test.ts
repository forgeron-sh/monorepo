import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  Feed,
  FeedContent,
  FeedDescription,
  FeedGroup,
  FeedGroupLabel,
  FeedIndicator,
  FeedItem,
  FeedTime,
  FeedTitle,
} from "./parts-timeline";

const html = (node: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(node);

describe("Feed", () => {
  it("is a named ordered list with the connector on", () => {
    const out = html(h(Feed, { "aria-label": "History", className: "mine" }));
    expect(out).toContain("<ol");
    expect(out).toContain('aria-label="History"');
    expect(out).toContain("fg-timeline mine");
    expect(out).toContain("data-connector");
    expect(html(h(Feed, { connector: false }))).not.toContain("data-connector");
  });

  it("composes an entry from its parts, className and rest passed through", () => {
    const out = html(
      h(
        Feed,
        null,
        h(
          FeedItem,
          { id: "one", className: "x" },
          h(FeedIndicator, { tone: "success" }),
          h(
            FeedContent,
            null,
            h(FeedTitle, null, "Léa approved"),
            h(FeedTime, { dateTime: "2026-11-18T09:42" }, "09:42"),
            h(FeedDescription, null, "Looks good."),
          ),
        ),
      ),
    );
    expect(out).toContain('<li data-slot="timeline-item" class="fg-timeline-item x" id="one">');
    expect(out).toContain('aria-hidden="true"');
    expect(out).toContain("fg-led-success");
    expect(out).toMatch(/<time [^>]*dateTime="2026-11-18T09:42"/);
    expect(out).toContain("Looks good.");
  });

  it("takes children in place of the LED, and a time without a value is a span", () => {
    const marker = html(h(FeedIndicator, null, h("b", null, "A")));
    expect(marker).toContain("<b>A</b>");
    expect(marker).not.toContain("fg-led");
    expect(html(h(FeedTime, null, "2 h ago"))).toMatch(/^<span /);
  });

  it("names a group with a heading", () => {
    const out = html(h(FeedGroup, null, h(FeedGroupLabel, null, "Today")));
    expect(out).toContain("<h3");
    expect(out).toContain("<span>Today</span>");
  });
});
