// Blocks of the "time" group: the grid of an agenda, hours of availability, the choice of a slot,
// recurrence, time zones and durations, and a schedule of resources. Each block lives in its own
// file next to this one; this barrel re-exports them. None of them knows an app: records are read
// through accessors and values are plain strings (`YYYY-MM-DD`, `HH:mm`).

export { TimeGrid } from "./time-grid";
export type {
  TimeGridChange,
  TimeGridEventInfo,
  TimeGridProps,
  TimeGridResource,
} from "./time-grid";
export { AvailabilityEditor } from "./time-availability";
export type { AvailabilityEditorProps } from "./time-availability";
export { SlotPicker } from "./time-slots";
export type { SlotChoice, SlotPickerProps } from "./time-slots";
export { RecurrenceEditor } from "./time-recurrence";
export type { RecurrenceEditorProps } from "./time-recurrence";
export { ResourceSchedule, scheduleConflicts } from "./time-resources";
export type { ResourceScheduleProps, ScheduleResource } from "./time-resources";
export {
  clockIn,
  convertTime,
  daySlots,
  defaultWeekly,
  describeRecurrence,
  expandRecurrence,
  findConflicts,
  formatMinutes,
  formatOffset,
  fromMinutes,
  isTimezone,
  layoutOverlaps,
  listTimezones,
  nextOccurrences,
  nextSpan,
  normalizeSpans,
  parseMinutes,
  parseRrule,
  recurrenceToRrule,
  slotsOnDay,
  snapMinutes,
  spanErrors,
  spansOn,
  stepView,
  timezoneOffset,
  toMinutes,
  totalMinutes,
  viewDays,
  zonedParts,
  zonedToUtc,
} from "./time-model";
export type {
  Availability,
  AvailabilityException,
  Booking,
  BusyBlock,
  GridView,
  Placed,
  Recurrence,
  RecurrenceEnd,
  RecurrenceFrequency,
  SlotItem,
  SlotReason,
  TimeSlot,
  TimeSpan,
} from "./time-model";
