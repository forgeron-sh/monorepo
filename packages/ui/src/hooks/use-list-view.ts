// The state of a view in one hook: the filters, the display options, and the records they give,
// filtered, grouped and ordered. The view's parts (FilterMenu, FilterBar, DisplayMenu,
// LayoutSwitch) take what it returns; the layout renders `groups`.

import { useMemo, useState } from "react";
import type { DisplayOptions } from "../blocks/filtering-display-menu";
import { matchesFilters, type Filter } from "../blocks/filtering-model";

/** One way to group records: the key of a record, and the order and names of the keys. */
export interface ViewGrouping<T> {
  /** The group a record falls in, e.g. its status. */
  key: (record: T) => string;
  /** The keys in the order of the groups; keys not listed come after, in order of appearance. */
  order?: ReadonlyArray<string>;
  /** The name of a group, e.g. `STATUS_NAMES[key]`; the key by default. */
  name?: (key: string) => string;
}

export interface ViewSpec<T> {
  /** The value of a record for a filter field: a string, a list (labels), or null for none. */
  read: (record: T, field: string) => string | ReadonlyArray<string> | null | undefined;
  /** The groupings offered, by id. `none` (or an id not listed) puts every record in one group. */
  groupings?: Readonly<Record<string, ViewGrouping<T>>>;
  /** The orderings offered, by id: a comparison of two records. */
  orderings?: Readonly<Record<string, (a: T, b: T) => number>>;
}

export interface ViewGroup<T> {
  key: string;
  name: string;
  records: T[];
}

export interface UseListViewOptions {
  /** The display options a view starts with, and goes back to on "Reset to default". */
  defaultDisplay: DisplayOptions;
  defaultFilters?: ReadonlyArray<Filter>;
}

export interface ListView<T> {
  filters: Filter[];
  setFilters: (filters: Filter[]) => void;
  display: DisplayOptions;
  setDisplay: (display: DisplayOptions) => void;
  /** Sets the layout alone, e.g. from a shortcut or a `LayoutSwitch`. */
  setLayout: (layout: string) => void;
  /** The records that pass the filters, in order. */
  records: T[];
  /** The same records in their groups, empty groups left out unless the grouping lists them. */
  groups: ViewGroup<T>[];
  /** The options to pass as `defaultValue` to the DisplayMenu. */
  defaultDisplay: DisplayOptions;
}

/** Filters, then orders, then groups `records` (pure: usable on the server or in a test). */
export function viewRecords<T>(
  records: ReadonlyArray<T>,
  spec: ViewSpec<T>,
  filters: ReadonlyArray<Filter>,
  display: Pick<DisplayOptions, "grouping" | "ordering">,
  { keepEmpty = false }: { keepEmpty?: boolean } = {},
): { records: T[]; groups: ViewGroup<T>[] } {
  const kept = records.filter((r) => matchesFilters(filters, (field) => spec.read(r, field)));
  const compare = spec.orderings?.[display.ordering];
  const ordered = compare ? [...kept].sort(compare) : kept;
  const grouping = spec.groupings?.[display.grouping];
  if (!grouping)
    return { records: ordered, groups: [{ key: "all", name: "All", records: ordered }] };
  const byKey = new Map<string, T[]>();
  for (const key of grouping.order ?? []) byKey.set(key, []);
  for (const r of ordered) {
    const key = grouping.key(r);
    const list = byKey.get(key);
    if (list) list.push(r);
    else byKey.set(key, [r]);
  }
  const groups = [...byKey]
    .filter(([, list]) => keepEmpty || list.length > 0)
    .map(([key, list]) => ({ key, name: grouping.name?.(key) ?? key, records: list }));
  return { records: groups.flatMap((g) => g.records), groups };
}

/**
 * Holds the filters and display options of a view and gives the records they select, grouped
 * and ordered. A `showEmptyGroups` toggle, when on, keeps the empty groups of the grouping's order.
 */
export function useListView<T>(
  records: ReadonlyArray<T>,
  spec: ViewSpec<T>,
  { defaultDisplay, defaultFilters = [] }: UseListViewOptions,
): ListView<T> {
  const [filters, setFilters] = useState<Filter[]>(() => [...defaultFilters]);
  const [display, setDisplay] = useState<DisplayOptions>(defaultDisplay);
  const keepEmpty = Boolean(display.toggles.showEmptyGroups);
  const { grouping, ordering } = display;
  const result = useMemo(
    () => viewRecords(records, spec, filters, { grouping, ordering }, { keepEmpty }),
    [records, spec, filters, grouping, ordering, keepEmpty],
  );
  return {
    filters,
    setFilters,
    display,
    setDisplay,
    setLayout: (layout) => setDisplay((d) => ({ ...d, layout })),
    records: result.records,
    groups: result.groups,
    defaultDisplay,
  };
}
