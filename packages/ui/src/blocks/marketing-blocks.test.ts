import { CloudIcon, GithubIcon } from "@forgeron/icons";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  CompareTable,
  Faq,
  Hero,
  LogoStrip,
  PixelFigure,
  PlanCard,
  SectionBand,
  SectionHead,
  SiteFooter,
  SoonTag,
} from "../index";

// The markup these cases pin, without the shadcn `data-slot` names (the forwarding tests check them).
const html = (...args: Parameters<typeof renderToStaticMarkup>) =>
  renderToStaticMarkup(...args).replace(/ data-slot="[^"]*"/g, "");

describe("marketing atoms", () => {
  it("draws the section head's coordinate and joins the title's lines with a break", () => {
    const out = html(
      h(SectionHead, { index: "/0.1", title: ["Pick. Shape.", "Ship."], lead: "Lead." }),
    );
    expect(out).toContain('aria-label="/0.1"');
    expect(out).toContain('<h2 class="fg-title fg-title-h2">Pick. Shape.<br/>Ship.</h2>');
    expect(out).toContain('<p class="fg-sec-lead">Lead.</p>');
  });

  it("writes the band's coordinates and the next section in brackets", () => {
    const out = html(h(SectionBand, { from: "/0.1", to: "/0.2", label: "Resources" }));
    expect(out).toBe(
      '<div class="fg-band text-eyebrow"><span>/0.1 → /0.2</span><span>[ Resources ]</span></div>',
    );
  });

  it("sizes and tones a pixel figure, and says it", () => {
    const out = html(h(PixelFigure, { text: "01", label: "Step 1", size: "xl" }));
    expect(out).toContain('class="fg-pfig fg-pfig-xl fg-pfig-accent"');
    expect(out).toContain('aria-label="Step 1"');
    expect(html(h(SoonTag))).toBe('<span class="fg-soon text-bit">Soon</span>');
  });
});

describe("marketing blocks", () => {
  it("numbers the questions and opens the first", () => {
    const out = html(
      h(Faq, {
        items: [
          { q: "One?", a: "A." },
          { q: "Two?", a: "B." },
        ],
      }),
    );
    expect(out.match(/<details open="">/g)).toHaveLength(1);
    expect(out).toContain("Q.01");
    expect(out).toContain("Q.02");
  });

  it("dashes a Soon tag and shows a price only when given", () => {
    const base = {
      name: "Cloud",
      icon: CloudIcon,
      where: "We run it.",
      groups: [{ title: "Operations", items: ["Updates"] }],
      action: { href: "#start", label: "Start", primary: true },
    };
    const soon = html(h(PlanCard, { ...base, tag: "Soon" }));
    expect(soon).toContain("fg-plan-tag text-bit fg-plan-tag-soon");
    expect(soon).not.toContain("fg-plan-price");
    const priced = html(
      h(PlanCard, { ...base, price: "$14.99", unit: "per seat", featured: true }),
    );
    expect(priced).toContain("fg-plan fg-ticks fg-plan-featured");
    expect(priced).toContain('aria-label="$14.99"');
  });

  it("takes a command as a string or as an element", () => {
    const action = { href: "#start", label: "Get started" };
    const text = html(
      h(Hero, { title: "Forge.", lead: "Lead.", command: "npx forgeron init", action }),
    );
    expect(text).toContain("fg-cmd-inline");
    const own = html(
      h(Hero, { title: "Forge.", lead: "Lead.", command: h("kbd", null, "init"), action }),
    );
    expect(own).toContain("<kbd>init</kbd>");
  });

  it("hatches the empty logo slots", () => {
    const out = html(h(LogoStrip, { label: "Forging at", names: ["Acme"], slots: 3 }));
    expect(out.match(/fg-logos-empty/g)).toHaveLength(2);
    expect(out).toContain("Acme");
  });

  it("ticks, dashes and words in the compare table", () => {
    const out = html(
      h(CompareTable, {
        label: "Plans",
        columns: [{ name: "Cloud", icon: CloudIcon }],
        groups: [
          {
            group: "Run",
            rows: [
              { name: "A", v: [true] },
              { name: "B", v: [false] },
              { name: "C", v: ["Soon"] },
            ],
          },
        ],
      }),
    );
    expect(out).toContain('aria-label="Not included"');
    expect(out).toContain("fg-cmp-soon");
    expect(out).toContain('role="table" aria-label="Plans"');
  });

  it("reads the next coordinate off the footer's and leaves the hearth to a script", () => {
    const out = html(
      h(SiteFooter, {
        from: "/0.9",
        columns: [
          { title: "Open source", links: [{ href: "#gh", label: "GitHub", icon: GithubIcon }] },
        ],
        legal: ["forgeron.sh"],
      }),
    );
    expect(out).toContain("<span>/0.9 → /1.0</span>");
    expect(out).toContain('data-hearth=""');
    expect(out).toContain('data-hearth-word=""');
    expect(out).toContain('class="fg-foot-icon-link"');
  });
});
