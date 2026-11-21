// The bar above a calendar, a time grid or a timeline: Today, the arrows, the title of the period
// and a switch of views. Presentational: the parts only draw, the block owns the date. shadcn's
// composition: every part takes `className` and `...rest`, and `asChild` where it is one element.
//
//   <PeriodNav>
//     <PeriodNavGroup>
//       <PeriodNavToday onClick={today} />
//       <PeriodNavPrevious label="Previous week" onClick={back} />
//       <PeriodNavNext label="Next week" onClick={forward} />
//       <PeriodNavTitle>Nov 16 – 22, 2026</PeriodNavTitle>
//       <PeriodNavBadge>W47</PeriodNavBadge>
//     </PeriodNavGroup>
//     <Segmented label="View" options={…} value={view} onChange={setView} />
//   </PeriodNav>

import { ArrowLeft01Icon, ArrowRight01Icon } from "@forgeron/icons";
import type { ComponentProps } from "react";
import { renderPart, type Part } from "./part";
import { Button } from "./button";
import { cx } from "./cx";
import { IconButton } from "./identity";

type Parted<T> = Part<T> & { asChild?: boolean };

/** The bar: the group on the left, the switch of views on the right. */
export function PeriodNav({ className, asChild, ...rest }: Parted<ComponentProps<"div">>) {
  return renderPart("div", cx("fg-pn", className), asChild, {
    "data-slot": "period-nav",
    ...rest,
  });
}

/** Today, the arrows and the title, side by side. */
export function PeriodNavGroup({ className, asChild, ...rest }: Parted<ComponentProps<"div">>) {
  return renderPart("div", cx("fg-pn-group", className), asChild, {
    "data-slot": "period-nav-group",
    ...rest,
  });
}

/** The "Today" button. */
export function PeriodNavToday({
  className,
  children = "Today",
  ...rest
}: Part<ComponentProps<"button">>) {
  return (
    <Button
      data-slot="period-nav-today"
      variant="secondary"
      size="sm"
      {...rest}
      className={className}
    >
      {children}
    </Button>
  );
}

export interface PeriodNavStepProps extends Omit<
  ComponentProps<"button">,
  "className" | "children" | "aria-label"
> {
  /** Names the arrow for assistive technology: "Previous week". */
  label?: string;
  className?: string;
}

/** The arrow to the period before. */
export function PeriodNavPrevious({ label = "Previous", className, ...rest }: PeriodNavStepProps) {
  return (
    <IconButton
      data-slot="period-nav-previous"
      icon={ArrowLeft01Icon}
      size="sm"
      {...rest}
      label={label}
      {...(className ? { className } : {})}
    />
  );
}

/** The arrow to the period after. */
export function PeriodNavNext({ label = "Next", className, ...rest }: PeriodNavStepProps) {
  return (
    <IconButton
      data-slot="period-nav-next"
      icon={ArrowRight01Icon}
      size="sm"
      {...rest}
      label={label}
      {...(className ? { className } : {})}
    />
  );
}

/** The name of the period, announced politely when it changes. */
export function PeriodNavTitle({ className, asChild, ...rest }: Parted<ComponentProps<"span">>) {
  return renderPart("span", cx("fg-pn-title", className), asChild, {
    "data-slot": "period-nav-title",
    "aria-live": "polite",
    ...rest,
  });
}

/** A small mono mark after the title: the number of the week. */
export function PeriodNavBadge({ className, asChild, ...rest }: Parted<ComponentProps<"span">>) {
  return renderPart("span", cx("fg-pn-badge", className), asChild, {
    "data-slot": "period-nav-badge",
    ...rest,
  });
}
