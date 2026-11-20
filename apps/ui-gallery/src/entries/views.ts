import type { Atom } from "../types";

const shared = {
  getId: {
    name: "getId",
    type: "(record) => string",
    default: "record.id",
    description: "The key of a record.",
  },
  getLabel: {
    name: "getLabel",
    type: "(record) => string",
    default: "title, else name",
    description: "Its name, also said to assistive technology.",
  },
  getColor: {
    name: "getColor",
    type: "(record) => string | undefined",
    default: "record.color",
    description: "A CSS colour for its mark, e.g. var(--accent). Grey without one.",
  },
  today: {
    name: "today",
    type: "string",
    default: "the device's date",
    description: "YYYY-MM-DD: marked in ember.",
  },
  selected: {
    name: "selected / defaultSelected",
    type: "string | null",
    description: "The current record, marked. Controlled or not.",
  },
  onSelectedChange: {
    name: "onSelectedChange",
    type: "(id: string) => void",
    description: "When the arrows or a click move the current record.",
  },
  onOpen: {
    name: "onOpen",
    type: "(id: string) => void",
    description: "A click or Enter on a record.",
  },
  toolbar: {
    name: "toolbar",
    type: "boolean",
    default: "true",
    description: "Today and the zoom or mode above. Off when a display menu holds them.",
  },
  className: { name: "className", type: "string", description: "Extra classes." },
};

/** Gallery pages of the "views" blocks: timeline, calendar. */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "timeline",
    name: "Timeline",
    summary:
      "Records as bars between two dates, in sections, a sticky column of names. Drag or Alt+arrows to move.",
    imports: ["Timeline"],
    props: [
      {
        name: "groups",
        type: "{ key, name, glyph?, records }[]",
        description: "The rows in sections: useListView's groups as they are.",
      },
      {
        name: "records",
        type: "T[]",
        description: "The rows without sections, when there are no groups.",
      },
      shared.getId,
      shared.getLabel,
      {
        name: "getStart",
        type: "(record) => string | null",
        default: "record.start",
        description: "The first day, YYYY-MM-DD.",
      },
      {
        name: "getEnd",
        type: "(record) => string | null",
        default: "end, else due, else target",
        description: "The last day. With no start, the record is a point: a due date.",
      },
      shared.getColor,
      {
        name: "fields / startField / endField",
        type: "RecordFields<T>, string",
        description:
          "The records model instead of getStart and getEnd: the date fields of the first and last day.",
      },
      {
        name: "groupField",
        type: "string",
        description: "With fields and no groups: the field the rows are sectioned by.",
      },
      {
        name: "labelField / markField / context",
        type: "string, string, RecordContext",
        description:
          "The field read as the label, a field drawn before it, and what its marks need.",
      },
      {
        name: "getMilestones",
        type: "(record) => { id, label, date, done? }[]",
        default: "record.milestones",
        description: "Diamonds on the row; filled in ember once reached.",
      },
      {
        name: "renderLabel / renderBar",
        type: "(record) => ReactNode",
        description: "The name cell and the inside of a bar. An issue's id and title by default.",
      },
      {
        name: "zoom / defaultZoom",
        type: `"weeks" | "months" | "quarters"`,
        default: `"months"`,
        description: "A day is 28, 6 or 2 px. Controlled or not.",
      },
      { name: "onZoomChange", type: "(zoom) => void", description: "When the zoom changes." },
      shared.today,
      shared.selected,
      shared.onSelectedChange,
      shared.onOpen,
      {
        name: "onChange",
        type: "(id, { start, end }) => void",
        description:
          "Makes dates editable: drag a bar or its edges; Alt+arrows on a row move it (a day by weeks, a week otherwise), Shift for the end alone.",
      },
      {
        name: "collapsed / defaultCollapsed",
        type: "string[]",
        description: "The keys of the folded sections. Controlled or not.",
      },
      {
        name: "onCollapsedChange",
        type: "(keys: string[]) => void",
        description: "When a section is folded or opened.",
      },
      shared.toolbar,
      {
        name: "weekNumbers",
        type: "boolean",
        default: "false",
        description: "W47 instead of the date of each Monday, by months.",
      },
      {
        name: "labelWidth",
        type: "number",
        default: "240",
        description: "The width of the name column, in px.",
      },
      {
        name: "ref",
        type: "Ref<{ scrollToToday }>",
        description: "Scrolls today into view, for a Today button of your own.",
      },
      shared.className,
    ],
  },
  {
    slug: "calendar-view",
    name: "Calendar view",
    summary:
      "Records on the days of a month or a week, Monday first. Drag or Alt+arrows to move one.",
    imports: ["CalendarView"],
    props: [
      { name: "records", type: "T[]", description: "Records without a date are left out." },
      shared.getId,
      shared.getLabel,
      {
        name: "getDate",
        type: "(record) => string | null",
        default: "due, else date",
        description: "The day a record sits on, YYYY-MM-DD.",
      },
      shared.getColor,
      {
        name: "fields / dateField",
        type: "RecordFields<T>, string",
        description:
          "The records model instead of getDate: the field a record sits on. getDate wins when both are given.",
      },
      {
        name: "labelField / markField",
        type: "string",
        description:
          "With fields: the field read as the label, and a field drawn before it (a status glyph).",
      },
      {
        name: "context",
        type: "RecordContext",
        description: "The people, labels and today the marks of the fields need.",
      },
      {
        name: "renderItem",
        type: "(record) => ReactNode",
        description: "The inside of an item. An issue's id and title by default.",
      },
      {
        name: "date / defaultDate",
        type: "string",
        default: "today",
        description: "The day in focus: its month or week is shown. Controlled or not.",
      },
      { name: "onDateChange", type: "(date) => void", description: "When the day in focus moves." },
      {
        name: "mode / defaultMode",
        type: `"month" | "week"`,
        default: `"month"`,
        description: "A month with +n more, or a week with every record. Controlled or not.",
      },
      { name: "onModeChange", type: "(mode) => void", description: "When the mode changes." },
      {
        name: "modes",
        type: "CalendarMode[]",
        default: `["month", "week"]`,
        description: "The modes the toolbar offers. +n more opens the week when it is one.",
      },
      shared.today,
      shared.selected,
      shared.onSelectedChange,
      shared.onOpen,
      {
        name: "onChange",
        type: "(id, date) => void",
        description: "Makes records movable: drag to a day, or Alt+arrows on a record.",
      },
      {
        name: "maxPerDay",
        type: "number",
        default: "3",
        description: "Records a day of the month shows before +n more.",
      },
      shared.toolbar,
      shared.className,
    ],
  },
];
