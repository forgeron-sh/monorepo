import { entries as approvalBlocks } from "./entries/approval";
import { entries as automationBlocks } from "./entries/automation";
import { entries as conversationBlocks } from "./entries/conversation";
import { entries as dataBlocks } from "./entries/data";
import { entries as datahubBlocks } from "./entries/datahub";
import { entries as driveBlocks } from "./entries/drive";
import { entries as fieldEntries } from "./entries/fields";
import { entries as filteringBlocks } from "./entries/filtering";
import { entries as financeBlocks } from "./entries/finance";
import { entries as hookEntries } from "./entries/hooks";
import { entries as iconPickerBlocks } from "./entries/icon-picker";
import { entries as listBlocks } from "./entries/lists";
import { entries as navigationBlocks } from "./entries/navigation";
import { entries as recordBlocks } from "./entries/record";
import { entries as timeBlocks } from "./entries/time";
import { entries as viewBlocks } from "./entries/views";
import {
  BeachIcon,
  Calendar01Icon,
  ChartLineData01Icon,
  CustomerSupportIcon,
  DashboardSquare01Icon,
  FileEditIcon,
  Folder01Icon,
  Invoice01Icon,
  Mail01Icon,
  Message01Icon,
  Note01Icon,
  ReceiptEuroIcon,
  SignatureIcon,
  Task01Icon,
  UserGroupIcon,
  UserListIcon,
} from "@forgeron/icons";
import type { IconDefinition } from "@forgeron/icons";
import type { Atom, PropRow } from "./types";

// What the gallery shows. Atoms are ready: each one has a page, its examples in
// `src/examples/<slug>/` (the first one is the demo of the index) and its props. Blocks and pages
// are planned: they are listed, marked Soon, and get their pages once built.

export interface Planned {
  name: string;
  icon: IconDefinition;
  summary: string;
}

const className: PropRow = { name: "className", type: "string", description: "Extra classes." };

