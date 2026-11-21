// The picker of a question: a measure, how to add it up, how to group it and what to filter. Its
// value is a plain `DashboardQuery`; nothing here fetches data, the app turns the query into one.
//
// Without children it draws the three steps and the sentence. With children they are the parts
// (the catalogue, `measures` and `groupings`, stays in the root):
//
//   <MetricPicker measures={measures} groupings={groupings} fields={fields} onChange={ask}>
//     <MetricPickerSteps>
//       <MetricPickerMeasure />
//       <MetricPickerGrouping />
//       <MetricPickerFilter />
//     </MetricPickerSteps>
//     <MetricPickerSummary />
//   </MetricPicker>

import { createContext, useContext, useId, type ComponentProps, type ReactNode } from "react";
import { Combobox } from "../combobox";
import { Segmented } from "../controls";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { Select } from "../select";
import { renderPart } from "../part";
import {
  DASHBOARD_AGGREGATIONS,
  dashboardEmptyQuery,
  dashboardQueryText,
  type DashboardAggregation,
  type DashboardInterval,
  type DashboardQuery,
  type DashboardQueryCatalog,
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

export interface MetricPickerProps extends Omit<
  ComponentProps<"section">,
  "className" | "onChange" | "defaultValue" | "children"
> {
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
  /** Writes the query in a sentence under the steps. Default `true`; with parts, place `MetricPickerSummary`. */
  summary?: boolean;
  disabled?: boolean;
  className?: string;
  asChild?: boolean;
  /** The parts. Without them: the steps and the sentence. */
  children?: ReactNode;
}

const DEFAULT_AGGREGATIONS: ReadonlyArray<DashboardAggregation> = [
  "count",
  "sum",
  "avg",
  "min",
  "max",
];

interface MetricPickerContext {
  query: DashboardQuery;
  update: (patch: Partial<DashboardQuery>) => void;
  measures: ReadonlyArray<MetricOption>;
  groupings: ReadonlyArray<GroupingOption>;
  fields: ReadonlyArray<FilterField> | undefined;
  intervals: ReadonlyArray<DashboardInterval>;
  catalog: DashboardQueryCatalog;
  disabled: boolean | undefined;
}

const Ctx = createContext<MetricPickerContext | null>(null);

/** The picker a part is in: the query and the catalogue it is made from. */
export function useMetricPicker(part = "useMetricPicker"): MetricPickerContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error(`<${part}> goes inside a <MetricPicker>.`);
  return ctx;
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
  asChild,
  children,
  ...rest
}: MetricPickerProps) {
  const [query, setQuery] = useControllableState<DashboardQuery>({ value, defaultValue, onChange });
  const ctx: MetricPickerContext = {
    query,
    update: (patch) => setQuery({ ...query, ...patch }),
    measures,
    groupings,
    fields,
    intervals,
    catalog: { measures, groupings, ...(fields ? { fields } : {}) },
    disabled,
  };
  return (
    <Ctx.Provider value={ctx}>
      {renderPart("section", cx("fg-dash-mp", className), asChild, {
        "data-slot": "metric-picker",
        "aria-label": label,
        ...rest,
        children: children ?? (
          <>
            <MetricPickerSteps>
              <MetricPickerMeasure />
              <MetricPickerGrouping />
              {fields && fields.length > 0 ? <MetricPickerFilter /> : null}
            </MetricPickerSteps>
            {summary ? <MetricPickerSummary /> : null}
          </>
        ),
      })}
    </Ctx.Provider>
  );
}

/* ---------------------------------------------------------------- parts */

/** The numbered steps, as an ordered list. */
export function MetricPickerSteps({ className, ...rest }: ComponentProps<"ol">) {
  return (
    <ol data-slot="metric-picker-steps" {...rest} className={cx("fg-dash-mp-steps", className)} />
  );
}

export interface MetricPickerStepProps extends Omit<ComponentProps<"li">, "title"> {
  /** Its number, in front of the title. */
  n: number;
  title: ReactNode;
}

/** One step: its number and title, then what it asks. */
export function MetricPickerStep({
  n,
  title,
  className,
  children,
  ...rest
}: MetricPickerStepProps) {
  return (
    <li data-slot="metric-picker-step" {...rest} className={cx("fg-dash-mp-step", className)}>
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

/** Step 1: the measure, and how it is added up. */
export function MetricPickerMeasure({
  n = 1,
  title = "Measure",
  children,
  ...rest
}: Partial<MetricPickerStepProps>) {
  const { query, update, measures, disabled } = useMetricPicker("MetricPickerMeasure");
  const id = useId();
  const measure = measures.find((m) => m.id === query.measure);
  const aggregations = measure?.aggregations ?? DEFAULT_AGGREGATIONS;
  return (
    <MetricPickerStep n={n} title={title} {...rest}>
      {children ?? (
        <>
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
        </>
      )}
    </MetricPickerStep>
  );
}

/** Step 2: what to group by, and the slice of time when it is a time. */
export function MetricPickerGrouping({
  n = 2,
  title = "Group by",
  children,
  ...rest
}: Partial<MetricPickerStepProps>) {
  const { query, update, groupings, intervals, disabled } = useMetricPicker("MetricPickerGrouping");
  const grouping = groupings.find((g) => g.id === query.groupBy);
  return (
    <MetricPickerStep n={n} title={title} {...rest}>
      {children ?? (
        <>
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
        </>
      )}
    </MetricPickerStep>
  );
}

/** Step 3: the filters. Nothing without `fields` on the root. */
export function MetricPickerFilter({
  n = 3,
  title = "Filter",
  children,
  ...rest
}: Partial<MetricPickerStepProps>) {
  const { query, update, fields } = useMetricPicker("MetricPickerFilter");
  if (!fields || fields.length === 0) return null;
  return (
    <MetricPickerStep n={n} title={title} {...rest}>
      {children ?? (
        <>
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
        </>
      )}
    </MetricPickerStep>
  );
}

/** The query as a sentence: `Sum of amount per month, where…`. */
export function MetricPickerSummary({ className, children, ...rest }: ComponentProps<"p">) {
  const { query, catalog } = useMetricPicker("MetricPickerSummary");
  return (
    <p
      data-slot="metric-picker-summary"
      aria-live="polite"
      {...rest}
      className={cx("fg-dash-mp-sum", className)}
    >
      {children ?? dashboardQueryText(query, catalog)}
    </p>
  );
}
