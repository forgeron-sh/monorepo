// @vitest-environment jsdom
import { createElement as h } from "react";
import { renderToStaticMarkup as html } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Skeleton,
} from "./index";

// shadcn's display parts next to our props-driven roots (D-156).

describe("Badge", () => {
  it("keeps tone, dot and mono", () => {
    const out = html(h(Badge, { tone: "success", dot: true, mono: true }, "Live"));
    expect(out).toContain("fg-badge-success");
    expect(out).toContain("fg-badge-mono");
    expect(out).toContain("fg-led");
  });
  it("maps shadcn's variants", () => {
    expect(html(h(Badge, { variant: "destructive" }, "x"))).toContain("fg-badge-danger");
    expect(html(h(Badge, { variant: "default" }, "x"))).toContain("fg-badge-strong");
    expect(html(h(Badge, { variant: "secondary" }, "x"))).toContain("fg-badge-secondary");
    expect(html(h(Badge, { variant: "outline" }, "x"))).not.toContain("fg-badge-");
  });
  it("renders its child with asChild", () => {
    const out = html(
      h(Badge, { asChild: true, variant: "outline" }, h("a", { href: "/x" }, "Link")),
    );
    expect(out).toContain("<a ");
    expect(out).toContain('href="/x"');
    expect(out).toContain("fg-badge");
    expect(out).not.toContain("<span");
  });
});

describe("Avatar", () => {
  it("still draws initials from a name", () => {
    expect(html(h(Avatar, { name: "Claire Moreau", size: 32 }))).toContain("CM");
  });
  it("is the root of the parts without a name", () => {
    const out = html(
      h(
        Avatar,
        { size: "lg" },
        h(AvatarImage, { src: "/a.png", alt: "A" }),
        h(AvatarFallback, null, "CN"),
      ),
    );
    expect(out).toContain('data-size="lg"');
    expect(out).toContain("CN");
  });
});

describe("Skeleton", () => {
  it("is sized by width and height, or by the caller's style and classes", () => {
    expect(html(h(Skeleton, { width: 40, height: 20 }))).toContain("width:40px;height:20px");
    const out = html(h(Skeleton, { className: "h-4 w-10", style: { height: 8 } }));
    expect(out).toContain("h-4 w-10");
    expect(out).toContain("height:8px");
  });
});

describe("Card", () => {
  it("composes its parts", () => {
    const out = html(
      h(
        Card,
        null,
        h(
          CardHeader,
          null,
          h(CardTitle, null, "T"),
          h(CardDescription, null, "D"),
          h(CardAction, null, "A"),
        ),
        h(CardContent, null, "C"),
        h(CardFooter, null, "F"),
      ),
    );
    for (const c of [
      'fg-card"',
      "fg-card-header",
      "fg-card-title",
      "fg-card-description",
      "fg-card-action",
      "fg-card-content",
      "fg-card-footer",
    ])
      expect(out).toContain(c);
  });
});

describe("Alert", () => {
  it("has the alert role and a destructive variant", () => {
    const out = html(
      h(
        Alert,
        { variant: "destructive" },
        h(AlertTitle, null, "T"),
        h(AlertDescription, null, "D"),
      ),
    );
    expect(out).toContain('role="alert"');
    expect(out).toContain("fg-alert-destructive");
    expect(out).toContain("fg-alert-title");
  });
});
