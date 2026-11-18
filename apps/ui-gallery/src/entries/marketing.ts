/* The marketing blocks (forgeron.sh): documented on /identity/landing, not among the blocks. */
import type { Atom, PropRow } from "../types";

const className: PropRow = { name: "className", type: "string", description: "Extra classes." };
const art: PropRow = {
  name: "art / children",
  type: "ReactNode",
  description: "The drawing: a canvas or an image fills its box.",
};

/** The pieces of the landing page, in the order they are read. */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "site-nav",
    name: "Site nav",
    summary:
      "The bar at the top of a marketing page: logo, section links, GitHub and the primary action. Sticky.",
    imports: ["SiteNav"],
    props: [
      { name: "links", type: "{ href, label }[]", description: "Hidden under 860px." },
      { name: "start", type: "string", description: "Where the primary action leads." },
      { name: "startLabel", type: "string", default: '"Get started"', description: "Its label." },
      { name: "github", type: "string", description: "The repository, hidden under 480px." },
      { name: "current", type: "string", description: "The link marked as the current page." },
      className,
    ],
  },
  {
    slug: "hero",
    name: "Hero",
    summary:
      "The top of a landing page: badge, pixel title and proof on the left; lead, command and action on the right.",
    imports: ["Hero", "MarkBadge"],
    props: [
      {
        name: "badge",
        type: "ReactNode",
        description: "Above the title, a MarkBadge for instance.",
      },
      { name: "title", type: "string | string[]", description: "One string per line." },
      { name: "proof", type: "{ icon, text }[]", description: "What it is built on." },
      {
        name: "proofLabel",
        type: "string",
        default: '"Built on"',
        description: "Before the proof.",
      },
      { name: "lead", type: "ReactNode", description: "The promise." },
      {
        name: "command",
        type: "ReactNode",
        description: "A string is drawn as an unframed Command, before the action.",
      },
      { name: "action", type: "{ href, label }", description: "The primary action." },
      className,
    ],
  },
  {
    slug: "logo-strip",
    name: "Logo strip",
    summary: "Customer names in glued cells; the empty slots stay hatched until they are filled.",
    imports: ["LogoStrip"],
    props: [
      { name: "label", type: "string", description: "The lead cell: Forging at." },
      { name: "names", type: "string[]", description: "Real names only, in the pixel face." },
      { name: "slots", type: "number", description: "How many cells after the lead." },
      className,
    ],
  },
  {
    slug: "story-step",
    name: "Story step",
    summary:
      "Numbered steps glued in a column (Pick, Shape, Ship): copy and points on the left, a drawing on the right.",
    imports: ["StoryList", "StoryStep"],
    props: [
      { name: "n", type: "string", description: "Its number in the pixel face, 01." },
      { name: "label", type: "string", description: "Said for the number: Step 1." },
      { name: "title / text", type: "ReactNode", description: "The step and one sentence." },
      {
        name: "points",
        type: "{ icon, text }[]",
        description: "Short points at the foot of the copy.",
      },
      {
        name: "dots",
        type: "boolean",
        default: "true",
        description: "The dotted field behind the drawing.",
      },
      { name: "artClassName", type: "string", description: "To lay out the drawing's box." },
      { name: "children", type: "ReactNode", description: "The drawing: a mock, a scene." },
      className,
    ],
  },
  {
    slug: "bento",
    name: "Bento",
    summary:
      "Glued cells on six columns of 184px rows: a drawing, then a title and a line of copy.",
    imports: ["Bento", "BentoCell", "SoonTag"],
    props: [
      {
        name: "span",
        type: "2 | 3 | 4 | 6",
        description: "Columns out of six (full width under 900px).",
      },
      { name: "rows", type: "1 | 2 | 3", description: "Rows of 184px." },
      {
        name: "ticks",
        type: "boolean",
        default: "true",
        description: "Corner brackets (fg-ticks).",
      },
      { name: "corner", type: "ReactNode", description: "Pinned top right: a SoonTag." },
      { ...art, name: "art" },
      { name: "title / text", type: "ReactNode", description: "Under a rule." },
      className,
    ],
  },
  {
    slug: "art-card",
    name: "Art card",
    summary:
      "Cards three a row, glued: a drawing over dots, an icon or a word in ember, a title and a sentence.",
    imports: ["CardGrid", "ArtCard"],
    props: [
      {
        name: "artHeight (grid)",
        type: "number",
        default: "280",
        description: "Height of the drawings, px.",
      },
      {
        name: "--fg-artcard-pad / -gap / -min",
        type: "CSS",
        description: "Tune every copy block of a grid: padding, gap, minimum height.",
      },
      { name: "icon", type: "IconDefinition", description: "Above the title." },
      { name: "eyebrow", type: "ReactNode", description: "A word in ember above the title." },
      { name: "title / text", type: "ReactNode", description: "The card's copy." },
      { ...art, name: "art" },
      className,
    ],
  },
  {
    slug: "figure-grid",
    name: "Figure grid",
    summary: "Figures in the pixel face two a row, glued, each with what it counts.",
    imports: ["FigureGrid"],
    props: [
      { name: "figures", type: "{ n, label }[]", description: "348 · cities in the network." },
      className,
    ],
  },
  {
    slug: "plan-card",
    name: "Plan card",
    summary:
      "Plans side by side: a drawing, the name and tag, where it runs, the price, what it includes, one action.",
    imports: ["PlanGrid", "PlanCard"],
    props: [
      { name: "name", type: "string", description: "In the pixel face." },
      {
        name: "icon",
        type: "IconDefinition",
        description: "Before the name, in ember when featured.",
      },
      { name: "tag", type: "string", description: "Right of the name; Soon is dashed." },
      { name: "where", type: "ReactNode", description: "Who runs it, where." },
      {
        name: "price / unit",
        type: "string",
        description: "Without a price, the card shows none.",
      },
      { name: "groups", type: "{ title, items }[]", description: "What it includes, ticked." },
      {
        name: "action",
        type: "{ href, label, primary?, marker? }",
        description: "The button at the foot.",
      },
      { name: "featured", type: "boolean", description: "Raised, its icon and price in ember." },
      art,
      className,
    ],
  },
  {
    slug: "compare-table",
    name: "Compare table",
    summary:
      "Plans compared, a column each: ticks, dashes and words, rows in groups, a sticky head.",
    imports: ["CompareTable"],
    props: [
      { name: "label", type: "string", description: "Names the table." },
      { name: "columns", type: "{ name, icon }[]", description: "One per plan." },
      {
        name: "groups",
        type: "{ group, rows: { name, v }[] }[]",
        description: "v: true (included), false (not), or a word; Soon is dashed.",
      },
      { name: "--fg-cmp-top", type: "CSS", default: "60px", description: "Where the head sticks." },
      className,
    ],
  },
  {
    slug: "faq",
    name: "FAQ",
    summary: "Questions as native disclosures, numbered in ember; a pixel plus turns to a minus.",
    imports: ["Faq"],
    props: [
      { name: "items", type: "{ q, a }[]", description: "Numbered Q.01… in order." },
      { name: "openFirst", type: "boolean", default: "true", description: "The first one open." },
      className,
    ],
  },
  {
    slug: "cta-band",
    name: "CTA band",
    summary:
      "The closing call: the title and lead fill the left, the two ways to start sit in cells at its foot, a drawing on the right.",
    imports: ["CtaBand"],
    props: [
      { name: "id", type: "string", description: "The anchor the page's actions lead to." },
      { name: "title", type: "string | string[]", description: "Hero size, one string per line." },
      { name: "lead", type: "ReactNode", description: "Under the title." },
      { name: "action", type: "{ href, label }", description: "The primary action." },
      {
        name: "command / commandLabel",
        type: "string",
        description: "The command, framed, and its label.",
      },
      art,
      className,
    ],
  },
  {
    slug: "site-footer",
    name: "Site footer",
    summary:
      "The band, the site's index in glued cells, the wordmark across, the legal strip. The hearth is left to a script.",
    imports: ["SiteFooter"],
    props: [
      { name: "from", type: "string", description: "The last section's coordinate: /0.9 → /1.0." },
      {
        name: "columns",
        type: "{ title, links: { href, label, icon? }[] }[]",
        description: "After the logo's cell.",
      },
      {
        name: "wordmark",
        type: "string",
        default: '"forgeron"',
        description: "In the pixel face.",
      },
      { name: "legal", type: "string[]", description: "Facts in the hatched strip." },
      className,
    ],
  },
];
