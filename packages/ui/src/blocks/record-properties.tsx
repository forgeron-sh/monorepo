// The properties of a record (an issue, a lead, a ticket), after the Tasks issue page: a column
// on the right with a label and a picker per row, or a row of chips under the title. The rows hold
// the pickers of pickers.tsx; this file only lays them out.

import type { ReactNode } from "react";
import { cx } from "../cx";

export interface PropertyRow {
  /** Written on the left, in small mono capitals: "Status", "Assignee". */
  label: string;
  /** The value: a picker in its `chip` variant, a `PropertyText`, a link. */
  control: ReactNode;
  /** A stable key; the label by default. */
  id?: string;
  /** Keeps the label for assistive technology only; the control takes the whole row, under a
   * heading that already says it ("Labels", "Project"). */
  hideLabel?: boolean;
}

export interface PropertyHeading {
  /** Starts a group: "Properties", "Labels", "Project". */
  heading: string;
}

export interface PropertyPanelProps {
  /** Rows in order; a heading starts a new group. */
  rows: ReadonlyArray<PropertyRow | PropertyHeading>;
  /** Names the panel for assistive technology. */
  label?: string;
  className?: string;
}

interface Group {
  heading: string | undefined;
  rows: PropertyRow[];
}

const isHeading = (row: PropertyRow | PropertyHeading): row is PropertyHeading => "heading" in row;

const groupsOf = (rows: ReadonlyArray<PropertyRow | PropertyHeading>): Group[] => {
  const groups: Group[] = [];
  for (const row of rows) {
    if (isHeading(row)) groups.push({ heading: row.heading, rows: [] });
    else if (groups.length === 0) groups.push({ heading: undefined, rows: [row] });
    else groups[groups.length - 1]!.rows.push(row);
  }
  return groups;
};

/**
 * The right column of a record: one row per property, its label on the left and its picker on the
 * right, in groups under small headings. The pickers lose their frame until hovered.
 */
export function PropertyPanel({ rows, label = "Properties", className }: PropertyPanelProps) {
  return (
    <aside aria-label={label} className={cx("fg-props", className)}>
      {groupsOf(rows).map((group, i) => (
        <section key={group.heading ?? i} className="fg-props-group">
          {group.heading ? <h3 className="fg-props-heading">{group.heading}</h3> : null}
          <dl className="fg-props-list">
            {group.rows.map((row) => (
              <div
                key={row.id ?? row.label}
                className={cx("fg-props-row", row.hideLabel && "fg-props-wide")}
              >
                <dt className={row.hideLabel ? "fg-sr" : "fg-props-label"}>{row.label}</dt>
                <dd className="fg-props-value">{row.control}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </aside>
  );
}

export interface PropertyTextProps {
  /** A mark before the text: an avatar, a glyph, an icon. */
  glyph?: ReactNode;
  children: ReactNode;
  /** Greys the text: what cannot be changed, or nothing set yet. */
  dim?: boolean;
  className?: string;
}

/** A value that is read, not picked ("Hugo Bernard · 3 Nov"), aligned with the pickers. */
export function PropertyText({ glyph, children, dim, className }: PropertyTextProps) {
  return (
    <span className={cx("fg-props-text", dim && "fg-props-dim", className)}>
      {glyph}
      <span className="fg-props-text-label">{children}</span>
    </span>
  );
}

export interface PropertyChipsProps {
  /** The pickers, each in its `chip` variant. */
  children: ReactNode;
  /** Names the group for assistive technology. */
  label?: string;
  className?: string;
}

/** The properties as one row of chips: under the title of a record, at the foot of a form. */
export function PropertyChips({ children, label = "Properties", className }: PropertyChipsProps) {
  return (
    <div role="group" aria-label={label} className={cx("fg-props-chips", className)}>
      {children}
    </div>
  );
}
