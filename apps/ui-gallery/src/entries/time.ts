import type { Atom, PropRow } from "../types";

const className: PropRow = { name: "className", type: "string", description: "Extra classes." };
const controlled = (name: string, type: string, description: string): PropRow => ({
  name: `${name} / default${name[0]!.toUpperCase()}${name.slice(1)}`,
  type,
  description: `${description} Controlled or not.`,
});

/** Gallery pages of the "time" blocks: grid, availability, slots, recurrence, zones, schedule. */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "time-grid",
    name: "Time grid",
    summary:
      "Day, work week or week as columns of hours: overlapping events side by side, an all-day row, the now line, create and move by pointer or keyboard.",
    imports: ["TimeGrid"],
    props: [
      {
        name: "Parts",
        type: "TimeGrid",
        description:
          "With children, TimeGrid is the root of the parts (the props are the same). TimeGridToolbar (TimeGridToday, TimeGridPrevious, TimeGridNext, TimeGridTitle, TimeGridWeekNumber, TimeGridViews) and TimeGridBody, the EventGrid underneath: give it EventGrid parts (EventGridHeader, EventGridBody, EventGridColumns…) to draw the columns yourself. useTimeGrid() reads the date, the view and the days.",
      },
      {
        name: "records",
        type: "T[]",
        description: "Events, meetings, shifts, bookings: anything with a day and times.",
      },
      {
        name: "getId / getLabel / getColor",
        type: "(record) => string",
        default: "id, title or name, color",
        description: "How a record is read.",
      },
      {
        name: "getDate / getStart / getEnd",
        type: "(record) => string | null",
        default: "date, start, end",
        description: "The day (YYYY-MM-DD) and the times (HH:mm; 24:00 ends the day).",
      },
      {
        name: "getAllDay / getEndDate",
        type: "(record) => boolean | string",
        default: "allDay, endDate",
        description: "Records of the all-day row, and the last day of one that spans several.",
      },
      {
        name: "getResource",
        type: "(record) => string",
        default: "record.resource",
        description: "The resource column of a record.",
      },
      {
        name: "resources",
        type: "{ id, name, color? }[]",
        description:
          "Columns per resource (rooms, people, chairs); with the day view, the columns of one day.",
      },
      {
        name: "renderEvent / renderAllDay",
        type: "(record, info) => ReactNode",
        description:
          "The inside of an event (info: date, start, end, compact) and of an all-day chip.",
      },
      controlled("view", `"day" | "workweek" | "week"`, "The days shown."),
      {
        name: "views / onViewChange",
        type: "GridView[]",
        default: "all three",
        description: "The views the toolbar offers, and a listener.",
      },
      controlled("date", "string", "The day in focus: its day or week is shown."),
      {
        name: "onDateChange",
        type: "(date) => void",
        description: "When the toolbar, Page Up and Page Down or an edge arrow move the day.",
      },
      {
        name: "now",
        type: "string",
        default: "the device's clock",
        description: "YYYY-MM-DDTHH:mm: places the ember line and today. Fix it in tests.",
      },
      {
        name: "hours",
        type: "[number, number]",
        default: "[0, 24]",
        description: "The hours drawn.",
      },
      {
        name: "scrollTo",
        type: "number",
        default: "7",
        description: "The hour at the top when the grid appears.",
      },
      {
        name: "hourHeight / step / defaultDuration",
        type: "number",
        default: "48 / 15 / 60",
        description:
          "px per hour, the snap in minutes, the length of an event made by double click or Enter.",
      },
      {
        name: "workingHours",
        type: "TimeSpan[][] | (date, resource?) => TimeSpan[]",
        description:
          "Seven lists (Monday first, like Availability.weekly) or a function; the rest is hatched.",
      },
      { name: "hour12", type: "boolean", default: "false", description: "Times with AM and PM." },
      controlled("selected", "string | null", "The current event."),
      {
        name: "onSelectedChange / onOpen",
        type: "(id) => void",
        description: "A click moves the current event; Enter or a click opens it.",
      },
      {
        name: "onCreate",
        type: "(slot: TimeGridChange) => void",
        description:
          "Makes empty space create: drag, double click, or on a focused column the arrows (cursor), Shift (length) and Enter.",
      },
      {
        name: "onChange",
        type: "(id, change: TimeGridChange) => void",
        description:
          "Makes events movable and resizable: drag, drag the foot, arrows, Shift and arrows. Left and right change day or resource column.",
      },
      {
        name: "toolbar / allDayRow / label",
        type: "boolean / boolean / string",
        default: "true / only when needed",
        description: "Today, previous, next and views; the all-day row; the name of the grid.",
      },
      className,
    ],
  },
  {
    slug: "availability-editor",
    name: "Availability editor",
    summary:
      "Weekly hours with several ranges a day, copy to other days, dates that differ (off or custom hours) and the time zone.",
    imports: ["AvailabilityEditor", "defaultWeekly", "spansOn", "normalizeSpans"],
    props: [
      {
        name: "Parts",
        type: "AvailabilityEditor",
        description:
          "With children, AvailabilityEditor is the root of the parts. AvailabilityEditorZone, AvailabilityEditorWeek (seven AvailabilityEditorDay, each a DayHead, DayBody with AvailabilityEditorRanges, and Copy), AvailabilityEditorExceptions (AvailabilityEditorExceptionList of AvailabilityEditorException, AvailabilityEditorExceptionAdd). useAvailabilityEditor() reads the value.",
      },
      controlled(
        "value",
        "Availability",
        "{ timezone, weekly: TimeSpan[][] (Monday first, [] is off), exceptions: { date, kind: off | hours, spans }[] }.",
      ),
      {
        name: "onChange",
        type: "(value: Availability) => void",
        description:
          "On every edit. Invalid ranges are flagged, not corrected: use normalizeSpans when saving.",
      },
      {
        name: "timezones",
        type: "string[]",
        default: "every zone",
        description: "The zones offered.",
      },
      {
        name: "showTimezone / showExceptions",
        type: "boolean",
        default: "true",
        description: "Hide the zone or the exceptions.",
      },
      {
        name: "step / hour12",
        type: "number / boolean",
        default: "15 / false",
        description: "Minutes between the times of a list; AM and PM.",
      },
      {
        name: "today",
        type: "string",
        default: "the device's date",
        description: "The date the exception picker opens on.",
      },
      { name: "disabled", type: "boolean", description: "Read only." },
      className,
    ],
  },
  {
    slug: "slot-picker",
    name: "Slot picker",
    summary:
      "A day strip or a month, then the times: duration, time zone with its offset, taken and past slots struck, one chosen. For bookings.",
    imports: ["SlotPicker", "daySlots"],
    props: [
      {
        name: "Parts",
        type: "SlotPicker",
        description:
          "With children, SlotPicker is the root of the parts. SlotPickerHeader (SlotPickerDuration, SlotPickerZone), SlotPickerBody holding SlotPickerDays (SlotPickerStrip of SlotPickerDay, or SlotPickerCalendar) and SlotPickerTimes (SlotPickerTitle, SlotPickerList on the SlotList primitive, SlotPickerSummary, SlotPickerConfirm). useSlotPicker() reads the day, the zone and the choice.",
      },
      controlled(
        "value",
        "SlotChoice | null",
        "{ date, time, timezone, duration, host } in the zone shown, and the same moment where the hours are written.",
      ),
      {
        name: "onChange",
        type: "(slot: SlotChoice | null) => void",
        description: "A click on a free time chooses it; another click removes it.",
      },
      {
        name: "availability / busy",
        type: "Availability / BusyBlock[]",
        description: "Hours and time already taken: the slots are computed from them.",
      },
      {
        name: "slots",
        type: "{ date, time, available? }[]",
        description:
          "Slots given as they are (a server's answer), in the host's zone; they replace the computation.",
      },
      {
        name: "duration / interval",
        type: "number",
        default: "30 / duration",
        description: "Minutes of a visit and between two starts.",
      },
      {
        name: "hostTimezone",
        type: "string",
        default: "availability.timezone",
        description: "The zone the hours and slots are written in.",
      },
      controlled("timezone", "string", "The zone shown; the slots move to it."),
      {
        name: "onTimezoneChange / timezonePicker",
        type: "(zone) => void / boolean",
        description: "Lets the person change the zone.",
      },
      {
        name: "layout",
        type: `"strip" | "calendar"`,
        default: `"strip"`,
        description: "A row of days with their counts, or a month beside the times.",
      },
      controlled("date", "string", "The day shown."),
      {
        name: "days / max",
        type: "number / string",
        default: "7",
        description: "Days in the strip; the last day that can be booked.",
      },
      {
        name: "now",
        type: "string",
        description: "YYYY-MM-DDTHH:mm in the zone shown: earlier slots are past.",
      },
      {
        name: "showUnavailable / hour12",
        type: "boolean",
        default: "true / false",
        description: "Keep taken slots in the list, struck; AM and PM.",
      },
      {
        name: "confirmLabel / onConfirm",
        type: "string / (slot) => void",
        description: "A primary button under the times.",
      },
      className,
    ],
  },
  {
    slug: "recurrence-editor",
    name: "Recurrence editor",
    summary:
      "Every n days, weeks, months or years, on some weekdays, until a date or after n times; the sentence and the next dates.",
    imports: [
      "RecurrenceEditor",
      "expandRecurrence",
      "describeRecurrence",
      "recurrenceToRrule",
      "parseRrule",
    ],
    props: [
      {
        name: "Parts",
        type: "RecurrenceEditor",
        description:
          "With children, RecurrenceEditor is the root of the parts, in any order: RecurrenceEditorToggle, RecurrenceEditorEvery, RecurrenceEditorDays, RecurrenceEditorEnd, RecurrenceEditorSummary, RecurrenceEditorNext, RecurrenceEditorStatus. Every part but the switch is empty while the event does not repeat. useRecurrenceEditor() reads the rule.",
      },
      controlled(
        "value",
        "Recurrence | null",
        "{ frequency, interval, weekdays?, end: never | until | count }; null does not repeat.",
      ),
      {
        name: "onChange",
        type: "(rule: Recurrence | null) => void",
        description: "On every edit.",
      },
      {
        name: "start",
        type: "string",
        description:
          "The first date, YYYY-MM-DD: the weekday and the day of the month come from it.",
      },
      {
        name: "preview",
        type: "number",
        default: "3",
        description: "How many next dates to list.",
      },
      { name: "optional", type: "boolean", default: "true", description: "The Repeat switch." },
      {
        name: "frequencies",
        type: "RecurrenceFrequency[]",
        default: "all four",
        description: "The units offered.",
      },
      { name: "disabled", type: "boolean", description: "Read only." },
      className,
    ],
  },
  {
    slug: "resource-schedule",
    name: "Resource schedule",
    summary:
      "Rows per person or resource over days: blocks as bars, clashes marked. A thin preset on the Timeline, not a second engine.",
    imports: ["ResourceSchedule", "scheduleConflicts", "findConflicts"],
    props: [
      {
        name: "Parts",
        type: "ResourceSchedule",
        description:
          "With children, ResourceSchedule is the root of the parts: ResourceScheduleToolbar and ResourceScheduleBody (the Timeline parts underneath), ResourceScheduleConflicts (the blocks that clash, as a list). useResourceSchedule() reads the clashes.",
      },
      {
        name: "resources",
        type: "{ id, name, glyph? }[]",
        description: "One section each, initials in front by default.",
      },
      {
        name: "blocks",
        type: "T[]",
        description: "Leave, shifts, bookings: a row under their resource.",
      },
      {
        name: "getResource / getStart / getEnd",
        type: "(record) => string",
        default: "resource, start, end",
        description: "Days are YYYY-MM-DD, last day included.",
      },
      {
        name: "getId / getLabel / getColor",
        type: "(record) => string",
        default: "id, title or name, color",
        description: "As the Timeline.",
      },
      {
        name: "isShared",
        type: "(record) => boolean",
        description: "A block that may overlap others (a holiday) and is never a clash.",
      },
      {
        name: "onConflicts",
        type: "(Map<id, id[]>) => void",
        description: "The clashes, whenever they change.",
      },
      {
        name: "onChange",
        type: "(id, { start, end }) => void",
        description: "Drag or Alt and arrows, as the Timeline; the resource does not change.",
      },
      {
        name: "…Timeline props",
        type: "zoom, today, selected, onOpen, collapsed, toolbar, labelWidth, renderBar…",
        description:
          "All pass through. Timeline covers it: one bar per row, so several blocks of a resource are rows under its section. Hours of a day belong to the TimeGrid with resources.",
      },
    ],
  },
];