export const atoms: ReadonlyArray<Atom> = [
  {
    slug: "button",
    name: "Button",
    summary: "An action, or a link that looks like one. One primary per view.",
    imports: ["Button"],
    props: [
      {
        name: "variant",
        type: `"primary" | "secondary" | "ink" | "ghost" | "danger"`,
        default: `"secondary"`,
        description: "Primary is filled in ember, black text; danger is destructive.",
      },
      {
        name: "size",
        type: `"sm" | "md" | "lg"`,
        default: `"md"`,
        description: "30, 32 or 40 px.",
      },
      { name: "marker", type: "boolean", description: "The square marker before the label." },
      { name: "kbd", type: "string", description: "A shortcut on the right, e.g. ⌘K." },
      { name: "href", type: "string", description: "Renders an anchor styled as a button." },
      className,
    ],
  },
  {
    slug: "icon-button",
    name: "Icon button",
    summary: "A square button that holds one pixel icon: every toolbar.",
    imports: ["IconButton"],
    props: [
      { name: "icon", type: "IconDefinition", description: "The pixel icon." },
      { name: "label", type: "string", description: "Its name: an icon alone has none." },
      {
        name: "variant",
        type: '"ghost" | "boxed"',
        default: '"ghost"',
        description: "Framed on hover, or always.",
      },
      { name: "size", type: '"sm" | "md"', default: '"md"', description: "24 or 32 px." },
      { name: "href", type: "string", description: "Renders an anchor." },
      className,
    ],
  },

  {
    slug: "link",
    name: "Link",
    summary: "A standalone text link in mono capitals, ember on hover.",
    imports: ["Link"],
    props: [
      { name: "href", type: "string", description: "Where it goes." },
      {
        name: "...rest",
        type: "AnchorHTMLAttributes",
        description: "target, rel, aria-current…",
      },
      className,
    ],
  },
  {
    slug: "badge",
    name: "Badge",
    summary: "A short mono label in capitals: a status, a role, a version.",
    imports: ["Badge", "EnvTag"],
    props: [
      {
        name: "tone",
        type: `"neutral" | "strong" | "success" | "warning" | "danger"`,
        default: `"neutral"`,
        description: "The colour of the state.",
      },
      { name: "dot", type: "boolean", description: "A square LED before the text." },
      { name: "mono", type: "boolean", description: "Keeps the case of an identifier." },
      {
        name: "env (EnvTag)",
        type: `"production" | "channel" | "preview"`,
        description: "The channel of a version, told by shape.",
      },
      className,
    ],
  },
  {
    slug: "tag",
    name: "Tag",
    summary: "A bracketed mono label: section names, file metadata, versions.",
    imports: ["Tag"],
    props: [
      { name: "strong", type: "ReactNode", description: "The part set in ink." },
      { name: "children", type: "ReactNode", description: "The rest, in muted ink." },
      className,
    ],
  },
  {
    slug: "chip",
    name: "Chip",
    summary: "A small framed word, one of a set; the active one lights in ember.",
    imports: ["Chip"],
    props: [
      { name: "active", type: "boolean", description: "The selected one of the set." },
      className,
    ],
  },
  {
    slug: "led",
    name: "Led",
    summary: "A 6 px square: a status next to its word, or the marker of the lab language.",
    imports: ["Led"],
    props: [
      {
        name: "tone",
        type: `"neutral" | "success" | "warning" | "danger" | "accent" | "current"`,
        default: `"neutral"`,
        description: "Current takes the text colour.",
      },
      { name: "label", type: "string", description: "Names a LED that stands alone." },
      className,
    ],
  },
  {
    slug: "kbd",
    name: "Kbd",
    summary: "A keyboard shortcut, one framed cap per key.",
    imports: ["Kbd"],
    props: [
      {
        name: "keys",
        type: "string | string[]",
        description: "One key, or one entry per key.",
      },
      className,
    ],
  },
  {
    slug: "avatar",
    name: "Avatar",
    summary: "A person's picture, else their initials, in a sharp square.",
    imports: ["Avatar"],
    props: [
      { name: "name", type: "string", description: "Name or email; the initials come from it." },
      { name: "size", type: "number", default: "24", description: "In px." },
      { name: "src", type: "string", description: "The picture, when there is one." },
      className,
    ],
  },
  {
    slug: "avatar-group",
    name: "Avatar group",
    summary: "The people on a record, overlapping, the rest counted.",
    imports: ["AvatarGroup"],
    props: [
      { name: "names", type: "string[]", description: "Names or emails, in order." },
      { name: "max", type: "number", default: "4", description: "Avatars before the +n square." },
      { name: "size", type: "number", default: "24", description: "In px." },
      { name: "label", type: "string", description: "Said once, e.g. 6 members." },
      className,
    ],
  },
  {
    slug: "app-tile",
    name: "App tile",
    summary: "The square mark of an app: its icon on a flat tile.",
    imports: ["AppTile"],
    props: [
      { name: "icon", type: "IconDefinition", description: "The app's icon." },
      { name: "size", type: "20 | 32 | 48", default: "32", description: "In px." },
      {
        name: "tone",
        type: '"accent" | "ink" | "neutral"',
        default: '"accent"',
        description: "An app, the workspace, not installed.",
      },
      { name: "label", type: "string", description: "Names a tile without its app's name." },
      className,
    ],
  },
  {
    slug: "swatch",
    name: "Swatch",
    summary: "A small square of colour that tells a project or a label apart.",
    imports: ["Swatch"],
    props: [
      { name: "color", type: "string", description: "Any CSS colour." },
      { name: "children", type: "ReactNode", description: "The name next to it." },
      className,
    ],
  },

  {
    slug: "icon",
    name: "Icon",
    summary: "A pixel icon of @forgeron/icons, its secondary pixels in ember.",
    imports: ["Icon"],
    props: [
      { name: "icon", type: "IconDefinition", description: "e.g. CloudIcon." },
      {
        name: "size",
        type: "number",
        default: "24",
        description: "A multiple of 12 keeps every pixel whole.",
      },
      {
        name: "variant",
        type: `"duo" | "mono"`,
        default: `"duo"`,
        description: "Two tones or one.",
      },
      { name: "title", type: "string", description: "Names the icon; else it is decorative." },
      className,
    ],
  },
  {
    slug: "input",
    name: "Input",
    summary: "One line of text, or several with Textarea. 32 px, sharp corners.",
    imports: ["Input", "Textarea"],
    props: [
      { name: "mono", type: "boolean", description: "For what gets copied: domains, ids." },
      {
        name: "...rest",
        type: "InputHTMLAttributes",
        description: "Every attribute of the native element.",
      },
      className,
    ],
  },
  {
    slug: "search-box",
    name: "Search box",
    summary: "The magnifier, the query and the shortcut that reaches it.",
    imports: ["SearchBox"],
    props: [
      { name: "shortcut", type: "string | string[]", description: "Keys shown at the end." },
      {
        name: "...rest",
        type: "InputHTMLAttributes",
        description: "placeholder, value, onChange…",
      },
      className,
    ],
  },
  {
    slug: "select",
    name: "Select",
    summary: "One choice in a list that opens below: icons, hints, typeahead.",
    imports: ["SelectMenu"],
    props: [
      { name: "label", type: "string", description: "Names the control." },
      { name: "showLabel", type: "boolean", description: "Writes the label above." },
      {
        name: "options",
        type: "{ value, label, icon?, hint?, disabled? }[]",
        description: "The choices.",
      },
      { name: "value / defaultValue", type: "string | null", description: "Controlled or not." },
      { name: "onChange", type: "(value: string | null) => void", description: "On a new choice." },
      {
        name: "variant",
        type: '"field" | "chip"',
        default: '"field"',
        description: "A form control, or a property chip.",
      },
      {
        name: "size",
        type: '"sm" | "md"',
        default: '"md"',
        description: "The field at 32px, or 26px in a dense row or a popover.",
      },
      {
        name: "placeholder",
        type: "string",
        default: '"Choose…"',
        description: "While nothing is chosen.",
      },
      className,
    ],
  },

  {
    slug: "native-select",
    name: "Native select",
    summary: "The browser's own select: phone pickers for free, plain options only.",
    imports: ["Select"],
    props: [
      {
        name: "options",
        type: "{ value, label, disabled? }[]",
        description: "The choices.",
      },
      { name: "placeholder", type: "ReactNode", description: "Shown while nothing is chosen." },
      {
        name: "...rest",
        type: "SelectHTMLAttributes",
        description: "value, onChange, disabled…",
      },
      className,
    ],
  },
  {
    slug: "checkbox",
    name: "Checkbox",
    summary: "A square box that fills with ember when checked.",
    imports: ["Checkbox"],
    props: [
      { name: "label", type: "ReactNode", description: "Always written next to the box." },
      {
        name: "...rest",
        type: "InputHTMLAttributes",
        description: "checked, defaultChecked, onChange…",
      },
      className,
    ],
  },
  {
    slug: "radio",
    name: "Radio group",
    summary: "One choice among a few, all visible. The chosen box holds a square.",
    imports: ["RadioGroup"],
    props: [
      { name: "label", type: "ReactNode", description: "The question, said once (legend)." },
      {
        name: "options",
        type: "{ value, label, hint?, disabled? }[]",
        description: "The choices.",
      },
      { name: "value / defaultValue", type: "string", description: "Controlled or not." },
      { name: "onChange", type: "(value: string) => void", description: "On a new choice." },
      {
        name: "direction",
        type: `"column" | "row"`,
        default: `"column"`,
        description: "Stacked or side by side.",
      },
      { name: "name", type: "string", description: "Made up when absent." },
      className,
    ],
  },
  {
    slug: "calendar",
    name: "Calendar",
    summary: "A month of days, Monday first, driven from the keyboard.",
    imports: ["Calendar"],
    props: [
      { name: "value", type: "string", description: "The chosen day, YYYY-MM-DD." },
      { name: "onChange", type: "(value: string) => void", description: "On a choice." },
      { name: "today", type: "string", default: "the device's date", description: "Outlined." },
      { name: "min / max", type: "string", description: "Days outside cannot be chosen." },
      { name: "label", type: "string", default: '"Calendar"', description: "Names the grid." },
      className,
    ],
  },
  {
    slug: "date-picker",
    name: "Date picker",
    summary: "A date behind a chip: quick picks first, then the month.",
    imports: ["DatePicker"],
    props: [
      { name: "label", type: "string", description: "e.g. Due date." },
      { name: "value / defaultValue", type: "string | null", description: "YYYY-MM-DD, or none." },
      {
        name: "onChange",
        type: "(value: string | null) => void",
        description: "On a choice or a removal.",
      },
      {
        name: "presets",
        type: "{ label, value }[]",
        default: "duePresets(today)",
        description: "Quick picks; [] for none.",
      },
      {
        name: "clearable",
        type: "boolean",
        default: "true",
        description: "Offers to remove the date.",
      },
      {
        name: "variant",
        type: '"chip" | "field"',
        default: '"chip"',
        description: "A record's property, or a form control.",
      },
      className,
    ],
  },

  {
    slug: "switch",
    name: "Switch",
    summary: "An on/off setting that applies at once.",
    imports: ["Switch"],
    props: [
      { name: "label", type: "ReactNode", description: "Says what turns on." },
      {
        name: "...rest",
        type: "InputHTMLAttributes",
        description: "checked, defaultChecked, onChange, disabled…",
      },
      className,
    ],
  },
  {
    slug: "segmented",
    name: "Segmented",
    summary: "A switch between a few views or modes of the same thing.",
    imports: ["Segmented"],
    props: [
      { name: "label", type: "string", description: "Names the group, e.g. View." },
      {
        name: "options",
        type: "{ value, label, ariaLabel? }[]",
        description: "The segments.",
      },
      { name: "value", type: "string", description: "The chosen one." },
      { name: "onChange", type: "(value: string) => void", description: "On a click." },
      { name: "iconOnly", type: "boolean", description: "Square segments for icons." },
      className,
    ],
  },
  {
    slug: "field",
    name: "Field",
    summary: "A label, a control, a hint and an error, tied together.",
    imports: ["Field", "Input"],
    props: [
      { name: "label", type: "ReactNode", description: "Above the control." },
      { name: "hint", type: "ReactNode", description: "Help under the control." },
      { name: "error", type: "ReactNode", description: "What happened, then what to do." },
      {
        name: "children",
        type: "(control) => ReactNode",
        description: "Spread `control` on the input: id, aria-describedby, aria-invalid.",
      },
      className,
    ],
  },
  {
    slug: "progress",
    name: "Progress",
    summary: "How far a piece of work or a quota has gone.",
    imports: ["Progress"],
    props: [
      { name: "label", type: "string", description: "Written above, said to screen readers." },
      { name: "value", type: "number", description: "Absent: no known end." },
      { name: "max", type: "number", default: "100", description: "The end." },
      { name: "showValue", type: "boolean", description: "Writes the percentage." },
      {
        name: "tone",
        type: `"accent" | "success" | "danger"`,
        default: `"accent"`,
        description: "Work, done, overrun.",
      },
      className,
    ],
  },
  {
    slug: "spinner",
    name: "Spinner",
    summary: "Eight pixels lighting in turn, and a word: the wait, when its shape is unknown.",
    imports: ["Spinner"],
    props: [
      {
        name: "label",
        type: "string",
        default: `"Loading"`,
        description: "Shown and announced.",
      },
      className,
    ],
  },
  {
    slug: "skeleton",
    name: "Skeleton",
    summary: "The shape of what is coming, in place of a spinner.",
    imports: ["Skeleton", "SkeletonText", "SkeletonGroup"],
    props: [
      { name: "width / height", type: "number | string", description: "Skeleton: its box." },
      { name: "lines", type: "number", description: "SkeletonText: how many lines." },
      { name: "label", type: "string", description: "SkeletonGroup: the wait, said once." },
      className,
    ],
  },
  {
    slug: "separator",
    name: "Separator",
    summary: "A line between two groups, or the hatched band that opens a section.",
    imports: ["Separator"],
    props: [
      {
        name: "orientation",
        type: `"horizontal" | "vertical"`,
        default: `"horizontal"`,
        description: "Vertical between items of a row.",
      },
      {
        name: "variant",
        type: `"line" | "hatch"`,
        default: `"line"`,
        description: "Hatch is the section band.",
      },
      { name: "children", type: "ReactNode", description: "The label on a hatch band." },
      className,
    ],
  },
  {
    slug: "breadcrumb",
    name: "Breadcrumb",
    summary: "Where the page sits: its parents as links, the page last.",
    imports: ["Breadcrumb"],
    props: [
      {
        name: "items",
        type: "{ label, href?, icon? }[]",
        description: "Parents first; the last one is the page.",
      },
      className,
    ],
  },

  {
    slug: "notice",
    name: "Notice",
    summary: "A message in the flow of the page; the state always comes with a word.",
    imports: ["Notice"],
    props: [
      {
        name: "tone",
        type: `"info" | "success" | "warning" | "danger"`,
        default: `"info"`,
        description: "Note, Done, Warning, Error.",
      },
      { name: "title", type: "ReactNode", description: "One line." },
      { name: "action", type: "ReactNode", description: "The thing to do next." },
      { name: "children", type: "ReactNode", description: "The detail." },
      className,
    ],
  },
  {
    slug: "empty-state",
    name: "Empty state",
    summary: "What a list shows with nothing in it, and what to do about it.",
    imports: ["EmptyState"],
    props: [
      { name: "title", type: "ReactNode", description: "One line." },
      { name: "description", type: "ReactNode", description: "The way out, links allowed." },
      { name: "icon", type: "IconDefinition", description: "Above the title." },
      {
        name: "variant",
        type: '"plain" | "hatch"',
        default: '"plain"',
        description: "A dashed frame, or the hatched field.",
      },
      { name: "action", type: "ReactNode", description: "The one thing to do." },
      className,
    ],
  },
  {
    slug: "toast",
    name: "Toast",
    summary: "A short confirmation at the bottom right, with an undo.",
    imports: ["Toaster", "useToast"],
    props: [
      {
        name: "limit (Toaster)",
        type: "number",
        default: "3",
        description: "How many show at once.",
      },
      {
        name: "add (useToast)",
        type: "({ title, description?, type?, actionProps?, timeout? }) => id",
        description: "Shows one.",
      },
      { name: "type", type: '"success" | "danger"', description: "The mark on its left edge." },
      className,
    ],
  },
  {
    slug: "tooltip",
    name: "Tooltip",
    summary: "A few words on hover or focus of a control. Not shown on touch.",
    imports: ["Tooltip"],
    props: [
      { name: "content", type: "ReactNode", description: "What the control does." },
      { name: "kbd", type: "string", description: "Its shortcut." },
      {
        name: "side",
        type: '"top" | "bottom" | "left" | "right"',
        default: '"top"',
        description: "Where it opens.",
      },
      { name: "children", type: "ReactElement", description: "The control, which takes a ref." },
      className,
    ],
  },

  {
    slug: "tabs",
    name: "Tabs",
    summary: "Views of one page; arrows, Home and End move between them.",
    imports: ["Tabs"],
    props: [
      { name: "label", type: "string", description: "Names the tab list." },
      { name: "tabs", type: "{ id, label }[]", description: "The tabs." },
      { name: "value", type: "string", description: "The selected id." },
      { name: "onChange", type: "(id: string) => void", description: "On a new tab." },
      { name: "children", type: "ReactNode", description: "The panel of the selected tab." },
      className,
    ],
  },
  // Marketing atoms: the pieces of the landing pages (forgeron.sh).
  {
    slug: "section-head",
    name: "Section head",
    summary:
      "The head of a marketing section: its coordinate in ember, the pixel title, a lead. Sits on the page's rail (fg-rail).",
    imports: ["SectionHead"],
    props: [
      { name: "index", type: "string", description: "The coordinate, /0.1, in the pixel face." },
      { name: "title", type: "string | string[]", description: "The title, one string per line." },
      {
        name: "titleAs",
        type: '"h1" | "h2"',
        default: '"h2"',
        description: "h1 when it opens the page.",
      },
      { name: "lead", type: "ReactNode", description: "One or two sentences under the title." },
      { name: "meta", type: "ReactNode", description: "A mono note right of the coordinate." },
      className,
    ],
  },
  {
    slug: "section-band",
    name: "Section band",
    summary:
      "The hatched band between two sections, /0.1 → /0.2 and the next one's name. It takes the rule of the block above.",
    imports: ["SectionBand"],
    props: [
      { name: "from", type: "string", description: "The coordinate of the section above." },
      { name: "to", type: "string", description: "The coordinate of the section below." },
      { name: "label", type: "string", description: "What comes next, shown in brackets." },
      {
        name: "className",
        type: "string",
        description:
          "fg-rail to sit on the page's rail. Cards take fg-ticks (corner brackets), drawings fg-dots.",
      },
    ],
  },
  {
    slug: "pixel-figure",
    name: "Pixel figure",
    summary: "A figure, a step or a short name drawn in the pixel face at a fixed height.",
    imports: ["PixelFigure"],
    props: [
      { name: "text", type: "string", description: "What is drawn: 348, $14.99, 01." },
      {
        name: "label",
        type: "string",
        default: "text",
        description: "Said to assistive technology.",
      },
      {
        name: "size",
        type: '"sm" | "md" | "lg" | "xl"',
        default: '"lg"',
        description: "20px (a name), 32px (a price), 56px (a figure), 70px (a step).",
      },
      {
        name: "tone",
        type: '"accent" | "ink" | "inherit"',
        default: '"accent"',
        description: "Its colour.",
      },
      className,
    ],
  },
  {
    slug: "soon-tag",
    name: "Soon tag",
    summary: "A small dashed tag in the bitmap face next to what is announced but not there yet.",
    imports: ["SoonTag"],
    props: [
      { name: "children", type: "ReactNode", default: '"Soon"', description: "The word." },
      className,
    ],
  },
  {
    slug: "mark-badge",
    name: "Mark badge",
    summary: "An outlined mono pill led by a small square mark, above a hero title.",
    imports: ["MarkBadge"],
    props: [
      { name: "mark", type: "ReactNode", description: "The mark, 18 × 22: an SVG fills it." },
      { name: "children", type: "ReactNode", description: "The words, in mono capitals." },
      className,
    ],
  },
  {
    slug: "logo-tile",
    name: "Logo tile",
    summary: "A product's pixel mark, or its initial, in a 28px square. Decorative.",
    imports: ["LogoTile"],
    props: [
      { name: "icon", type: "IconDefinition", description: "Its pixel brand mark, drawn at 16px." },
      { name: "name", type: "string", description: "Without an icon, its first letter is drawn." },
      className,
    ],
  },
  {
    slug: "stepper",
    name: "Stepper",
    summary:
      "A whole number between a minus and a plus button. Markup only: the page wires data-step and reads the field.",
    imports: ["Stepper"],
    props: [
      {
        name: "label",
        type: "string",
        description: "Names the field; the buttons read Fewer / More.",
      },
      { name: "value", type: "number", description: "The starting value, 0 to 9999." },
      {
        name: "...rest",
        type: "HTMLAttributes<HTMLSpanElement>",
        description: "On the root, e.g. data-*.",
      },
      className,
    ],
  },
  ...fieldEntries,
];

