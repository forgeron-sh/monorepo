// The picker of a question: a measure, how to add it up, how to group it and what to filter. Its
// value is a plain `DashboardQuery`; nothing here fetches data, the app turns the query into one.

import { useId, type ReactNode } from "react";
import { Combobox } from "../combobox";
import { Segmented } from "../controls";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { Select } from "../select";
import {
  DASHBOARD_AGGREGATIONS,
  dashboardEmptyQuery,
  dashboardQueryText,
  type DashboardAggregation,
  type DashboardInterval,
  type DashboardQuery,
} from "./dashboard-model";
import { FilterBar, FilterMenu } from "./filtering-filter-bar";
import type { Filter, FilterField } from "./filtering-model";

export type { DashboardQuery } from "./dashboard-model";

export interface MetricOption {
  id: string;
  label: string;
  /** Mono text at the end of the row: the source, the unit. */
  hint?: string;
  /** How it can be added up. Default count, sum, average, minimum and maximum. */
  aggregations?: ReadonlyArray<DashboardAggregation>;
}

export interface GroupingOption {
  id: string;
  label: string;
  hint?: string;
  /** `time` offers a slice of time (day, week, month) beside it. Default `category`. */
  kind?: "time" | "category";
}

export interface MetricPickerProps {
  /** What can be measured. */
  measures: ReadonlyArray<MetricOption>;
  /** What the measure can be grouped by. */
  groupings: ReadonlyArray<GroupingOption>;
  /** What can be filtered; without fields there is no filter step. */
  fields?: ReadonlyArray<FilterField>;
  value?: DashboardQuery;
  defaultValue?: DashboardQuery;
  onChange?: (query: DashboardQuery) => void;
  /** The slices of time offered. Default day, week, month. */
  intervals?: ReadonlyArray<DashboardInterval>;
  /** Names the group. Default `Question`. */
  label?: string;
  /** Writes the query in a sentence under the steps. Default `true`. */
  summary?: boolean;
  disabled?: boolean;
  className?: string;
}

const DEFAULT_AGGREGATIONS: ReadonlyArray<DashboardAggregation> = [
  "count",
  "sum",
  "avg",
  "min",
  "max",
];

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="fg-dash-mp-step">
      <span className="fg-dash-mp-head">
        <span className="fg-dash-mp-n" aria-hidden="true">
          {n}
        </span>
        {title}
      </span>
      <div className="fg-dash-mp-body">{children}</div>
    </li>
  );
}

/**
 * Pick a measure, group it, filter it: the value is a `DashboardQuery`, serialisable. Built from a
 * combobox, a select, a segmented switch and the filter bar.
 */
export function MetricPicker({
  measures,
  groupings,
  fields,
  value,
  defaultValue = dashboardEmptyQuery,
  onChange,
  intervals = ["day", "week", "month"],
  label = "Question",
  summary = true,
  disabled,
  className,
}: MetricPickerProps) {
  const id = useId();
  const [query, setQuery] = useControllableState<DashboardQuery>({ value, defaultValue, onChange });
  const measure = measures.find((m) => m.id === query.measure);
  const aggregations = measure?.aggregations ?? DEFAULT_AGGREGATIONS;
  const grouping = groupings.find((g) => g.id === query.groupBy);
  const catalog = { measures, groupings, ...(fields ? { fields } : {}) };
  const update = (patch: Partial<DashboardQuery>) => setQuery({ ...query, ...patch });
  return (
    <section className={cx("fg-dash-mp", className)} aria-label={label}>
      <ol className="fg-dash-mp-steps">
        <Step n={1} title="Measure">
          <Combobox
            label="Measure"
            value={query.measure}
            clearable={false}
            placeholder="Pick a measure"
            disabled={disabled}
            options={measures.map((m) => ({
              value: m.id,
              label: m.label,
              ...(m.hint ? { hint: m.hint } : {}),
            }))}
            onChange={(next) => {
              const allowed =
                measures.find((m) => m.id === next)?.aggregations ?? DEFAULT_AGGREGATIONS;
              update({
                measure: next,
                aggregation: allowed.includes(query.aggregation) ? query.aggregation : allowed[0]!,
              });
            }}
          />
          {measure ? (
            <>
              <span className="fg-dash-mp-word" id={`${id}-agg`}>
                added up as
              </span>
              <Select
                aria-labelledby={`${id}-agg`}
                value={query.aggregation}
                disabled={disabled || aggregations.length < 2}
                options={DASHBOARD_AGGREGATIONS.filter((a) => aggregations.includes(a.value))}
                onChange={(event) =>
                  update({ aggregation: event.target.value as DashboardAggregation })
                }
              />
            </>
          ) : null}
        </Step>
        <Step n={2} title="Group by">
          <Combobox
            label="Group by"
            value={query.groupBy}
            placeholder="No grouping: one figure"
            disabled={disabled}
            options={groupings.map((g) => ({
              value: g.id,
              label: g.label,
              ...(g.hint ? { hint: g.hint } : {}),
            }))}
            onChange={(next) => update({ groupBy: next })}
          />
          {grouping?.kind === "time" ? (
            <Segmented
              label="Slice of time"
              value={query.interval}
              onChange={(next) => update({ interval: next as DashboardInterval })}
              options={intervals.map((i) => ({ value: i, label: i }))}
            />
          ) : null}
        </Step>
        {fields && fields.length > 0 ? (
          <Step n={3} title="Filter">
            <FilterMenu
              fields={fields}
              value={query.filters}
              onChange={(filters: Filter[]) => update({ filters })}
              label="Add filter"
            />
            <FilterBar
              fields={fields}
              value={query.filters}
              onChange={(filters: Filter[]) => update({ filters })}
            />
          </Step>
        ) : null}
      </ol>
      {summary ? (
        <p className="fg-dash-mp-sum" aria-live="polite">
          {dashboardQueryText(query, catalog)}
        </p>
      ) : null}
    </section>
  );
}
