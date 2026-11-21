// Plans side by side, and the plan.
//
// Roots with parts. `PlanCard` takes `name`, `icon`, `tag`, `where`, `price`, `groups` and `action`
// as shorthand, or the parts: `PlanCardArt`, `PlanCardHead` (`PlanCardTag`), `PlanCardWhere`,
// `PlanCardPrice`, `PlanCardGroup` (`PlanCardList`) and `PlanCardAction`.

import { Tick01Icon } from "@forgeron/icons";
import type { IconDefinition } from "@forgeron/icons";
import type { ReactNode } from "react";
import { Button, type ButtonProps } from "../button";
import { cx } from "../cx";
import { Icon } from "../icon";
import { PixelFigure } from "../pixel-figure";
import { part, type PartProps } from "../part";

export interface PlanGridProps extends PartProps<"div"> {
  children: ReactNode;
}

/** Plans side by side, glued, three a row (one under 900px). */
export function PlanGrid(props: PlanGridProps) {
  return part("div", "plan-grid", "fg-plans", props);
}

export interface PlanCardProps extends Omit<PartProps<"article">, "title"> {
  /** In the pixel face. */
  name?: string;
  icon?: IconDefinition;
  /** A word on the right of the name: in ember, or dashed when it is `Soon`. */
  tag?: string;
  /** Who runs it, where: one sentence. */
  where?: ReactNode;
  /** The price in the pixel face, `$14.99`; without it the card shows no price. */
  price?: string;
  /** Under the price, `per seat, per month`. */
  unit?: string;
  /** What it includes, in titled lists of ticks. */
  groups?: ReadonlyArray<{ title: string; items: ReadonlyArray<string> }>;
  /** The button at the foot. */
  action?: { href: string; label: string; primary?: boolean; marker?: boolean };
  /** The recommended plan: raised, its icon and price in ember. */
  featured?: boolean;
  /** The drawing on top, over a dotted field (a canvas fills it). With no `name`, the parts. */
  children?: ReactNode;
}

/** A plan: a drawing, its name and tag, where it runs, its price, what it includes, one action. */
export function PlanCard({
  name,
  icon,
  tag,
  where,
  price,
  unit,
  groups = [],
  action,
  featured = false,
  children,
  className,
  ...rest
}: PlanCardProps) {
  return part("article", "plan-card", cx("fg-plan fg-ticks", featured && "fg-plan-featured"), {
    ...rest,
    className,
    children:
      name !== undefined && icon && action ? (
        <>
          <PlanCardArt>{children}</PlanCardArt>
          <PlanCardHead>
            <Icon icon={icon} size={24} />
            <PixelFigure text={name} size="sm" tone="ink" />
            {tag ? <PlanCardTag soon={tag === "Soon"}>{tag}</PlanCardTag> : null}
          </PlanCardHead>
          <PlanCardWhere>{where}</PlanCardWhere>
          {price ? (
            <PlanCardPrice>
              <PixelFigure text={price} size="md" tone="ink" />
              <span className="text-eyebrow fg-plan-unit">{unit}</span>
            </PlanCardPrice>
          ) : null}
          {groups.map((g) => (
            <PlanCardGroup key={g.title}>
              <span className="text-eyebrow fg-plan-group-title">{g.title}</span>
              <PlanCardList>
                {g.items.map((it) => (
                  <li key={it} className="text-small">
                    <Icon icon={Tick01Icon} size={12} />
                    {it}
                  </li>
                ))}
              </PlanCardList>
            </PlanCardGroup>
          ))}
          <PlanCardAction
            href={action.href}
            variant={action.primary ? "primary" : "secondary"}
            marker={action.marker}
          >
            {action.label}
          </PlanCardAction>
        </>
      ) : (
        children
      ),
  } as never);
}

/** The drawing on top, over a dotted field. */
export function PlanCardArt(props: PartProps<"div">) {
  return part("div", "plan-card-art", "fg-plan-art fg-dots", props);
}

/** The icon, the name and the tag. */
export function PlanCardHead(props: PartProps<"div">) {
  return part("div", "plan-card-head", "fg-plan-head", props);
}

/** A word at the end of the head: in ember, or dashed with `soon`. */
export function PlanCardTag({ soon, className, ...rest }: PartProps<"span"> & { soon?: boolean }) {
  return part("span", "plan-card-tag", cx("fg-plan-tag text-bit", soon && "fg-plan-tag-soon"), {
    ...rest,
    className,
  } as never);
}

/** Who runs it, where. */
export function PlanCardWhere(props: PartProps<"p">) {
  return part("p", "plan-card-where", "text-small fg-plan-where", props);
}

/** The price and its unit. */
export function PlanCardPrice(props: PartProps<"div">) {
  return part("div", "plan-card-price", "fg-plan-price", props);
}

/** A titled list of what the plan includes. */
export function PlanCardGroup(props: PartProps<"div">) {
  return part("div", "plan-card-group", "fg-plan-group", props);
}

/** The ticked items of a group. */
export function PlanCardList(props: PartProps<"ul">) {
  return part("ul", "plan-card-list", "fg-plan-list", props);
}

/** The button at the foot. */
export function PlanCardAction({ className, ...rest }: ButtonProps) {
  return (
    <Button
      data-slot="plan-card-action"
      size="lg"
      {...({ ...rest, className: cx("fg-plan-btn", className) } as ButtonProps)}
    />
  );
}
