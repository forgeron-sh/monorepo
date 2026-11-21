// The properties of a record (an issue, a lead, a ticket), after the Tasks issue page: a column
// on the right with a label and a picker per row, or a row of chips under the title. The rows hold
// the pickers of pickers.tsx; this file only lays them out.
//
// `PropertyPanel` with `rows` draws them. Without `rows` it is the root of its parts:
//
//   <PropertyPanel label="Properties">
//     <PropertyPanelGroup>
//       <PropertyPanelHeading>Properties</PropertyPanelHeading>
//       <PropertyPanelList>
//         <PropertyPanelRow>
//           <PropertyPanelLabel>Status</PropertyPanelLabel>
//           <PropertyPanelValue><StatusPicker defaultValue="review" /></PropertyPanelValue>
//         </PropertyPanelRow>
//       </PropertyPanelList>
//     </PropertyPanelGroup>
//   </PropertyPanel>

import type { ComponentProps, ReactNode } from "react";
import { cx } from "../cx";
import { renderPart } from "../part";

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

export interface PropertyPanelProps extends Omit<ComponentProps<"aside">, "children"> {
  /** Rows in order; a heading starts a new group. */
  rows: ReadonlyArray<PropertyRow | PropertyHeading>;
  /** Names the panel for assistive technology. */
  label?: string;
  className?: string;
  children?: undefined;
}

/** `rows` stays undefined: with rows, `PropertyPanel` draws them itself. */
export interface PropertyPanelRootProps extends ComponentProps<"aside"> {
  rows?: undefined;
  /** Names the panel for assistive technology. */
  label?: string;
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
 * With `rows`: the right column of a record, one row per property, its label on the left and its
 * picker on the right, in groups under small headings; the pickers lose their frame until hovered.
 * Without: the root of the parts (`PropertyPanelGroup`, `PropertyPanelRow`…).
 */
export function PropertyPanel(props: PropertyPanelProps | PropertyPanelRootProps) {
  const { rows, label = "Properties", className, children, ...rest } = props;
  return (
    <aside
      data-slot="property-panel"
      aria-label={label}
      {...rest}
      className={cx("fg-props", className)}
    >
      {rows === undefined
        ? children
        : groupsOf(rows).map((group, i) => (
            <PropertyPanelGroup key={group.heading ?? i}>
              {group.heading ? <PropertyPanelHeading>{group.heading}</PropertyPanelHeading> : null}
              <PropertyPanelList>
                {group.rows.map((row) => (
                  <PropertyPanelRow key={row.id ?? row.label} wide={row.hideLabel === true}>
                    <PropertyPanelLabel srOnly={row.hideLabel === true}>
                      {row.label}
                    </PropertyPanelLabel>
                    <PropertyPanelValue>{row.control}</PropertyPanelValue>
                  </PropertyPanelRow>
                ))}
              </PropertyPanelList>
            </PropertyPanelGroup>
          ))}
    </aside>
  );
}

type AsChild = { asChild?: boolean };

/** A group of rows under one heading. */
export function PropertyPanelGroup({
  asChild,
  className,
  ...rest
}: ComponentProps<"section"> & AsChild) {
  return renderPart("section", cx("fg-props-group", className), asChild, {
    "data-slot": "property-panel-group",
    ...rest,
  });
}

/** The small heading that starts a group: "Properties", "Labels". */
export function PropertyPanelHeading({
  asChild,
  className,
  ...rest
}: ComponentProps<"h3"> & AsChild) {
  return renderPart("h3", cx("fg-props-heading", className), asChild, {
    "data-slot": "property-panel-heading",
    ...rest,
  });
}

/** The list of a group's rows: a `<dl>`. */
export function PropertyPanelList({ asChild, className, ...rest }: ComponentProps<"dl"> & AsChild) {
  return renderPart("dl", cx("fg-props-list", className), asChild, {
    "data-slot": "property-panel-list",
    ...rest,
  });
}

/** One property: a label and its value. `wide`: the value takes the whole row. */
export function PropertyPanelRow({
  asChild,
  wide,
  className,
  ...rest
}: ComponentProps<"div"> & AsChild & { wide?: boolean }) {
  return renderPart("div", cx("fg-props-row", wide && "fg-props-wide", className), asChild, {
    "data-slot": "property-panel-row",
    ...rest,
  });
}

/** The name of a property, in small mono capitals. `srOnly`: for assistive technology only. */
export function PropertyPanelLabel({
  asChild,
  srOnly,
  className,
  ...rest
}: ComponentProps<"dt"> & AsChild & { srOnly?: boolean }) {
  return renderPart("dt", cx(srOnly ? "fg-sr" : "fg-props-label", className), asChild, {
    "data-slot": "property-panel-label",
    ...rest,
  });
}

/** The value of a property: a picker, a `PropertyText`, a link. */
export function PropertyPanelValue({
  asChild,
  className,
  ...rest
}: ComponentProps<"dd"> & AsChild) {
  return renderPart("dd", cx("fg-props-value", className), asChild, {
    "data-slot": "property-panel-value",
    ...rest,
  });
}

export interface PropertyTextProps extends Omit<ComponentProps<"span">, "children"> {
  /** A mark before the text: an avatar, a glyph, an icon. */
  glyph?: ReactNode;
  children: ReactNode;
  /** Greys the text: what cannot be changed, or nothing set yet. */
  dim?: boolean;
  className?: string;
}

/** A value that is read, not picked ("Hugo Bernard · 3 Nov"), aligned with the pickers. */
export function PropertyText({ glyph, children, dim, className, ...rest }: PropertyTextProps) {
  return (
    <span
      data-slot="property-text"
      {...rest}
      className={cx("fg-props-text", dim && "fg-props-dim", className)}
    >
      {glyph}
      <span className="fg-props-text-label">{children}</span>
    </span>
  );
}

export interface PropertyChipsProps extends Omit<ComponentProps<"div">, "children"> {
  /** The pickers, each in its `chip` variant. */
  children: ReactNode;
  /** Names the group for assistive technology. */
  label?: string;
  className?: string;
}

/** The properties as one row of chips: under the title of a record, at the foot of a form. */
export function PropertyChips({
  children,
  label = "Properties",
  className,
  ...rest
}: PropertyChipsProps) {
  return (
    <div
      role="group"
      data-slot="property-chips"
      aria-label={label}
      {...rest}
      className={cx("fg-props-chips", className)}
    >
      {children}
    </div>
  );
}
