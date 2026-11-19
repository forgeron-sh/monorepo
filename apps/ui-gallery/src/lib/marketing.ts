// The Marketing section: the marketing blocks of forgeron.sh, in six coherent groups. Each group is
// one page; the blocks it holds are the entries of src/entries/marketing.ts, the atoms inside keep
// their own pages. The full landing page, put together from the six, is the overview.

export interface MarketingGroup {
  slug: string;
  name: string;
  summary: string;
  /** The slugs of its blocks, in src/entries/marketing.ts. */
  blocks: ReadonlyArray<string>;
  /** The slugs of the atoms it is made of, in src/registry.ts. */
  atoms: ReadonlyArray<string>;
}

export const marketing: ReadonlyArray<MarketingGroup> = [
  {
    slug: "navigation",
    name: "Navigation",
    summary:
      "The frame of every marketing page: the sticky bar at the top, the footer at the bottom.",
    blocks: ["site-nav", "site-footer"],
    atoms: ["logo-tile"],
  },
  {
    slug: "hero",
    name: "Hero",
    summary:
      "The top of a landing page: badge, pixel title, proof, command and action, then the names under it.",
    blocks: ["hero", "logo-strip"],
    atoms: ["mark-badge", "soon-tag"],
  },
  {
    slug: "story",
    name: "Story",
    summary:
      "A short argument in numbered steps (Pick, Shape, Ship): copy and points on one side, a drawing on the other.",
    blocks: ["story-step"],
    atoms: ["section-head", "section-band", "soon-tag"],
  },
  {
    slug: "showcase",
    name: "Showcase",
    summary:
      "What the product does, shown in glued cells: cards with a drawing, big figures and a bento of small features.",
    blocks: ["art-card", "figure-grid", "bento"],
    atoms: ["section-head", "pixel-figure", "logo-tile", "stepper", "soon-tag"],
  },
  {
    slug: "pricing",
    name: "Pricing",
    summary: "The plans side by side, and the table that tells them apart.",
    blocks: ["plan-card", "compare-table"],
    atoms: ["section-head", "soon-tag"],
  },
  {
    slug: "closing",
    name: "Closing",
    summary: "The end of the page: the questions people ask, then the last call to action.",
    blocks: ["faq", "cta-band"],
    atoms: ["section-head"],
  },
];
