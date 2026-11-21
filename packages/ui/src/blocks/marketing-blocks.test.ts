import { CloudIcon, GithubIcon } from "@forgeron/icons";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ArtCard,
  ArtCardText,
  ArtCardTitle,
  Bento,
  BentoCell,
  BentoCellArt,
  BentoCellCopy,
  BentoCellTitle,
  CompareTable,
  CompareTableCell,
  CompareTableGroup,
  CompareTableHead,
  CompareTableName,
  CompareTableRow,
  CtaBand,
  CtaBandActions,
  CtaBandCopy,
  CtaBandInner,
  Faq,
  FaqAnswer,
  FaqItem,
  FaqQuestion,
  FigureGrid,
  FigureGridItem,
  Hero,
  HeroCta,
  HeroLead,
  HeroLeft,
  HeroRight,
  PlanCardGroup,
  PlanCardHead,
  PlanCardWhere,
  SiteFooter,
  SiteFooterBrand,
  SiteFooterCell,
  SiteFooterIndex,
  SiteNav,
  SiteNavBar,
  SiteNavLinks,
  StoryStep,
  StoryStepCopy,
  StoryStepTitle,
  LogoStrip,
  PixelFigure,
  PlanCard,
  SectionBand,
  SectionHead,
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

describe("marketing parts", () => {
  // These pin the `data-slot` names and the forwarding that `html` strips in the cases above.
  const raw = renderToStaticMarkup;
  it("forwards className and rest on a Bento and its cell, and builds the cell from its parts", () => {
    const out = raw(
      h(
        Bento,
        { id: "b", className: "mine" } as never,
        h(
          BentoCell,
          { span: 3, "data-x": "1" } as never,
          h(BentoCellArt, null, "art"),
          h(BentoCellCopy, null, h(BentoCellTitle, null, "Title")),
        ),
        h(BentoCell, { title: "Short", text: "Copy", className: "c" }),
      ),
    );
    expect(out).toContain('data-slot="bento" id="b" class="fg-bento mine"');
    expect(out).toContain('data-slot="bento-cell"');
    expect(out).toContain('data-x="1"');
    expect(out).toContain('data-slot="bento-cell-art"');
    expect(out).toContain('<h3 data-slot="bento-cell-title" class="text-title-3">Title</h3>');
    expect(out).toContain("fg-cell fg-ticks c");
  });
  it("lets an ArtCard and a FigureGrid take parts or shorthand", () => {
    const parts = raw(h(ArtCard, null, h(ArtCardTitle, null, "T"), h(ArtCardText, null, "X")));
    expect(parts).toContain('data-slot="art-card"');
    expect(parts).toContain('data-slot="art-card-title"');
    expect(parts).not.toContain("fg-artcard-copy");
    expect(raw(h(ArtCard, { title: "T", text: "X" }))).toContain('data-slot="art-card-copy"');
    const figures = raw(h(FigureGrid, null, h(FigureGridItem, { n: "7", label: "Tools" })));
    expect(figures).toContain('data-slot="figure-grid-item"');
    expect(figures).toContain("Tools");
  });
  it("composes a CompareTable, a Faq and a CtaBand from parts", () => {
    const table = raw(
      h(
        CompareTable,
        { label: "Plans" },
        h(CompareTableHead),
        h(CompareTableGroup, null, "Core"),
        h(
          CompareTableRow,
          null,
          h(CompareTableName, null, "Hosting"),
          h(CompareTableCell, { value: true }),
          h(CompareTableCell, { value: "Soon" }),
        ),
      ),
    );
    expect(table).toContain('role="table" aria-label="Plans"');
    expect(table).toContain('data-slot="compare-table-cell"');
    expect(table).toContain("fg-cmp-soon");
    const faq = raw(
      h(
        Faq,
        null,
        h(
          FaqItem,
          { open: true },
          h(FaqQuestion, { n: 3 }, "Why?"),
          h(FaqAnswer, null, "Because."),
        ),
      ),
    );
    expect(faq).toContain('<details data-slot="faq-item" open="">');
    expect(faq).toContain("Q.03");
    const cta = raw(
      h(
        CtaBand,
        { id: "start" },
        h(CtaBandInner, null, h(CtaBandCopy, null, "Copy"), h(CtaBandActions, null, "Go")),
      ),
    );
    expect(cta).toContain('<section data-slot="cta-band" id="start" class="fg-rail fg-cta">');
    expect(cta).toContain('data-slot="cta-band-inner"');
    expect(cta).not.toContain("fg-cta-art");
  });
  it("composes Hero, SiteNav, SiteFooter, PlanCard and StoryStep from parts", () => {
    expect(
      raw(
        h(
          Hero,
          { className: "h" },
          h(HeroLeft, null, "L"),
          h(HeroRight, null, h(HeroLead, null, "Lead"), h(HeroCta, null, "Go")),
        ),
      ),
    ).toContain('<div data-slot="hero" class="fg-hero h">');
    const nav = raw(h(SiteNav, null, h(SiteNavBar, null, h(SiteNavLinks, null, "links"))));
    expect(nav).toContain('aria-label="Main navigation"');
    expect(nav).toContain('data-slot="site-nav-links"');
    const foot = raw(
      h(
        SiteFooter,
        null,
        h(
          SiteFooterIndex,
          null,
          h(SiteFooterBrand, null, "logo"),
          h(SiteFooterCell, { title: "Docs" }, "x"),
        ),
      ),
    );
    expect(foot).toContain('data-slot="site-footer-cell"');
    expect(foot).toContain("fg-foot-title");
    const plan = raw(
      h(
        PlanCard,
        { featured: true },
        h(PlanCardHead, null, "Head"),
        h(PlanCardWhere, null, "Where"),
        h(PlanCardGroup, null, "g"),
      ),
    );
    expect(plan).toContain("fg-plan fg-ticks fg-plan-featured");
    expect(plan).toContain('data-slot="plan-card-where"');
    const step = raw(h(StoryStep, null, h(StoryStepCopy, null, h(StoryStepTitle, null, "Pick"))));
    expect(step).toContain('<li data-slot="story-step" class="fg-story-step fg-ticks">');
    expect(step).toContain('<h3 data-slot="story-step-title" class="text-title-1">Pick</h3>');
  });
  it("hands a part to its child with asChild", () => {
    const out = raw(h(BentoCellTitle, { asChild: true }, h("h4", { className: "k" }, "T")));
    expect(out).toContain('<h4 class="text-title-3 k" data-slot="bento-cell-title">T</h4>');
  });
});
