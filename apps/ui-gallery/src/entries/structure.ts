/* Blocks of the "structure" group: everything around a document except its editor. */
import type { Atom, PropRow } from "../types";

const className: PropRow = { name: "className", type: "string", description: "Extra classes." };

/** Gallery pages of the "structure" blocks, in order. */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "tree",
    name: "Tree",
    summary:
      "A tree for any node (pages, folders, teams): arrows, selection, lazy children, drag to reorder, Alt + arrows, F2 rename.",
    imports: ["Tree", "structureMove", "structureShift"],
    props: [
      {
        name: "items",
        type: "TreeNode<D>[]",
        description:
          "{ id, label, icon?, count?, badge?, children?, hasChildren?, disabled?, readOnly?, data? }. hasChildren without children: loaded on first opening.",
      },
      {
        name: "expanded / defaultExpanded / onExpandedChange",
        type: "string[]",
        description: "The open nodes.",
      },
      {
        name: "selected / defaultSelected / onSelectedChange",
        type: "string[]",
        description: "The selection. ⌘ click toggles, ⇧ click and ⇧ arrows extend, Space toggles.",
      },
      {
        name: "selectionMode",
        type: `"single" | "multiple" | "none"`,
        default: `"single"`,
        description: "none: focus only.",
      },
      { name: "onActivate", type: "(id) => void", description: "Enter or a double click." },
      {
        name: "onLoadChildren",
        type: "(id) => void | Promise",
        description:
          "First opening of a node with hasChildren and no children; a promise shows the wait.",
      },
      {
        name: "renderItem",
        type: "(node, state) => ReactNode",
        description:
          "What a row shows in place of its label: state is { level, expanded, selected, focused, query }. The icon, count and rename stay.",
      },
      {
        name: "onMove",
        type: "(move) => void",
        description:
          "{ ids, parentId, index, items }: a drag or Alt + arrows moved nodes. It turns both on; keep items from the move. The drop line shows before, inside (dashed) or after; a closed node opens after 700 ms under the pointer.",
      },
      {
        name: "canDrop",
        type: "(ids, targetId, zone) => boolean",
        description: "Refuses a drop. A node is never dropped into itself.",
      },
      {
        name: "onRename / renaming / onRenamingChange",
        type: "(id, label) => void; string | null",
        description:
          "F2 edits the label in place: Enter commits, Escape cancels. Set renaming from a menu action.",
      },
      {
        name: "menu / onAction",
        type: "(ids) => ActionMenuEntry[]; (actionId, ids) => void",
        description: "The actions of the selection behind a right click. Give useActions(…).menu.",
      },
      {
        name: "filter",
        type: "string",
        description:
          "Keeps the nodes whose label holds the text, marks it and opens the way to them.",
      },
      { name: "empty", type: "ReactNode", description: "Shown when nothing is left." },
      { name: "label", type: "string", default: `"Tree"`, description: "Names the tree." },
      className,
    ],
  },
  {
    slug: "outline",
    name: "Outline",
    summary: "The table of contents of a document, nested by level, that follows your reading.",
    imports: ["Outline", "structureHeadingsFrom", "structureActiveHeading"],
    props: [
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
    imports: ["OrgChart", "OrgCardBody", "structureOrgLayout"],
    props: [
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
    imports: ["TemplateGallery", "structureFilterTemplates"],
    props: [
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
    imports: ["CoverPicker", "CoverArt", "STRUCTURE_COVER_PATTERNS"],
    props: [
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
  {
    slug: "inline-comments",
    name: "Inline comments",
    summary: "Threads in the margin, each beside the block or text range it is about.",
    imports: [
      "InlineComments",
      "inlineCommentAnchorTop",
      "structureRebaseAnchor",
      "structureLayoutThreads",
    ],
    props: [
      {
        name: "threads",
        type: "InlineThread[]",
        description:
          "{ id, anchor, status: 'open' | 'resolved', comments: { id, author, avatar?, at, body }[] }. anchor: { kind: 'block', blockId } or { kind: 'range', blockId, start, end, quote? }.",
      },
      {
        name: "anchorsIn",
        type: "string | RefObject | HTMLElement",
        description:
          "The element of the document whose [data-block-id] children are the blocks. The cards sit beside their anchors, and move when the document changes.",
      },
      {
        name: "measure",
        type: "(anchor) => number | null",
        description: "Where an anchor is (px from the top of the margin), instead of anchorsIn.",
      },
      {
        name: "layout",
        type: `"margin" | "stack"`,
        default: `"margin"`,
        description: "Beside the anchors, or one under the other.",
      },
      {
        name: "filter / defaultFilter / onFilterChange",
        type: `"open" | "resolved" | "all"`,
        default: `"open"`,
        description: "Which threads.",
      },
      {
        name: "active / defaultActive / onActiveChange",
        type: "string | null",
        description: "The thread in front: it stays on its anchor and the others make room.",
      },
      {
        name: "onReply",
        type: "(threadId, text, mentions) => void",
        description: "From the box under a thread.",
      },
      {
        name: "onResolve / onReopen",
        type: "(threadId) => void",
        description: "The thread's buttons.",
      },
      {
        name: "draft / onCreate / onCancelDraft",
        type: "StructureAnchor | null; (anchor, text, mentions) => void",
        description: "A selection to comment on: a card with a box at that place.",
      },
      {
        name: "mentions",
        type: "MentionOption[]",
        description: "The people @ offers in the boxes (RichComposer).",
      },
      { name: "gap", type: "number", default: "8", description: "Space between two cards." },
      className,
    ],
  },
  {
    slug: "diff-view",
    name: "Diff view",
    summary:
      "What changed between two texts or two records: unified or side by side, words marked.",
    imports: [
      "DiffView",
      "FieldDiff",
      "structureDiffRows",
      "structureDiffSeq",
      "structureDiffFields",
    ],
    props: [
      {
        name: "before / after",
        type: "string",
        description:
          "DiffView: the older and the newer text. Compared by lines (Myers), words marked inside a changed line.",
      },
      {
        name: "mode / defaultMode / onModeChange",
        type: `"unified" | "split"`,
        default: `"unified"`,
        description: "The layout.",
      },
      {
        name: "context",
        type: "number",
        default: "3",
        description: "Unchanged lines kept around a change.",
      },
      {
        name: "collapse",
        type: "boolean",
        default: "true",
        description: "Fold the longer runs: a button shows them.",
      },
      { name: "beforeLabel / afterLabel", type: "string", description: "Names the sides: v2, v4." },
      { name: "bare", type: "boolean", description: "No counts and no layout switch." },
      {
        name: "FieldDiff: before / after",
        type: "Record<string, unknown>",
        description:
          "The fields of two records. Nested ones by path (address.city), lists joined, added, removed and changed told in words as well as colour.",
      },
      {
        name: "FieldDiff: labels",
        type: "Record<string, string>",
        description: "The name shown for a key.",
      },
      {
        name: "FieldDiff: showUnchanged",
        type: "boolean",
        default: "false",
        description: "A button shows the fields that did not change.",
      },
      className,
    ],
  },
  {
    slug: "version-compare",
    name: "Version compare",
    summary: "The versions of a document or record in a list: pick two and see what changed.",
    imports: ["VersionCompare"],
    props: [
      {
        name: "versions",
        type: "CompareVersion[]",
        description:
          "Newest first: { id, label, at, by, note?, content }. content is a string (text diff) or a record (field diff).",
      },
      {
        name: "from / defaultFrom / onFromChange",
        type: "string",
        description: "The older side. Default: the version before the right one.",
      },
      {
        name: "to / defaultTo / onToChange",
        type: "string",
        description: "The newer side. Default: the current version.",
      },
      {
        name: "onRestore",
        type: "(id) => void",
        description: "Makes an older version the current one; leave out on a read-only record.",
      },
      {
        name: "labels",
        type: "Record<string, string>",
        description: "Names of the fields, for records.",
      },
      {
        name: "mode / defaultMode / onModeChange",
        type: `"unified" | "split"`,
        description: "The text diff layout.",
      },
      className,
    ],
  },
];
