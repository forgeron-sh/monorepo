import { Tick01Icon } from "@forgeron/icons";
import type { IconDefinition } from "@forgeron/icons";
import { Fragment } from "react";
import { cx } from "../cx";
import { Icon } from "../icon";

/** A cell: included (`true`), not included (`false`), or a word (`Soon` is dashed). */
export type CompareValue = boolean | string;

export interface CompareTableProps {
  /** Names the table for assistive technology. */
  label: string;
  /** One column per plan, after the row names. */
  columns: ReadonlyArray<{ name: string; icon: IconDefinition }>;
  /** Rows in titled groups; each row has one value per column. */
  groups: ReadonlyArray<{
    group: string;
    rows: ReadonlyArray<{ name: string; v: ReadonlyArray<CompareValue> }>;
  }>;
  className?: string;
}

/**
 * Plans compared, a column per plan: ticks, dashes and words, rows in groups. The head sticks
 * under the navigation (`--fg-cmp-top`, 60px).
 */
export function CompareTable({ label, columns, groups, className }: CompareTableProps) {
  return (
    <div className={cx("fg-cmp", className)} role="table" aria-label={label}>
      <div className="fg-cmp-row fg-cmp-head" role="row">
        <span role="columnheader" />
        {columns.map((c) => (
          <span key={c.name} role="columnheader" className="fg-cmp-cell text-eyebrow">
            <Icon icon={c.icon} size={12} />
            {c.name}
          </span>
        ))}
      </div>
      {groups.map((g) => (
        <Fragment key={g.group}>
          <div className="fg-cmp-group text-eyebrow" role="row">
            <span role="rowheader">{g.group}</span>
          </div>
          {g.rows.map((r) => (
            <div key={r.name} className="fg-cmp-row" role="row">
              <span role="rowheader" className="text-small">
                {r.name}
              </span>
              {r.v.map((v, i) => (
                <span key={i} role="cell" className="fg-cmp-cell">
                  {v === true ? (
                    <Icon icon={Tick01Icon} size={12} title="Included" />
                  ) : v === false ? (
                    <span className="fg-cmp-none" aria-label="Not included">
                      —
                    </span>
                  ) : (
                    <span className={cx("text-eyebrow", v === "Soon" && "fg-cmp-soon")}>{v}</span>
                  )}
                </span>
              ))}
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  );
}
