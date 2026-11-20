/* Blocks of the "approval" group: approval and signature, for any app that asks people to approve, sign or validate. */
import type { Atom, PropRow } from "../types";

const className: PropRow = { name: "className", type: "string", description: "Extra classes." };
const statusLabels: PropRow = {
  name: "statusLabels",
  type: "Partial<Record<ApprovalStatus, string>>",
  description: "Other words for waiting, current, approved, rejected, skipped.",
};

/** Gallery pages of the "approval" blocks, in order. */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "approval-chain",
    name: "Approval chain",
    summary:
      "An approval as steps: people one by one or all at once, status, due date, reminder, comments, audit.",
    imports: ["ApprovalChain", "ApprovalAudit", "resolveChain", "chainStatus", "chainProgress"],
    props: [
      { name: "label", type: "string", description: "Names the chain: “Expense 214”." },
      {
        name: "value / defaultValue / onChange",
        type: "{ id, label?, mode?, participants, due?, comments? }[]",
        description:
          "The steps. mode: sequential (default) or parallel. A participant's status is found (resolveChain) unless given.",
      },
      {
        name: "editable",
        type: "boolean",
        default: "false",
        description:
          "Add, remove and reorder people (drag or Alt + arrows), switch a step's mode, add, move and remove steps.",
      },
      {
        name: "people",
        type: "{ id, name, role?, email? }[]",
        description: "Who can be added; those already in the chain are left out.",
      },
      {
        name: "today",
        type: "string",
        description: "YYYY-MM-DD: a step past its due date is marked late.",
      },
      {
        name: "onRemind",
        type: "(person, step) => void",
        description: "The Remind button on whoever is current.",
      },
      {
        name: "onComment",
        type: "(stepId, text) => void",
        description: "A box to comment under each step (⌘ Enter sends).",
      },
      {
        name: "events",
        type: "{ id, at, actor, action, detail?, tone? }[]",
        description:
          "The audit, under the chain (newest first). ApprovalAudit alone takes the same.",
      },
      {
        name: "stepName / stepActions / empty",
        type: "string; (step, i) => ReactNode; ReactNode",
        description: "Wording and extras.",
      },
      statusLabels,
      className,
    ],
  },
  {
    slug: "participant-list",
    name: "Participant list",
    summary: "People with role, status and order, reordered by drag or Alt + arrows.",
    imports: ["ParticipantList", "participantTone"],
    props: [
      { name: "label", type: "string", description: "Names the list: “Signers”." },
      {
        name: "value / defaultValue / onChange",
        type: "{ id, name, role?, email?, status?, at? }[]",
        description: "The people, in order.",
      },
      {
        name: "editable",
        type: "boolean",
        default: "false",
        description:
          "Reorder (drag, Alt + ↑ ↓, Alt + Home / End) and remove (Delete). reorderable and removable set them apart.",
      },
      {
        name: "ordered",
        type: "boolean",
        default: "true",
        description: "Written 1, 2, 3 before each name.",
      },
      {
        name: "colors",
        type: "boolean",
        default: "false",
        description: "A bar in the person's colour, as on the fields.",
      },
      {
        name: "onRemind",
        type: "(person) => void",
        description: "A remind button on whoever is current.",
      },
      {
        name: "actions",
        type: "(person, index) => ReactNode",
        description: "More at the end of a row.",
      },
      statusLabels,
      className,
    ],
  },
  {
    slug: "document-viewer",
    name: "Document viewer",
    summary:
      "Pages as images or a render callback, thumbnails, zoom 50–300 %, navigation, search, overlay.",
    imports: ["DocumentViewer", "fitScale", "stepZoom"],
    props: [
      { name: "label", type: "string", description: "Names the viewer." },
      {
        name: "pages",
        type: "{ id?, src?, alt?, width, height, render? }[]",
        description:
          "width / height at 100 %. src draws an image; render(info) draws anything (a PDF canvas, an invoice).",
      },
      {
        name: "page / defaultPage / onPageChange",
        type: "number",
        default: "1",
        description: "The page in view, from 1.",
      },
      {
        name: "zoom / defaultZoom / onZoomChange",
        type: `"fit" | number`,
        default: `"fit"`,
        description: "Fit width, or 50 to 300 (percent).",
      },
      {
        name: "thumbnails",
        type: "boolean",
        default: "true",
        description: "The column of thumbnails, with a button to hide it.",
      },
      {
        name: "overlay",
        type: "(info: { page, number, scale, width, height }) => ReactNode",
        description: "Drawn over each page, in its box: fields, stamps, highlights.",
      },
      {
        name: "onSearch",
        type: "(query) => { page, text? }[] | Promise<…>",
        description:
          "Looks for text. Absent, there is no search box. Enter searches, Shift Enter goes back.",
      },
      {
        name: "toolbar / height",
        type: "ReactNode; number | string",
        default: "560",
        description: "Extras at the end of the toolbar; the height.",
      },
      className,
    ],
  },
  {
    slug: "field-placer",
    name: "Field placer",
    summary: "Place, drag, resize and delete typed boxes on a document, each for a participant.",
    imports: ["FieldPlacer", "boxAt", "participantsWithoutField", "PARTICIPANT_TONES"],
    props: [
      { name: "label", type: "string", description: "Names the placer." },
      { name: "pages", type: "DocumentPage[]", description: "As DocumentViewer." },
      {
        name: "participants",
        type: "{ id, name, … }[]",
        description: "Who a box can be given to; colour and number by position.",
      },
      {
        name: "value / defaultValue / onChange",
        type: "{ id, type, page, x, y, w, h, participantId, required?, label? }[]",
        description: "The boxes. x, y, w, h are fractions of the page (0 to 1); page from 1.",
      },
      {
        name: "selected / defaultSelected / onSelectedChange",
        type: "string | null",
        description: "The box selected. Arrows nudge, Shift bigger, Alt resizes, Delete removes.",
      },
      {
        name: "types",
        type: `("signature" | "initials" | "date" | "text" | "checkbox")[]`,
        default: "all five",
        description: "Which types the panel offers.",
      },
      { name: "readOnly", type: "boolean", default: "false", description: "Only look." },
      {
        name: "viewer",
        type: "Partial<DocumentViewerProps>",
        description: "height, thumbnails, onSearch… passed to the viewer.",
      },
      className,
    ],
  },
  {
    slug: "seal-badge",
    name: "Seal badge",
    summary: "Proof of a signature or approval: who, when with its zone, how, and a hash prefix.",
    imports: ["SealBadge", "formatStamp", "hashPrefix"],
    props: [
      { name: "who / detail", type: "string", description: "Name, and a role or email under it." },
      {
        name: "action",
        type: "string",
        default: `"Approved"`,
        description: "Signed, Approved, Validated.",
      },
      {
        name: "at",
        type: "string",
        description: "ISO timestamp: 2026-11-19T14:32:10Z is written 2026-11-19 14:32 UTC.",
      },
      { name: "method", type: "string", description: "Drawn signature, Email code…" },
      {
        name: "hash / hashLength",
        type: "string; number",
        default: "8",
        description: "Only the first characters are shown, in fours.",
      },
      {
        name: "state",
        type: `"valid" | "revoked" | "unverified"`,
        default: `"valid"`,
        description: "Always written, not only coloured.",
      },
      {
        name: "compact",
        type: "boolean",
        default: "false",
        description: "One line, for a margin or a cell.",
      },
      className,
    ],
  },
];
