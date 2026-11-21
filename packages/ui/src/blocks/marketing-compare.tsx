// Plans compared, a column per plan.
//
// A root with parts. `CompareTable` takes `columns` and `groups` as shorthand, or the parts:
// `CompareTableHead` (`CompareTableColumn`), `CompareTableGroup`, `CompareTableRow` (`CompareTableName`,
// `CompareTableCell`).

import { Tick01Icon } from "@forgeron/icons";
import type { IconDefinition } from "@forgeron/icons";
import type { ReactNode } from "react";
import { Fragment } from "react";
import { cx } from "../cx";
import { Icon } from "../icon";
import { part, type PartProps } from "../part";

/** A cell: included (`true`), not included (`false`), or a word (`Soon` is dashed). */
export type CompareValue = boolean | string;

export interface CompareTableProps extends Omit<PartProps<"div">, "children"> {
  /** Names the table for assistive technology. */
  label: string;
  /** One column per plan, after the row names. */
  columns?: ReadonlyArray<{ name: string; icon: IconDefinition }>;
  /** Rows in titled groups; each row has one value per column. */
  groups?: ReadonlyArray<{
    group: string;
    rows: ReadonlyArray<{ name: string; v: ReadonlyArray<CompareValue> }>;
  }>;
  /** The parts, when there are no `columns` and `groups`. */
  children?: ReactNode;
}

/**
 * Plans compared, a column per plan: ticks, dashes and words, rows in groups. The head sticks
 * under the navigation (`--fg-cmp-top`, 60px).
 */
export function CompareTable({
  label,
  columns,
  groups = [],
  children,
  asChild,
  className,
  ...rest
}: CompareTableProps) {
  return part("div", "compare-table", "fg-cmp", {
    asChild,
    className,
    ...rest,
    role: "table",
    "aria-label": label,
    children: columns ? (
      <>
        <CompareTableHead>
          {columns.map((c) => (
            <CompareTableColumn key={c.name} name={c.name} icon={c.icon} />
          ))}
        </CompareTableHead>
        {groups.map((g) => (
          <Fragment key={g.group}>
            <CompareTableGroup>{g.group}</CompareTableGroup>
            {g.rows.map((r) => (
              <CompareTableRow key={r.name}>
                <CompareTableName>{r.name}</CompareTableName>
                {r.v.map((v, i) => (
                  <CompareTableCell key={i} value={v} />
                ))}
              </CompareTableRow>
            ))}
          </Fragment>
        ))}
      </>
    ) : (
      children
    ),
  } as never);
}

/** The head row: an empty cell, then a `CompareTableColumn` per plan. */
export function CompareTableHead({ children, ...rest }: PartProps<"div">) {
  return part("div", "compare-table-head", "fg-cmp-row fg-cmp-head", {
    ...rest,
    role: "row",
    children: (
      <>
        <span role="columnheader" />
        {children}
      </>
    ),
  } as never);
}

/** The name of a plan, with its icon. */
export function CompareTableColumn({
  name,
  icon,
  children,
  ...rest
}: Omit<PartProps<"span">, "children"> & {
  name?: string;
  icon?: IconDefinition;
  children?: ReactNode;
}) {
  return part("span", "compare-table-column", "fg-cmp-cell text-eyebrow", {
    ...rest,
    role: "columnheader",
    children: (
      <>
        {icon ? <Icon icon={icon} size={12} /> : null}
        {name}
        {children}
      </>
    ),
  } as never);
}

/** The title of a group of rows. */
export function CompareTableGroup({ children, ...rest }: PartProps<"div">) {
  return part("div", "compare-table-group", "fg-cmp-group text-eyebrow", {
    ...rest,
    role: "row",
    children: <span role="rowheader">{children}</span>,
  } as never);
}

/** A row: its `CompareTableName`, then a `CompareTableCell` per plan. */
export function CompareTableRow(props: PartProps<"div">) {
  return part("div", "compare-table-row", "fg-cmp-row", props, { role: "row" });
}

/** The name of a row. */
export function CompareTableName(props: PartProps<"span">) {
  return part("span", "compare-table-name", "text-small", props, { role: "rowheader" });
}

/** A cell: a tick, a dash, or a word; or your own children. */
export function CompareTableCell({
  value,
  children,
  ...rest
}: Omit<PartProps<"span">, "children"> & { value?: CompareValue; children?: ReactNode }) {
  return part("span", "compare-table-cell", "fg-cmp-cell", {
    ...rest,
    role: "cell",
    children:
      children ??
      (value === true ? (
        <Icon icon={Tick01Icon} size={12} title="Included" />
      ) : value === false ? (
        <span className="fg-cmp-none" aria-label="Not included">
          —
        </span>
      ) : (
        <span className={cx("text-eyebrow", value === "Soon" && "fg-cmp-soon")}>{value}</span>
      )),
  } as never);
}