const pickerProps = (extra: ReadonlyArray<PropRow> = []): ReadonlyArray<PropRow> => [
  ...extra,
  { name: "value / defaultValue", type: "see type", description: "Controlled or not." },
  { name: "onChange", type: "(value) => void", description: "On a new choice." },
  {
    name: "variant",
    type: `"chip" | "field"`,
    default: `"chip"`,
    description: "A record's property, or a form control.",
  },
  { name: "markOnly", type: "boolean", description: "The mark alone, for dense rows." },
  className,
];

/** The pickers of a record's properties, after Tasks. */
const pickers: ReadonlyArray<Atom> = [
  {
    slug: "status-picker",
    name: "Status picker",
    summary: "Backlog to Done: the glyph tells the state, the digits choose it.",
    imports: ["StatusPicker"],
    props: pickerProps([
      {
        name: "value",
        type: "StatusKind",
        description: "backlog, todo, progress, review, done, canceled.",
      },
      {
        name: "statuses",
        type: "StatusKind[]",
        default: "all six",
        description: "The states offered, in order.",
      },
      {
        name: "names",
        type: "Partial<Record<StatusKind, string>>",
        description: "Other names for the states.",
      },
    ]),
  },
  {
    slug: "priority-picker",
    name: "Priority picker",
    summary: "No priority to Urgent: bars, and an ember square for urgent.",
    imports: ["PriorityPicker"],
    props: pickerProps([
      { name: "value", type: "0 | 1 | 2 | 3 | 4", description: "None, urgent, high, medium, low." },
    ]),
  },
  {
    slug: "size-picker",
    name: "Size picker",
    summary: "The size of a piece of work, XS to XL, with its points.",
    imports: ["SizePicker"],
    props: pickerProps([
      { name: "value", type: "0 | 1 | 2 | 3 | 4 | 5", description: "None, then XS to XL." },
      { name: "points", type: "number[]", description: "Points per size, shown as hints." },
    ]),
  },
  {
    slug: "due-date",
    name: "Due date",
    summary: "Tomorrow, end of week, next week, in two weeks, or a day of the month.",
    imports: ["DatePicker"],
    props: pickerProps([
      { name: "label", type: "string", description: "Due date, Start date…" },
      {
        name: "presets",
        type: "{ label, value }[]",
        default: "duePresets(today)",
        description: "The quick picks.",
      },
      {
        name: "clearable",
        type: "boolean",
        default: "true",
        description: "Offers to remove the date.",
      },
    ]),
  },
  {
    slug: "quarter-picker",
    name: "Quarter picker",
    summary: "Q1 to Q4 of the years offered; four cells mark which one.",
    imports: ["QuarterPicker"],
    props: pickerProps([
      { name: "years", type: "number[]", description: "e.g. [2026, 2027]." },
      { name: "value", type: "string | null", description: "2026-Q4." },
      { name: "clearable", type: "boolean", description: "Offers No quarter." },
    ]),
  },
  {
    slug: "person-picker",
    name: "Person picker",
    summary: "An assignee, an author, an owner: you first, typing a name jumps to it.",
    imports: ["PersonPicker"],
    props: pickerProps([
      {
        name: "label",
        type: "string",
        default: `"Assignee"`,
        description: "Assignee, Author, Owner.",
      },
      { name: "people", type: "{ id, name, hint?, src? }[]", description: "The people offered." },
      { name: "me", type: "string", description: "The viewer: listed first, marked (you)." },
      { name: "noneLabel", type: "string", description: "The entry for nobody, e.g. No assignee." },
    ]),
  },
  {
    slug: "label-picker",
    name: "Label picker",
    summary: "Several labels at once, each with its colour.",
    imports: ["LabelPicker"],
    props: [
      { name: "labels", type: "{ value, label, color }[]", description: "The labels offered." },
      { name: "value / defaultValue", type: "string[]", description: "Controlled or not." },
      { name: "onChange", type: "(value: string[]) => void", description: "On each tick." },
      {
        name: "variant",
        type: '"chip" | "field"',
        default: '"chip"',
        description: "A record's property, or a form control.",
      },
      className,
    ],
  },
];

