/* Blocks of the "admin" group: permissions, notifications, invitations, tokens, secrets, webhooks, export and the trash, for any app with settings. */
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
    ],
    props: [
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
    slug: "notification-preferences",
    name: "Notification preferences",
    summary:
      "Events by channels, a switch per group, a digest, quiet hours and a way back to the defaults.",
    imports: [
      "NotificationPreferences",
      "inQuietHours",
      "setChannel",
      "setChannelForEvents",
      "channelCoverage",
      "samePrefs",
    ],
    props: [
      { name: "label", type: "string", description: "Names the matrix." },
      {
        name: "events",
        type: "{ id, label, description?, group? }[]",
        description: "The rows; a group gets a header row with a switch per channel.",
      },
      {
        name: "channels",
        type: "{ id, label, unavailable? }[]",
        description: "The columns; unavailable ones are dimmed and cannot be turned on.",
      },
      {
        name: "value / defaultValue / onChange",
        type: "{ channels: Record<eventId, channelId[]>, digest, quiet: { enabled, from, to } }",
        description: "What was chosen. digest: off, hourly, daily, weekly.",
      },
      {
        name: "defaults",
        type: "NotificationPrefs",
        description: "What Reset to default goes back to; without it, no button.",
      },
      {
        name: "digest / quietHours",
        type: "boolean",
        default: "true",
        description: "Show or hide each block.",
      },
      { name: "disabled", type: "boolean", description: "Locks everything." },
      className,
    ],
  },
  {
    slug: "invite-dialog",
    name: "Invite dialog",
    summary:
      "Emails pasted by the dozen, teams, a message, then the answer for each: invited, already a member, invalid.",
    imports: ["InviteDialog", "classifyInvites", "parseEmails", "isInviteEmail", "inviteSummary"],
    props: [
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
    slug: "token-manager",
    name: "Token manager",
    summary:
      "Tokens with scopes, last use and expiry; create, see the token once, revoke after a confirmation.",
    imports: ["TokenManager", "tokenExpiry", "tokenProblems", "expiryDay", "EXPIRY_CHOICES"],
    props: [
      {
        name: "tokens",
        type: "{ id, name, scopes, createdAt, lastUsedAt?, expiresAt?, prefix? }[]",
        description: "Never the secret: only a short prefix to recognise it by.",
      },
      {
        name: "scopes",
        type: "{ id, label, description?, group? }[]",
        description: "What a token can be given.",
      },
      today,
      {
        name: "onCreate",
        type: "({ name, scopes, expiresAt }) => void",
        description: "The form was valid: create it, then pass it back as `created`.",
      },
      {
        name: "created",
        type: "{ name, secret } | null",
        description: "Shown once in a dialog, with a copy-now warning.",
      },
      {
        name: "onCreatedClose",
        type: "() => void",
        description: "Drop `created` from the app's state.",
      },
      { name: "onRevoke", type: "(id) => void", description: "After the confirmation." },
      {
        name: "busy / expiryChoices / empty",
        type: "boolean; ExpiryChoice[]; string",
        description: "Options.",
      },
      className,
    ],
  },
  {
    slug: "secret-field",
    name: "Secret field",
    summary:
      "A hidden value: fixed-length mask, reveal for a few seconds, copy, replace, remove; set or not set.",
    imports: ["SecretField", "SECRET_MASK", "SECRET_REVEAL_MS", "secretProblem"],
    props: [
      { name: "label", type: "string", description: "Names the secret." },
      { name: "isSet", type: "boolean", description: "Not set shows a badge and Set value." },
      {
        name: "getValue / value",
        type: "() => string | Promise<string>; string",
        description:
          "Where the value comes from, read only on Reveal or Copy. Hidden, it is never in the page.",
      },
      {
        name: "revealTimeout",
        type: "number",
        default: "15000",
        description:
          "Milliseconds on screen; 0 keeps it until hidden. It also hides when the tab is left.",
      },
      { name: "rotatedAt / today", type: "string", description: "“Changed 3 days ago”." },
      {
        name: "onReplace",
        type: "(value) => void | Promise<void>",
        description: "The new value goes out and is not kept.",
      },
      { name: "onRemove / onCopy", type: "() => void", description: "Remove asks a second time." },
      className,
    ],
  },
  {
    slug: "endpoint-list",
    name: "Endpoint list",
    summary:
      "Webhook endpoints: URL, events, status, a switch, a test button and the signing secret.",
    imports: ["EndpointList"],
    props: [
      {
        name: "endpoints",
        type: "{ id, url, name?, description?, events, status, lastDeliveryAt?, secret?: { isSet, rotatedAt? } }[]",
        description: "status: active, disabled, failing.",
      },
      { name: "onToggle", type: "(id, enabled) => void", description: "The switch." },
      {
        name: "onTest / testing / testResults",
        type: "(id) => void; string[]; Record<id, { ok, code?, message? }>",
        description: "Send a sample event; which are on their way; how the last went.",
      },
      {
        name: "onSelect",
        type: "(id) => void",
        description: "Deliveries: open the log of an endpoint.",
      },
      {
        name: "getSecret / onReplaceSecret",
        type: "(id) => string | Promise<string>; (id, value) => void",
        description: "For the SecretField of each endpoint.",
      },
      today,
      className,
    ],
  },
  {
    slug: "delivery-log",
    name: "Delivery log",
    summary:
      "Webhook deliveries: status, code, duration, tries; payload and answer as JSON; redeliver.",
    imports: ["DeliveryLog", "formatDeliveryDuration", "filterDeliveries", "deliveryCounts"],
    props: [
      {
        name: "deliveries",
        type: "{ id, event, at, status, code?, durationMs?, attempts, url?, request?, response? }[]",
        description: "status: success, failed, retrying, pending.",
      },
      {
        name: "onRedeliver / redelivering",
        type: "(id) => void; string[]",
        description: "The button on every row that has an answer.",
      },
      {
        name: "filter / defaultFilter / onFilterChange",
        type: "'all' | 'failed'",
        description: "Which rows.",
      },
      {
        name: "showUrl / defaultOpen / empty",
        type: "boolean; string[]; string",
        description: "Options.",
      },
      className,
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
    ],
    props: [
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
    imports: ["TrashList", "retentionDaysLeft", "retentionText", "sortByRetention"],
    props: [
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
];
