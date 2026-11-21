// @vitest-environment jsdom
import { act, createElement as h, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup as html } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Accordion,
  AccordionContent,
  AccordionTrigger,
  Breadcrumb,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  ScrollArea,
  ScrollBar,
} from "./index";
import { AccordionItem } from "./collapsible";
import {
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./identity";

// shadcn's compound parts of the disclosure group next to our props-driven roots (D-156).

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | undefined;
let unmount: (() => void) | undefined;
const mount = async (element: ReactElement) => {
  host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () => root.render(element));
  unmount = () => root.unmount();
  return host;
};
afterEach(async () => {
  await act(async () => unmount?.());
  host?.remove();
  host = undefined;
});

const accordion = (props: Record<string, unknown>) =>
  h(
    Accordion,
    props as never,
    h(
      AccordionItem,
      { value: "a" },
      h(AccordionTrigger, null, "First"),
      h(AccordionContent, null, "One"),
    ),
    h(
      AccordionItem,
      { value: "b" },
      h(AccordionTrigger, null, "Second"),
      h(AccordionContent, null, "Two"),
    ),
  );
const triggers = () => [...host!.querySelectorAll<HTMLButtonElement>(".fg-fold-trigger")];
const expanded = () => triggers().map((t) => t.getAttribute("aria-expanded"));

describe("Accordion parts", () => {
  it("opens one section at a time with type single, and folds it again with collapsible", async () => {
    const onValueChange = vi.fn<(value: string) => void>();
    await mount(accordion({ type: "single", collapsible: true, defaultValue: "a", onValueChange }));
    expect(expanded()).toEqual(["true", "false"]);
    expect(host!.querySelector(".fg-fold-header")?.getAttribute("role")).toBeNull();
    await act(async () => triggers()[1]!.click());
    expect(expanded()).toEqual(["false", "true"]);
    expect(onValueChange).toHaveBeenLastCalledWith("b");
    await act(async () => triggers()[1]!.click());
    expect(expanded()).toEqual(["false", "false"]);
    expect(onValueChange).toHaveBeenLastCalledWith("");
  });

  it("keeps one section open with type single and no collapsible", async () => {
    await mount(accordion({ type: "single", defaultValue: "a" }));
    await act(async () => triggers()[0]!.click());
    expect(expanded()).toEqual(["true", "false"]);
  });

  it("opens several with type multiple and gives back a list", async () => {
    const onValueChange = vi.fn<(value: string[]) => void>();
    await mount(accordion({ type: "multiple", onValueChange }));
    await act(async () => triggers()[0]!.click());
    await act(async () => triggers()[1]!.click());
    expect(expanded()).toEqual(["true", "true"]);
    expect(onValueChange).toHaveBeenLastCalledWith(["a", "b"]);
  });

  it("keeps the props-driven accordion when given items", () => {
    const out = html(
      h(Accordion, { items: [{ value: "x", title: "Question", content: "Answer" }] }),
    );
    expect(out).toContain("fg-fold-title");
    expect(out).toContain("Question");
  });
});

describe("Collapsible parts", () => {
  it("folds and unfolds from its trigger", async () => {
    const onOpenChange = vi.fn<(open: boolean) => void>();
    await mount(
      h(
        Collapsible,
        { onOpenChange },
        h(CollapsibleTrigger, { asChild: true }, h("button", { id: "t" }, "Toggle")),
        h(CollapsibleContent, null, "Hidden text"),
      ),
    );
    const trigger = host!.querySelector<HTMLButtonElement>("#t")!;
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(host!.textContent).not.toContain("Hidden text");
    await act(async () => trigger.click());
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(host!.textContent).toContain("Hidden text");
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
  });

  it("keeps the props-driven collapsible when given a title", () => {
    const out = html(h(Collapsible, { title: "Details", children: "Body" }));
    expect(out).toContain("fg-fold-trigger");
    expect(out).toContain("Details");
  });
});