/** Composites of atoms, ready: the pickers, then the groups built after Tasks. */
export const blocks: ReadonlyArray<Atom> = [
  ...pickers,
  ...iconPickerBlocks,
  ...listBlocks,
  ...viewBlocks,
  ...filteringBlocks,
  ...recordBlocks,
  ...navigationBlocks,
  ...dataBlocks,
  ...datahubBlocks,
  ...driveBlocks,
  ...automationBlocks,
  ...timeBlocks,
  ...conversationBlocks,
  ...approvalBlocks,
  ...financeBlocks,
];

/** The hooks: the state the components share, the keyboard, the actions of a screen. */
export const hooks: ReadonlyArray<Atom> = hookEntries;

/** Which group a page belongs to. */
export const groupOf = (slug: string): "Atoms" | "Blocks" | "Hooks" =>
  blocks.some((b) => b.slug === slug)
    ? "Blocks"
    : hooks.some((h) => h.slug === slug)
      ? "Hooks"
      : "Atoms";

/** Whole screens, after the HTML prototypes of the apps. */
export const pages: ReadonlyArray<Planned> = [
  { name: "Console home", icon: DashboardSquare01Icon, summary: "The workspace at a glance." },
  { name: "CRM", icon: UserGroupIcon, summary: "Leads, pipeline, contacts." },
  { name: "Tasks", icon: Task01Icon, summary: "Lists, board, due dates." },
  { name: "Notes", icon: Note01Icon, summary: "Documents and their tree." },
  { name: "Mail", icon: Mail01Icon, summary: "Inbox, thread, compose." },
  { name: "Chat", icon: Message01Icon, summary: "Channels and threads." },
  { name: "Agenda", icon: Calendar01Icon, summary: "Week, day, booking." },
  { name: "Drive", icon: Folder01Icon, summary: "Folders, files, sharing." },
  { name: "Dashboard", icon: ChartLineData01Icon, summary: "Figures and charts." },
  { name: "Helpdesk", icon: CustomerSupportIcon, summary: "Tickets and replies." },
  { name: "Invoices", icon: Invoice01Icon, summary: "Quotes, invoices, payments." },
  { name: "Expenses", icon: ReceiptEuroIcon, summary: "Receipts and approvals." },
  { name: "Forms", icon: FileEditIcon, summary: "Build, share, answers." },
  { name: "Sign", icon: SignatureIcon, summary: "Documents to sign." },
  { name: "People", icon: UserListIcon, summary: "Directory and profiles." },
  { name: "Time off", icon: BeachIcon, summary: "Requests and balances." },
];
