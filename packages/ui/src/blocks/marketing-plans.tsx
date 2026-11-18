import { Tick01Icon } from "@forgeron/icons";
import type { IconDefinition } from "@forgeron/icons";
import type { ReactNode } from "react";
import { Button } from "../button";
import { cx } from "../cx";
import { Icon } from "../icon";
import { PixelFigure } from "../pixel-figure";

export interface PlanGridProps {
  className?: string;
  children: ReactNode;
}

/** Plans side by side, glued, three a row (one under 900px). */
export function PlanGrid({ className, children }: PlanGridProps) {
  return <div className={cx("fg-plans", className)}>{children}</div>;
}

export interface PlanCardProps {
  /** In the pixel face. */
  name: string;
  icon: IconDefinition;
  /** A word on the right of the name: in ember, or dashed when it is `Soon`. */
  tag?: string;
  /** Who runs it, where: one sentence. */
  where: ReactNode;
  /** The price in the pixel face, `$14.99`; without it the card shows no price. */
  price?: string;
  /** Under the price, `per seat, per month`. */
  unit?: string;
  /** What it includes, in titled lists of ticks. */
  groups: ReadonlyArray<{ title: string; items: ReadonlyArray<string> }>;
  /** The button at the foot. */
  action: { href: string; label: string; primary?: boolean; marker?: boolean };
  /** The recommended plan: raised, its icon and price in ember. */
  featured?: boolean;
  className?: string;
  /** The drawing on top, over a dotted field (a canvas fills it). */
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
  groups,
  action,
  featured = false,
  className,
  children,
}: PlanCardProps) {
  return (
    <article className={cx("fg-plan fg-ticks", featured && "fg-plan-featured", className)}>
      <div className="fg-plan-art fg-dots">{children}</div>
      <div className="fg-plan-head">
        <Icon icon={icon} size={24} />
        <PixelFigure text={name} size="sm" tone="ink" />
        {tag ? (
          <span className={cx("fg-plan-tag text-bit", tag === "Soon" && "fg-plan-tag-soon")}>
            {tag}
          </span>
        ) : null}
      </div>
      <p className="text-small fg-plan-where">{where}</p>
      {price ? (
        <div className="fg-plan-price">
          <PixelFigure text={price} size="md" tone="ink" />
          <span className="text-eyebrow fg-plan-unit">{unit}</span>
        </div>
      ) : null}
      {groups.map((g) => (
        <div key={g.title} className="fg-plan-group">
          <span className="text-eyebrow fg-plan-group-title">{g.title}</span>
          <ul className="fg-plan-list">
            {g.items.map((it) => (
              <li key={it} className="text-small">
                <Icon icon={Tick01Icon} size={12} />
                {it}
              </li>
            ))}
          </ul>
        </div>
      ))}
      <Button
        href={action.href}
        size="lg"
        variant={action.primary ? "primary" : "secondary"}
        marker={action.marker}
        className="fg-plan-btn"
      >
        {action.label}
      </Button>
    </article>
  );
}
