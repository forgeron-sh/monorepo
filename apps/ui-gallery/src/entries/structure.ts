/* Blocks of the "structure" group: the outline, the org chart, templates and covers. */
import type { Atom, PropRow } from "../types";

const className: PropRow = { name: "className", type: "string", description: "Extra classes." };

/** Gallery pages of the "structure" blocks, in order. */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "outline",
    name: "Outline",
    summary: "The table of contents of a document, nested by level, that follows your reading.",
    imports: [
      "Outline",
      "structureHeadingsFrom",
      "structureActiveHeading",
      "OutlineTitle",
      "OutlineContent",
      "OutlineList",
      "OutlineItems",
      "OutlineItem",
      "OutlineLink",
      "useOutline",
    ],
    props: [
      {
        name: "children",
        type: "ReactNode",
        description:
          "The parts, in the order you choose: OutlineTitle, OutlineContent around OutlineList (OutlineItems, OutlineItem, OutlineLink for your own rows). Without them: the title and the list.",
      },
      {
        name: "headings",
        type: "{ id, text, level }[]",
        description: "In document order. The ids are the ones of the headings on the page.",
      },
      {
        name: "from",
        type: "string | RefObject | HTMLElement",
        description:
          "Instead of headings: the element whose h1 to h6 are read, again whenever it changes. A heading with no id is given one.",
      },
      {
        name: "scrollRoot",
        type: "string | RefObject | HTMLElement",
        default: "the page",
        description: "The element that scrolls.",
      },
      {
        name: "offset",
        type: "number",
        default: "96",
        description: "How far under the top a heading counts as reached.",
      },
      {
        name: "minLevel / maxLevel",
        type: "number",
        default: "1 / 6",
        description: "Only these levels.",
      },
      {
        name: "active / defaultActive / onActiveChange",
        type: "string | null",
        description: "The heading being read: set by scrolling, or by you.",
      },
      {
        name: "onSelect",
        type: "(id, event) => void",
        description: "A click. It scrolls and focuses the heading unless you call preventDefault.",
      },
      {
        name: "collapsible / collapsed / defaultCollapsed / onCollapsedChange",
        type: "boolean; string[]",
        default: "true",
        description: "A branch folds.",
      },
      {
        name: "foldable / open / defaultOpen / onOpenChange",
        type: "boolean",
        description: "The whole outline folds behind its title.",
      },
      {
        name: "title",
        type: "string",
        default: `"On this page"`,
        description: "Heading of the panel.",
      },
      className,
    ],
  },
  {
    slug: "org-chart",
    name: "Org chart",
    summary:
      "People or units as a hierarchy: cards joined by pixel connectors, folds, selection, keyboard.",
    imports: [
      "OrgChart",
      "OrgCardBody",
      "structureOrgLayout",
      "OrgChartCanvas",
      "OrgChartLinks",
      "OrgChartCards",
      "OrgChartCard",
      "OrgChartFold",
      "useOrgChart",
    ],
    props: [
      {
        name: "children",
        type: "ReactNode",
        description:
          "The parts: OrgChartCanvas holding OrgChartLinks and OrgChartCards (or your own OrgChartCard by id). Without them: the canvas.",
      },
      {
        name: "roots",
        type: "OrgPerson[]",
        description:
          "{ id, name, title?, meta?, avatar?, vacant?, badge?, children? }. Several roots sit side by side. vacant: a dashed card that says Vacant, name is the label of the post.",
      },
      {
        name: "variant",
        type: `"compact" | "detailed"`,
        default: `"compact"`,
        description: "Avatar, name and role; or more room with the team and the count.",
      },
      {
        name: "collapsed / defaultCollapsed / onCollapsedChange",
        type: "string[]",
        description:
          "The cards whose reports are folded. The button at the foot of a card, or − and +.",
      },
      {
        name: "selected / defaultSelected / onSelectedChange",
        type: "string | null",
        description: "The picked card.",
      },
      { name: "onActivate", type: "(id) => void", description: "Enter or a double click." },
      {
        name: "renderCard",
        type: "(person, state) => ReactNode",
        description: "Your own card inside the frame; OrgCardBody is the default one.",
      },
      {
        name: "label",
        type: "string",
        default: `"Organisation chart"`,
        description:
          "Names the tree. Arrows walk it: down to the first report, up, sideways along the row.",
      },
      className,
    ],
  },
  {
    slug: "template-gallery",
    name: "Template gallery",
    summary: "Templates to start from: search, categories, a blank entry, and a preview pane.",
    imports: [
      "TemplateGallery",
      "structureFilterTemplates",
      "TemplateGalleryMain",
      "TemplateGalleryBar",
      "TemplateGallerySearch",
      "TemplateGalleryCategories",
      "TemplateGalleryGrid",
      "TemplateGalleryCard",
      "TemplateGalleryEmpty",
      "TemplateGalleryPane",
      "useTemplateGallery",
    ],
    props: [
      {
        name: "children",
        type: "ReactNode",
        description:
          "The parts: Main (Bar with Search and Categories, Grid, Empty) and Pane. Without them: all of it.",
      },
      {
        name: "templates",
        type: "TemplateItem[]",
        description:
          "{ id, name, description?, category?, keywords?, icon?, thumbnail?, preview?, badge? }. preview is what the pane shows.",
      },
      {
        name: "category / defaultCategory / onCategoryChange",
        type: "string | null",
        description: "null is all of them.",
      },
      { name: "query / defaultQuery / onQueryChange", type: "string", description: "The search." },
      {
        name: "selected / defaultSelected / onSelectedChange",
        type: "string | null",
        description: "The one pointed at; null is the blank entry.",
      },
      {
        name: "blank",
        type: "boolean | { name?, description? }",
        default: "true",
        description: "An entry to start from nothing, first in the grid.",
      },
      {
        name: "onChoose",
        type: "(id | null) => void",
        description: "The button, Enter or a double click. null is blank.",
      },
      {
        name: "chooseLabel",
        type: "string",
        default: `"Use template"`,
        description: "The button.",
      },
      { name: "empty", type: "ReactNode", description: "When the search finds nothing." },
      className,
    ],
  },
  {
    slug: "cover-picker",
    name: "Cover picker",
    summary:
      "A page's banner: generated pixel patterns, an uploaded or linked picture, its position, removal.",
    imports: [
      "CoverPicker",
      "CoverArt",
      "STRUCTURE_COVER_PATTERNS",
      "CoverPickerStage",
      "CoverPickerSource",
      "CoverPickerGallery",
      "CoverPickerUpload",
      "CoverPickerLink",
      "CoverPickerError",
      "useCoverPicker",
    ],
    props: [
      {
        name: "children",
        type: "ReactNode",
        description:
          "The parts: Stage, Source, Gallery, Upload, Link, Error. Each tab part shows only on its tab. Without them: all of them.",
      },
      {
        name: "value / defaultValue / onChange",
        type: "CoverValue | null",
        description:
          "{ type: 'pattern', pattern, tone } or { type: 'image', src, alt?, position? }. null: none.",
      },
      {
        name: "patterns",
        type: "StructureCoverPattern[]",
        default: "all nine",
        description: "ember, dusk, hatch, grid, checker, steps, noise, waves, bricks.",
      },
      {
        name: "tones",
        type: `("accent" | "ink" | "muted")[]`,
        default: "all three",
        description: "Drawn from --accent, --ink and --line-strong, on --bg-raised.",
      },
      {
        name: "upload / onUpload",
        type: "boolean; (file) => string | Promise<string>",
        default: "true",
        description:
          "The upload tab (FileInput). onUpload stores the file and gives back the address; without it a blob: address of the page is kept.",
      },
      {
        name: "link",
        type: "boolean",
        default: "true",
        description:
          "The tab to paste a picture address. Only https, paths, blob and data images are accepted.",
      },
      {
        name: "uploadOptions",
        type: "{ accept?, maxSize? }",
        default: "images, 5 MB",
        description: "Limits of the upload.",
      },
      className,
    ],
  },
];
