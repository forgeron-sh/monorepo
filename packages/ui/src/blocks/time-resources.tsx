// Rows per person or resource over a stretch of days, with their blocks and the blocks that
// clash. The Timeline already draws bars between two dates in sections with a sticky column,
// zoom, drag and keyboard; this is a thin preset on it: a resource is a section, a block is a
// row, and a block that overlaps another of the same resource is marked and tinted.
// By the day: for hours of a day, use the TimeGrid with `resources`.
//
// Two ways to use it. With props it is the whole schedule. With children it is the root of the
// parts, which are the `Timeline` parts (it is a timeline underneath) and the clashes:
//
//   <ResourceSchedule resources={people} blocks={shifts} onChange={move}>
//     <ResourceScheduleToolbar />
//     <ResourceScheduleBody />
//     <ResourceScheduleConflicts />
//   </ResourceSchedule>

import { Alert02Icon } from "@forgeron/icons";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ComponentProps,
  type ReactNode,
} from "react";
import { Avatar } from "../avatar";
import { cx } from "../cx";
import { Icon } from "../icon";
import { renderPart, type Part } from "../part";
import { findConflicts, type Booking } from "./time-model";
import { resolveAccessors, textField, type RecordAccessors } from "./views-parts";
import {
  Timeline,
  TimelineScroller,
  TimelineToolbar,
  type TimelineDates,
  type TimelineProps,
  type TimelineRootProps,
} from "./views-timeline";

/** A person, a room, a vehicle: one section of the schedule. */
export interface ScheduleResource {
  id: string;
  name: string;
  /** A mark before the name; initials by default. */
  glyph?: ReactNode;
}

interface ResourceScheduleBase<T>
  extends
    RecordAccessors<T>,
    Omit<
      TimelineProps<T>,
      | "groups"
      | "records"
      | "getStart"
      | "getEnd"
      | "getId"
      | "getLabel"
      | "getColor"
      | "onChange"
      | "children"
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

export interface ResourceScheduleProps<T> extends ResourceScheduleBase<T> {
  /** Given, `ResourceSchedule` is the root of the parts. */
  children?: undefined;
}

export interface ResourceScheduleRootProps<T> extends ResourceScheduleBase<T> {
  children: ReactNode;
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

interface ResourceScheduleState {
  /** Block id to the ids it overlaps. */
  conflicts: ReadonlyMap<string, string[]>;
  resources: ReadonlyArray<ScheduleResource>;
  /** The name of a block, by id. */
  labelOf: (id: string) => string;
}

const ResourceScheduleContext = createContext<ResourceScheduleState | null>(null);

/** The clashes of the `ResourceSchedule` a part sits in. */
export function useResourceSchedule(part = "useResourceSchedule"): ResourceScheduleState {
  const state = useContext(ResourceScheduleContext);
  if (!state) throw new Error(`${part} goes inside a ResourceSchedule.`);
  return state;
}

/**
 * Resources as sections, blocks as bars on a time axis, clashes in red with a word for them. All
 * the options of the `Timeline` (zoom, today, selection, folding, drag) apply.
 */
export function ResourceSchedule<T>(
  props: ResourceScheduleProps<T> | ResourceScheduleRootProps<T>,
) {
  const {
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
    children,
    getId,
    getLabel,
    getColor,
    ...rest
  } = props;
  const acc = resolveAccessors<T>({
    ...(getId ? { getId } : {}),
    ...(getLabel ? { getLabel } : {}),
    ...(getColor ? { getColor } : {}),
  });
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
    [blocks, getResource, getStart, getEnd, isShared, getId],
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

  const timeline = {
    ...rest,
    groups,
    getId: acc.id,
    getLabel: acc.label,
    getStart: (r: T) => startOf(r) ?? endOf(r),
    getEnd: (r: T) => endOf(r) ?? startOf(r),
    getColor: (r: T) => (conflicts.has(acc.id(r)) ? "var(--danger)" : acc.color(r)),
    renderBar: (r: T) => {
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
    },
    label,
    empty,
    ...(onChange ? { onChange } : {}),
  };

  const state: ResourceScheduleState = {
    conflicts,
    resources,
    labelOf: (id) => {
      const block = blocks.find((b) => acc.id(b) === id);
      return block ? acc.label(block) : id;
    },
  };

  return (
    <ResourceScheduleContext.Provider value={state}>
      {children !== undefined ? (
        <Timeline<T>
          {...(timeline as unknown as TimelineRootProps<T>)}
          data-slot="resource-schedule"
        >
          {children}
        </Timeline>
      ) : (
        <Timeline<T> {...(timeline as unknown as TimelineProps<T>)} data-slot="resource-schedule" />
      )}
    </ResourceScheduleContext.Provider>
  );
}

/** Today and the zoom: the toolbar of the timeline underneath. */
export function ResourceScheduleToolbar(props: ComponentProps<typeof TimelineToolbar>) {
  return <TimelineToolbar data-slot="resource-schedule-toolbar" {...props} />;
}

/** The scrolling region with its axis and its rows: the timeline underneath. */
export function ResourceScheduleBody(props: ComponentProps<typeof TimelineScroller>) {
  return <TimelineScroller data-slot="resource-schedule-body" {...props} />;
}

/**
 * The blocks that clash, as a list: "Night shift clashes with 2 blocks". Nothing when there is no
 * clash. Give a function to draw an entry yourself.
 */
export function ResourceScheduleConflicts({
  className,
  asChild,
  children,
  ...rest
}: Omit<Part<ComponentProps<"ul">>, "children"> & {
  asChild?: boolean;
  children?: (id: string, clashes: string[]) => ReactNode;
}) {
  const g = useResourceSchedule("ResourceScheduleConflicts");
  if (g.conflicts.size === 0) return null;
  return renderPart("ul", cx("fg-rs-conflicts", className), asChild, {
    "data-slot": "resource-schedule-conflicts",
    "aria-label": "Conflicts",
    ...rest,
    children: [...g.conflicts].map(([id, clashes]) => (
      <li key={id} className="fg-rs-conflict">
        {children ? (
          children(id, clashes)
        ) : (
          <>
            <Icon icon={Alert02Icon} size={12} variant="mono" />
            <span>
              {g.labelOf(id)} clashes with{" "}
              {clashes.length === 1 ? g.labelOf(clashes[0]!) : `${clashes.length} blocks`}
            </span>
          </>
        )}
      </li>
    )),
  });
}