describe("Breadcrumb parts", () => {
  it("draws the trail as shadcn writes it", () => {
    const out = html(
      h(
        Breadcrumb,
        null,
        h(
          BreadcrumbList,
          null,
          h(BreadcrumbItem, null, h(BreadcrumbLink, { href: "/" }, "Home")),
          h(BreadcrumbSeparator),
          h(BreadcrumbItem, null, h(BreadcrumbEllipsis)),
          h(BreadcrumbSeparator),
          h(
            BreadcrumbItem,
            null,
            h(BreadcrumbLink, { asChild: true }, h("a", { href: "/docs" }, "Docs")),
          ),
          h(BreadcrumbSeparator, null, ">"),
          h(BreadcrumbItem, null, h(BreadcrumbPage, null, "Breadcrumb")),
        ),
      ),
    );
    expect(out).toContain('<nav aria-label="breadcrumb" class="fg-crumbs">');
    expect(out).toContain('<a href="/" class="fg-crumb">Home</a>');
    expect(out).toContain('href="/docs"');
    expect(out).toContain("fg-crumb fg-crumb");
    expect(out).toContain('aria-current="page"');
    expect(out).toContain('class="fg-crumb-sep">/</li>');
    expect(out).toContain('class="fg-crumb-sep">&gt;</li>');
    expect(out).toContain("fg-crumb-ellipsis");
  });

  it("keeps the props-driven breadcrumb when given items", () => {
    const out = html(h(Breadcrumb, { items: [{ label: "Ops", href: "/" }, { label: "Issues" }] }));
    expect(out).toContain('aria-label="Breadcrumb"');
    expect(out).toContain('aria-current="page"');
  });
});

describe("Pagination", () => {
  it("draws previous, pages, ellipsis and next", () => {
    const out = html(
      h(
        Pagination,
        null,
        h(
          PaginationContent,
          null,
          h(PaginationItem, null, h(PaginationPrevious, { href: "#" })),
          h(PaginationItem, null, h(PaginationLink, { href: "#" }, "1")),
          h(PaginationItem, null, h(PaginationLink, { href: "#", isActive: true }, "2")),
          h(PaginationItem, null, h(PaginationEllipsis)),
          h(PaginationItem, null, h(PaginationNext, { href: "#" })),
        ),
      ),
    );
    expect(out).toContain('aria-label="pagination"');
    expect(out).toContain('aria-label="Go to previous page"');
    expect(out).toContain('aria-label="Go to next page"');
    expect(out).toContain('aria-current="page"');
    expect(out.match(/aria-current/g)).toHaveLength(1);
    expect(out).toContain("fg-btn-secondary fg-btn-icon");
    expect(out).toContain("fg-pagination-ellipsis");
    expect(out).toContain("Previous");
  });

  it("draws the router's link with asChild", () => {
    const out = html(
      h(PaginationLink, { asChild: true, isActive: true }, h("a", { href: "/p/3" }, "3")),
    );
    expect(out).toContain('href="/p/3"');
    expect(out).toContain('aria-current="page"');
    expect(out).toContain("fg-btn");
  });
});

describe("ScrollArea", () => {
  it("wraps its children in a viewport with a vertical bar", async () => {
    await mount(
      h(
        ScrollArea,
        { className: "h-40", style: { height: 100 } },
        h("p", null, "Long content"),
        h(ScrollBar, { orientation: "horizontal" }),
      ),
    );
    const root = host!.firstElementChild!;
    expect(root.className).toContain("fg-scroll");
    expect(root.className).toContain("h-40");
    expect(root.querySelector(".fg-scroll-viewport")?.textContent).toContain("Long content");
  });
});

describe("HoverCard", () => {
  it("opens from its trigger as the shadcn example writes it", async () => {
    await mount(
      h(
        HoverCard,
        { defaultOpen: true },
        h(HoverCardTrigger, { asChild: true }, h("a", { href: "#a" }, "@forgeron")),
        h(HoverCardContent, { className: "w-80" }, "The Forgeron project"),
      ),
    );
    expect(host!.querySelector("a")?.textContent).toBe("@forgeron");
    const card = document.querySelector(".fg-hover-card")!;
    expect(card.className).toContain("w-80");
    expect(card.textContent).toBe("The Forgeron project");
  });
});
