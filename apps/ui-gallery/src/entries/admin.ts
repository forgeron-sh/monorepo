/* Blocks of the "admin" group: permissions, invitations, secrets, export, the trash and the audit log, for any app with settings. */
import type { Atom, PropRow } from "../types";

const className: PropRow = { name: "className", type: "string", description: "Extra classes." };
const today: PropRow = {
  name: "today",
  type: "string",
  description: "YYYY-MM-DD: dates are told from it (“3 days ago”, “In 5 days”).",
};

/** Gallery pages of the "admin" blocks, in order. */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "permission-matrix",
    name: "Permission matrix",
    summary:
      "Who may do what: people and teams by permissions, each cell allow, deny or inherit. No roles.",
    imports: [
      "PermissionMatrix",
      "permissionDiff",
      "permissionSummary",
      "setPermission",
      "permissionAt",
      "permissionKey",
      "PermissionMatrixBar",
      "PermissionMatrixLegend",
      "PermissionMatrixChanges",
      "PermissionMatrixGrid",
      "PermissionMatrixKeys",
      "PermissionMatrixSummary",
      "PermissionMatrixStatus",
    ],
    props: [
      {
        name: "Parts",
        type: "PermissionMatrix > PermissionMatrixBar (PermissionMatrixLegend, PermissionMatrixChanges), PermissionMatrixGrid, PermissionMatrixKeys, PermissionMatrixSummary, PermissionMatrixStatus",
        description:
          "Without children all of them are drawn. `usePermissionMatrix()` gives a part of your own the grid and its helpers.",
      },
      { name: "label", type: "string", description: "Names the grid for assistive technology." },
      {
        name: "subjects",
        type: "{ id, name, kind?: 'person' | 'team', hint? }[]",
        description: "The rows.",
      },
      {
        name: "columns",
        type: "{ id, label, group? }[]",
        description: "The permissions: an action (label) on a resource (group).",
      },
      {
        name: "value / defaultValue / onChange",
        type: "Record<string, 'allow' | 'deny'>",
        description:
          "The cells that are not inherited, keyed by permissionKey(subjectId, columnId). An absent cell inherits.",
      },
      {
        name: "saved",
        type: "PermissionValue",
        description:
          "The saved grid: cells that differ are marked, counted, and listed in the summary.",
      },
      {
        name: "readOnly",
        type: "boolean",
        default: "false",
        description: "Shows the grid, changes nothing; arrows still move.",
      },
      {
        name: "inherited",
        type: "(subjectId, columnId) => 'allow' | 'deny' | undefined",
        description: "What an inherited cell comes to: shown faded, dashed.",
      },
      {
        name: "maxHeight",
        type: "number",
        default: "420",
        description: "Scrolls past it; the headers stay.",
      },
      {
        name: "summaryOpen",
        type: "boolean",
        default: "false",
        description: "The text summary starts open.",
      },
      {
        name: "subjectLabel / stateNames",
        type: "string; Partial<Record<…>>",
        description: "Wording.",
      },
      className,
    ],
  },
  {
    slug: "invite-dialog",
    name: "Invite dialog",
    summary:
      "Emails pasted by the dozen, teams, a message, then the answer for each: invited, already a member, invalid.",
    imports: [
      "InviteDialog",
      "classifyInvites",
      "parseEmails",
      "isInviteEmail",
      "inviteSummary",
      "InviteDialogHeader",
      "InviteDialogEmails",
      "InviteDialogTeams",
      "InviteDialogMessage",
      "InviteDialogResults",
      "InviteDialogFooter",
    ],
    props: [
      {
        name: "Parts",
        type: "InviteDialog > InviteDialogHeader, InviteDialogEmails, InviteDialogTeams, InviteDialogMessage, InviteDialogResults, InviteDialogFooter",
        description:
          "With children the root is a shadcn dialog and these are its content, each reading the root's state; without, the usual modal.",
      },
      {
        name: "onInvite",
        type: "({ emails, teams, message }) => void",
        description:
          "The valid new addresses, lower-cased, without duplicates. Nothing is sent by the dialog.",
      },
      {
        name: "result",
        type: "{ email, outcome: 'invited' | 'member' | 'invalid', detail? }[]",
        description: "While present the dialog shows it in place of the form.",
      },
      { name: "onAgain", type: "() => void", description: "Invite more: clear `result`." },
      { name: "onClose", type: "() => void", description: "Escape, click outside, Cancel, Done." },
      { name: "teams", type: "ComboboxOption[]", description: "Teams they join; none, no picker." },
      {
        name: "members",
        type: "string[]",
        description: "Addresses already in the workspace: left out and counted.",
      },
      {
        name: "value / defaultValue / onChange",
        type: "{ emails, teams, message }",
        description: "The draft.",
      },
      { name: "busy", type: "boolean", description: "The request is on its way." },
      {
        name: "message / maxEmails / maxMessage",
        type: "boolean; number; number",
        description: "Options.",
      },
    ],
  },
  {
    slug: "export-dialog",
    name: "Export dialog",
    summary: "Format, columns, range and a preview count; progress and the download from props.",
    imports: [
      "ExportDialog",
      "exportProblem",
      "exportFilename",
      "exportPercent",
      "DEFAULT_EXPORT_FORMATS",
      "ExportDialogHeader",
      "ExportDialogError",
      "ExportDialogOptions",
      "ExportDialogFormats",
      "ExportDialogRanges",
      "ExportDialogColumns",
      "ExportDialogPreview",
      "ExportDialogProgress",
      "ExportDialogDone",
      "ExportDialogFooter",
    ],
    props: [
      {
        name: "Parts",
        type: "ExportDialog > ExportDialogHeader, ExportDialogError, ExportDialogOptions > ExportDialogFormats, ExportDialogRanges, ExportDialogColumns, ExportDialogPreview, ExportDialogProgress, ExportDialogDone, ExportDialogFooter",
        description:
          "With children the root is a shadcn dialog and these are its content; without, the usual modal.",
      },
      { name: "columns", type: "{ id, label, hint? }[]", description: "What can be included." },
      {
        name: "formats / ranges",
        type: "{ value, label, description? }[]; { value, label, count? }[]",
        description: "Default CSV, JSON, NDJSON; everything.",
      },
      {
        name: "value / defaultValue / onChange",
        type: "{ format, columns, range }",
        description: "What is asked for.",
      },
      {
        name: "state",
        type: "idle | running { progress?, rows? } | done { href?, filename?, rows?, size? } | error { message }",
        description: "Where the export stands, as the app reports it.",
      },
      {
        name: "onExport / onCancel / onClose",
        type: "(request) => void; () => void; () => void",
        description: "Columns come back in their order.",
      },
      {
        name: "name / today",
        type: "string",
        description: "The file name: members-2026-11-19.csv.",
      },
    ],
  },
  {
    slug: "trash-list",
    name: "Trash list",
    summary: "Deleted items with who and when, days left, restore, delete forever and empty trash.",
    imports: [
      "TrashList",
      "retentionDaysLeft",
      "retentionText",
      "sortByRetention",
      "TrashListNotice",
      "TrashListBar",
      "TrashListRows",
      "TrashListRow",
      "TrashListEmpty",
    ],
    props: [
      {
        name: "Parts",
        type: "TrashList > TrashListNotice, TrashListBar, TrashListRows > TrashListRow, TrashListEmpty",
        description:
          "Without children the notice, the bar and the rows are drawn. The confirmation is the root's.",
      },
      {
        name: "items",
        type: "{ id, name, kind?, deletedBy, deletedAt }[]",
        description: "The soonest to go first.",
      },
      today,
      {
        name: "retentionDays",
        type: "number",
        default: "30",
        description: "Days before it is deleted for good.",
      },
      {
        name: "onRestore",
        type: "(ids: string[]) => void",
        description: "One id from a row, several from the selection.",
      },
      {
        name: "onDeleteForever",
        type: "(ids: string[]) => void",
        description: "After the confirmation.",
      },
      {
        name: "onEmpty",
        type: "() => void",
        description: "Empty trash, after the confirmation; without it, no button.",
      },
      {
        name: "notice / noun / empty",
        type: "boolean; string; string",
        description: "The retention banner; the word for one item.",
      },
      className,
    ],
  },
  {
    slug: "audit-log",
    name: "Audit log",
    summary: "Who did what to which thing, by day. Refusals say so; detail folds open.",
    imports: ["AuditLog", "AuditLogDay", "AuditLogEvent", "AuditLogEmpty"],
    props: [
      {
        name: "Parts",
        type: "AuditLog > AuditLogDay > AuditLogEvent, AuditLogEmpty",
        description:
          "Without children one `AuditLogDay` of `AuditLogEvent`s is drawn per day, on the `Feed` parts.",
      },
      {
        name: "events",
        type: "{ id, at, actor, actorIcon?, action, target?, outcome?, detail? }[]",
        description: "Newest first. at: YYYY-MM-DD HH:MM. outcome: ok, denied or failed.",
      },
      {
        name: "today",
        type: "string",
        description: "YYYY-MM-DD: its day and the one before read Today and Yesterday.",
      },
      { name: "defaultExpanded", type: "string[]", description: "Rows open at first." },
      { name: "label", type: "string", default: `"Audit log"`, description: "Its name." },
      {
        name: "empty",
        type: "ReactNode",
        default: `"Nothing happened yet"`,
        description: "Shown when there is no event.",
      },
      className,
    ],
  },
];
