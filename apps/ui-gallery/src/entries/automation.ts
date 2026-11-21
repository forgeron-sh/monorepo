/* Blocks of the "automation" group. */
import type { Atom, PropRow } from "../types";

const className: PropRow = { name: "className", type: "string", description: "Extra classes." };
const readOnly: PropRow = {
  name: "readOnly",
  type: "boolean",
  description: "Shows without editing: a run, a published version.",
};
const variables: PropRow = {
  name: "variables",
  type: "{ id, label, icon?, fields: { path, hint? }[] }[]",
  description:
    "The outputs of the previous steps, nearest first. variablesFromSample(id, label, sample) builds one from a test output.",
};

/** Gallery pages of the "automation" blocks, in order. */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "automation-list",
    name: "Automation list",
    summary:
      "The automations of a workspace: trigger, state, last run, runs of the last days, owner.",
    imports: [
      "AutomationList",
      "RunBars",
      "AutomationListHeader",
      "AutomationListBody",
      "AutomationListRow",
      "AutomationListName",
      "AutomationListTrigger",
      "AutomationListState",
      "AutomationListLast",
      "AutomationListRuns",
      "AutomationListOwner",
      "AutomationListActions",
      "AutomationListEmpty",
    ],
    props: [
      {
        name: "automations",
        type: "{ id, name, meta?, trigger: { label, icon }, state, lastRun?, runs?, errors?, owner? }[]",
        description:
          "state is active, paused or draft; lastRun is { status, ago, durationMs? }; runs and errors are per day, oldest first.",
      },
      {
        name: "onOpen",
        type: "(automation) => void",
        description: "A row opens on click and Enter.",
      },
      {
        name: "columns",
        type: `("trigger" | "state" | "last" | "runs" | "owner")[]`,
        default: "all",
        description: "The columns after the name, in order; fewer for a narrow place.",
      },
      {
        name: "renderActions",
        type: "(automation) => ReactNode",
        description: "The end of a row: a menu, a switch. Clicks there do not open the row.",
      },
      {
        name: "runsLabel",
        type: "string",
        default: `"Runs · 14 d"`,
        description: "Header of the bars.",
      },
      { name: "empty", type: "ReactNode", description: "Shown when there is no automation." },
      {
        name: "Parts",
        type: "AutomationListHeader, AutomationListBody, AutomationListRow, AutomationListName, AutomationListTrigger, AutomationListState, AutomationListLast, AutomationListRuns, AutomationListOwner, AutomationListActions, AutomationListEmpty",
        description:
          "Without `automations`, the root is the Table of the parts: a row takes `automation` and the cells you want. Cells read the row; the root's `onOpen`, `columns`, `renderActions` apply.",
      },
      className,
    ],
  },
  {
    slug: "step-card",
    name: "Step card",
    summary:
      "One step: icon, name, call, and the state of its last run. A list row or a canvas node.",
    imports: [
      "StepCard",
      "StepCardTrigger",
      "StepCardMain",
      "StepCardText",
      "StepCardTitle",
      "StepCardSubtitle",
      "StepCardState",
      "StepCardActions",
      "StepCardMeta",
      "StepCardError",
    ],
    props: [
      { name: "title", type: "string", description: "The name of the step in this automation." },
      {
        name: "subtitle",
        type: "string",
        description: "What it calls, in mono: Chat · postMessage().",
      },
      { name: "icon", type: "IconDefinition", description: "Its pixel icon, in a tile." },
      {
        name: "kind",
        type: `"trigger" | "action" | "logic"`,
        default: `"action"`,
        description: "A trigger gets the bolt mark and an ember tile.",
      },
      {
        name: "status",
        type: `"idle" | "running" | "success" | "error" | "skipped" | "reused"`,
        default: `"idle"`,
        description: "The state of the last run, in a word and an LED, and in the outline.",
      },
      {
        name: "meta / error",
        type: "string",
        description: "After a run: 120 ms · 3 items, or the error.",
      },
      {
        name: "disabled",
        type: "boolean",
        description: "Hatched and struck through: items pass through.",
      },
      {
        name: "layout",
        type: `"row" | "node"`,
        default: `"row"`,
        description: "node: 240px wide, the state on the top edge, for @forgeron/flow.",
      },
      {
        name: "selected",
        type: "boolean",
        description: "Outlined in ember: the step in the inspector.",
      },
      { name: "onSelect", type: "() => void", description: "Makes the card a button." },
      {
        name: "actions",
        type: "ReactNode",
        description: "Small buttons shown on hover and focus.",
      },
      {
        name: "Parts",
        type: "StepCardTrigger, StepCardMain, StepCardText, StepCardTitle, StepCardSubtitle, StepCardState, StepCardActions, StepCardMeta, StepCardError",
        description:
          "Without `title`, the root is the card of the parts. Every other prop (id, tabIndex, a list's item props…) goes on the card; `asChild` makes your element the card.",
      },
      className,
    ],
  },
  {
    slug: "step-picker",
    name: "Step picker",
    summary:
      "Triggers or actions to add: a search, categories, groups under a band; arrows and Enter.",
    imports: [
      "StepPicker",
      "StepPickerHeader",
      "StepPickerSearch",
      "StepPickerCategories",
      "StepPickerEmpty",
      "StepPickerList",
      "StepPickerGroup",
      "StepPickerItem",
      "StepPickerFooter",
    ],
    props: [
      {
        name: "options",
        type: "{ id, label, description?, icon, group, app?, tag?, keywords? }[]",
        description: "What can be added; group names the band it sits under.",
      },
      {
        name: "groups",
        type: "{ id, label }[]",
        description: "The groups in order, with their names.",
      },
      { name: "onPick", type: "(id: string) => void", description: "Click or Enter on an option." },
      { name: "title / context", type: "ReactNode", description: "Add a step; After “Deal won”." },
      {
        name: "categories",
        type: "boolean",
        default: "true",
        description: "The row of group filters.",
      },
      { name: "footer", type: "ReactNode", description: "Under the list: write your own step." },
      { name: "autoFocus", type: "boolean", description: "Focuses the search when shown." },
      {
        name: "Parts",
        type: "StepPickerHeader, StepPickerSearch, StepPickerCategories, StepPickerEmpty, StepPickerList, StepPickerGroup, StepPickerItem, StepPickerFooter",
        description:
          "With children, they replace the default layout. The options and the filter stay in the root.",
      },
      className,
    ],
  },
  {
    slug: "step-list",
    name: "Step list",
    summary:
      "A linear automation: steps down a rail, branches nested under bands; add, move, remove in place.",
    imports: [
      "StepList",
      "insertStep",
      "removeStep",
      "moveStep",
      "findStep",
      "StepListEmpty",
      "StepListSteps",
      "StepListInsert",
      "StepListItem",
      "StepListBranches",
      "StepListBranch",
      "StepListBand",
    ],
    props: [
      {
        name: "steps / defaultSteps",
        type: "AutomationStep[]",
        description:
          "{ id, title, subtitle?, icon, kind?, status?, meta?, error?, disabled?, branches?: { id, label, steps }[] }.",
      },
      {
        name: "onChange",
        type: "(steps) => void",
        description: "Every move and removal, as the new tree.",
      },
      { name: "selected / onSelect", type: "string / (id) => void", description: "The open step." },
      {
        name: "onInsert",
        type: "(place: { branch?, index }) => void",
        description:
          "Asks for a step there: open a StepPicker, then insertStep. Without it, no add button.",
      },
      readOnly,
      { name: "empty", type: "ReactNode", description: "Shown when there is no step." },
      {
        name: "Parts",
        type: "StepListEmpty, StepListSteps, StepListInsert, StepListItem, StepListBranches, StepListBranch, StepListBand",
        description:
          "With children, they replace the default layout. The tree stays in the root (its collection drives the keyboard): every card is an item, one tab stop.",
      },
      className,
    ],
  },
  {
    slug: "step-inspector",
    name: "Step inspector",
    summary:
      "The panel of a step: parameters with references, settings (errors, retries, timeout), its test.",
    imports: [
      "StepInspector",
      "StepFields",
      "StepSettings",
      "StepInspectorHeader",
      "StepInspectorTabs",
      "StepInspectorParams",
      "StepInspectorTip",
      "StepInspectorTest",
      "StepInspectorFooter",
      "StepField",
      "StepSettingsOnError",
      "StepSettingsRetry",
      "StepSettingsTimeout",
      "StepSettingsDisabled",
      "StepSettingsNotes",
      "StepSettingsOutput",
    ],
    props: [
      { name: "icon / title / subtitle", type: "…", description: "The step, at the top." },
      { name: "onTitleChange", type: "(title) => void", description: "Makes the name editable." },
      {
        name: "fields",
        type: "{ key, label, type, required?, options?, hint?, typeLabel?, expression? }[]",
        description:
          "type: text, long, number, select, boolean, schedule, json, credential. Text takes {{ references }}.",
      },
      {
        name: "values / onValuesChange",
        type: "Record<string, unknown>",
        description: "The parameters.",
      },
      variables,
      {
        name: "sample",
        type: "unknown",
        description: "Test data: text fields show what they resolve to.",
      },
      {
        name: "settings / onSettingsChange",
        type: "{ onError, retry, attempts, timeout, disabled, output?, notes? }",
        description: "The Settings tab; without it there is none.",
      },
      {
        name: "tabs",
        type: "{ id, label, content }[]",
        description: "More tabs: the code, the docs.",
      },
      {
        name: "test / onTest",
        type: "{ status, durationMs?, items?, at?, input?, output?, error? }",
        description: "The last test of the step, with Input and Output.",
      },
      {
        name: "onDuplicate / onDelete / onClose",
        type: "() => void",
        description: "Footer and header.",
      },
      readOnly,
      {
        name: "Parts",
        type: "StepInspectorHeader, StepInspectorTabs, StepInspectorParams, StepInspectorTip, StepInspectorTest, StepInspectorFooter, StepField, StepSettingsOnError, StepSettingsRetry, StepSettingsTimeout, StepSettingsDisabled, StepSettingsNotes, StepSettingsOutput",
        description:
          "StepInspector, StepFields and StepSettings each take children: their own parts (StepField takes a field spec).",
      },
      className,
    ],
  },
  {
    slug: "schedule-editor",
    name: "Schedule editor",
    summary:
      "When it runs: every n minutes, hourly, daily, weekdays, monthly or cron, said in words.",
    imports: [
      "ScheduleEditor",
      "describeCron",
      "nextRuns",
      "ScheduleEditorModes",
      "ScheduleEditorControls",
      "ScheduleEditorSummary",
      "ScheduleEditorNext",
      "ScheduleEditorNumber",
      "ScheduleEditorTime",
      "ScheduleEditorDays",
      "ScheduleEditorCron",
    ],
    props: [
      {
        name: "value / defaultValue / onChange",
        type: "string",
        description: "A cron expression.",
      },
      { name: "timezone", type: "string", description: "Shown in the summary." },
      {
        name: "timezones / onTimezoneChange",
        type: "string[] / (tz) => void",
        description: "A picker next to the summary.",
      },
      {
        name: "from",
        type: "string",
        description: "Now, YYYY-MM-DDTHH:MM in the timezone: the next runs are listed after it.",
      },
      { name: "preview", type: "number", default: "3", description: "How many next runs." },
      { name: "modes", type: "Mode[]", description: "The shapes offered, in order." },
      { name: "disabled", type: "boolean", description: "Shown, not editable." },
      {
        name: "Parts",
        type: "ScheduleEditorModes, ScheduleEditorControls, ScheduleEditorSummary, ScheduleEditorNext, ScheduleEditorNumber, ScheduleEditorTime, ScheduleEditorDays, ScheduleEditorCron",
        description:
          "With children, they replace the default layout; useScheduleEditor() gives the cron and the shape.",
      },
      className,
    ],
  },
  {
    slug: "run-list",
    name: "Run list",
    summary:
      "Runs by day under a band: state, time, number, trigger, the error in a line, duration.",
    imports: [
      "RunList",
      "RunListFilter",
      "RunListEmpty",
      "RunListDays",
      "RunListGroup",
      "RunListItem",
      "RunListRow",
      "RunListState",
      "RunListTime",
      "RunListId",
      "RunListWhat",
      "RunListDuration",
    ],
    props: [
      {
        name: "runs",
        type: "{ id, status, at, durationMs?, trigger?, automation?, detail? }[]",
        description:
          "Newest first; at is YYYY-MM-DD HH:MM:SS; status queued, running, success, error, cancelled.",
      },
      {
        name: "selected / onSelect",
        type: "string / (id) => void",
        description: "Rows become buttons.",
      },
      { name: "today", type: "string", description: "YYYY-MM-DD: Today and Yesterday." },
      { name: "filter", type: "boolean", description: "The All / Failed switch." },
      {
        name: "density",
        type: `"full" | "compact"`,
        default: `"full"`,
        description: "compact: a column next to a run.",
      },
      {
        name: "Parts",
        type: "RunListFilter, RunListEmpty, RunListDays, RunListGroup, RunListItem, RunListRow, RunListState, RunListTime, RunListId, RunListWhat, RunListDuration",
        description:
          "With children, they replace the default layout. The runs stay in the root (its collection drives the keyboard).",
      },
      className,
    ],
  },
  {
    slug: "publish-bar",
    name: "Publish bar",
    summary:
      "Draft or published, the active switch, Publish; the dialog that lists changes and checks.",
    imports: [
      "PublishBar",
      "PublishDialog",
      "ChangeList",
      "PublishBarState",
      "PublishBarSwitch",
      "PublishBarPublish",
      "ChangeListItem",
      "PublishDialogContent",
      "PublishDialogMessage",
      "PublishDialogChanges",
      "PublishDialogChecks",
      "PublishDialogNote",
      "PublishDialogFooter",
    ],
    props: [
      {
        name: "version",
        type: "number",
        description: "The last published; none: never published.",
      },
      { name: "changes", type: "number", description: "Changes in the draft since." },
      { name: "active / onActiveChange", type: "boolean", description: "Listens to its trigger." },
      { name: "onPublish", type: "() => void", description: "Opens the PublishDialog." },
      {
        name: "PublishDialog",
        type: "{ version, changes, checks?, active?, onPublish(message), onClose, note? }",
        description: "A blocking check keeps Publish off.",
      },
      {
        name: "Parts",
        type: "PublishBarState, PublishBarSwitch, PublishBarPublish, ChangeListItem, PublishDialogContent, PublishDialogMessage, PublishDialogChanges, PublishDialogChecks, PublishDialogNote, PublishDialogFooter",
        description:
          "PublishBar and PublishDialog take their parts as children; ChangeList without `changes` takes ChangeListItem. PublishDialog is a Dialog (portal): render it while open.",
      },
      className,
    ],
  },
  {
    slug: "version-history",
    name: "Version history",
    summary: "Versions with their message and changes, the draft on top; restore one as a draft.",
    imports: ["VersionHistory", "VersionHistoryList", "VersionHistoryRow", "VersionHistoryDetail"],
    props: [
      {
        name: "versions",
        type: "{ version, message, at, by, changes? }[]",
        description: "Newest first; a change is { kind: add | remove | change, text }.",
      },
      {
        name: "draft",
        type: "VersionChange[]",
        description: "Unpublished changes: a Draft entry.",
      },
      { name: "live", type: "number", description: "The version the triggers run." },
      { name: "selected / onSelect", type: `number | "draft"`, description: "The entry shown." },
      {
        name: "onRestore / onPublish / onDiscard",
        type: "…",
        description: "The buttons of the entry.",
      },
      {
        name: "Parts",
        type: "VersionHistoryList, VersionHistoryRow, VersionHistoryDetail",
        description:
          "With children, they replace the default layout. The list is one collection: the arrows move the choice.",
      },
      className,
    ],
  },
];
