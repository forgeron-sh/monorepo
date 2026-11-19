// Rows per person or resource over a stretch of days, with their blocks and the blocks that
// clash. The Timeline already draws bars between two dates in sections with a sticky column,
// zoom, drag and keyboard; this is a thin preset on it: a resource is a section, a block is a
// row, and a block that overlaps another of the same resource is marked and tinted.
// By the day: for hours of a day, use the TimeGrid with `resources`.

import { Alert02Icon } from "@forgeron/icons";
import { useEffect, useMemo, type ReactNode } from "react";
import { Avatar } from "../avatar";
import { Icon } from "../icon";
import { findConflicts, type Booking } from "./time-model";
import { resolveAccessors, textField, type RecordAccessors } from "./views-parts";
import { Timeline, type TimelineDates, type TimelineProps } from "./views-timeline";

/** A person, a room, a vehicle: one section of the schedule. */
export interface ScheduleResource {
  id: string;
  name: string;
  /** A mark before the name; initials by default. */
  glyph?: ReactNode;
}

export interface ResourceScheduleProps<T>
  extends
    RecordAccessors<T>,
    Omit<
      TimelineProps<T>,
      "groups" | "records" | "getStart" | "getEnd" | "getId" | "getLabel" | "getColor" | "onChange"
    > {
  resources: ReadonlyArray<ScheduleResource>;
  /** The blocks: shifts, leave, bookings. */
  blocks: ReadonlyArray<T>;
  /** The resource of a block: `record.resource` by default. */
  getResource?: (record: T) => string | null | undefined;
  /** First day, `YYYY-MM-DD`: `record.start` by default. */
  getStart?: (record: T) => string | null | undefined;
  /** Last day: `record.end` by default. */
  getEnd?: (record: T) => string | null | undefined;
  /** A block that may overlap others without being a conflict (an all-hands, a holiday). */
  isShared?: (record: T) => boolean;
  /** Hears the clashes whenever they change: block id to the ids it overlaps. */
  onConflicts?: (conflicts: ReadonlyMap<string, string[]>) => void;
  /** Moves a block in time (a drag, or Alt and the arrows); the resource does not change. */
  onChange?: (id: string, dates: TimelineDates) => void;
}

/** The blocks of a resource schedule that overlap another block of the same resource. */
export function scheduleConflicts<T>(
  blocks: ReadonlyArray<T>,
  read: {
    id: (r: T) => string;
    resource: (r: T) => string | null | undefined;
    start: (r: T) => string | null | undefined;
    end: (r: T) => string | null | undefined;
    shared?: (r: T) => boolean;
  },
): Map<string, string[]> {
  const list: Booking[] = [];
  for (const b of blocks) {
    const resource = read.resource(b);
    const start = read.start(b) ?? read.end(b);
    const end = read.end(b) ?? start;
    if (!resource || !start || !end || read.shared?.(b)) continue;
    list.push({ id: read.id(b), resource, start, end });
  }
  return findConflicts(list);
}

/**
 * Resources as sections, blocks as bars on a time axis, clashes in red with a word for them. All
 * the options of the `Timeline` (zoom, today, selection, folding, drag) apply.
 */
export function ResourceSchedule<T>({
  resources,
  blocks,
  getResource,
  getStart,
  getEnd,
  isShared,
  onConflicts,
  onChange,
  renderBar,
  label = "Resource schedule",
  empty = "No resource to plan",
  ...rest
}: ResourceScheduleProps<T>) {
  const acc = resolveAccessors(rest);
  const resourceOf = (r: T) => (getResource ? getResource(r) : textField(r, "resource")) ?? null;
  const startOf = (r: T) => (getStart ? getStart(r) : textField(r, "start")) ?? null;
  const endOf = (r: T) => (getEnd ? getEnd(r) : textField(r, "end")) ?? null;

  const conflicts = useMemo(
    () =>
      scheduleConflicts(blocks, {
        id: acc.id,
        resource: resourceOf,
        start: startOf,
        end: endOf,
        ...(isShared ? { shared: isShared } : {}),
      }),
    // The accessors are read on every render by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [blocks, getResource, getStart, getEnd, isShared, rest.getId],
  );
  useEffect(() => onConflicts?.(conflicts), [conflicts, onConflicts]);

  const groups = resources.map((res) => ({
    key: res.id,
    name: res.name,
    glyph: res.glyph ?? <Avatar name={res.name} size={16} />,
    records: blocks
      .filter((b) => resourceOf(b) === res.id)
      .sort((a, b) => (startOf(a) ?? "").localeCompare(startOf(b) ?? "")),
  }));

  return (
    <Timeline<T>
      {...rest}
      groups={groups}
      getId={acc.id}
      getLabel={acc.label}
      getStart={(r) => startOf(r) ?? endOf(r)}
      getEnd={(r) => endOf(r) ?? startOf(r)}
      getColor={(r) => (conflicts.has(acc.id(r)) ? "var(--danger)" : acc.color(r))}
      renderBar={(r) => {
        const clash = conflicts.get(acc.id(r));
        const inner = renderBar ? renderBar(r) : acc.label(r);
        return clash ? (
          <>
            <Icon icon={Alert02Icon} size={12} variant="mono" />
            <span className="fg-sr">
              Conflict with {clash.length === 1 ? "another block" : `${clash.length} blocks`}.{" "}
            </span>
            {inner}
          </>
        ) : (
          inner
        );
      }}
      label={label}
      empty={empty}
      {...(onChange ? { onChange } : {})}
    />
  );
}
