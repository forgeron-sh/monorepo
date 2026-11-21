// The state of a view of records in one hook: the filters and the display options of `useListView`,
// the records they select grouped and ordered by the fields, and the lists the menus need
// (`FilterBar`, `FilterMenu`, `DisplayMenu`) read off the same fields.

import { useMemo } from "react";
import type { SelectMenuOption } from "../overlays";
import { useListView, type ListView, type UseListViewOptions } from "../hooks/use-list-view";
import type { DisplayChoice } from "./filtering-display-menu";
import type { FilterField } from "./filtering-model";
import {
  defaultProperties,
  displayProperties,
  filterFields,
  groupingOptions,
  orderingOptions,
  withGlyphs,
  type RecordGroup,
} from "./records-fields";
import type { RecordContext, RecordFields } from "./records-model";

const TITLE_ONLY: ReadonlyArray<string> = ["title"];

export interface RecordView<R> extends Omit<ListView<R>, "groups"> {
  /** The groups, each with the glyph of its value: the `groups` of a `RecordList`, the `columns` of a board. */
  groups: RecordGroup<R>[];
  /** The fields to filter on, with how many records have each value. */
  filterFields: FilterField[];
  /** The Display menu's lists. */
  groupingOptions: SelectMenuOption[];
  orderingOptions: SelectMenuOption[];
  displayProperties: DisplayChoice[];
}

/**
 * Filters, groups and orders `records` by `fields`. `defaultDisplay` starts at the list, grouped by
 * the first groupable field and ordered by the first sortable one, every property but the hidden.
 */
export function useRecordView<R>(
  records: ReadonlyArray<R>,
  fields: RecordFields<R>,
  context: RecordContext = {},
  options: Partial<UseListViewOptions> & { skip?: ReadonlyArray<string> } = {},
): RecordView<R> {
  const { skip = TITLE_ONLY, defaultDisplay, ...rest } = options;
  const spec = useMemo(() => fields.viewSpec(context), [fields, context]);
  const view = useListView(records, spec, {
    defaultDisplay: defaultDisplay ?? {
      layout: "list",
      grouping: fields.groupable[0] ?? "none",
      ordering: fields.sortable[0] ?? "none",
      toggles: {},
      properties: defaultProperties(fields),
    },
    ...rest,
  });
  const menus = useMemo(
    () => ({
      filterFields: filterFields(fields, context, records),
      groupingOptions: groupingOptions(fields),
      orderingOptions: orderingOptions(fields),
      displayProperties: displayProperties(fields, skip),
    }),
    [fields, context, records, skip],
  );
  return {
    ...view,
    groups: withGlyphs(fields, view.groups, view.display.grouping, context),
    ...menus,
  };
}
