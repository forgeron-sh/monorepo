import type { IconDefinition } from "@forgeron/icons";
import type { ReactNode } from "react";
import { Button } from "../button";
import { CommandLine } from "../command-line";
import { cx } from "../cx";
import { Icon } from "../icon";
import { titleLines } from "../section-head";
import type { TitleLines } from "../section-head";
import { Title } from "../title";

export interface HeroProof {
  icon: IconDefinition;
  text: string;
}

export interface HeroProps {
  /** Above the title: a `MarkBadge`, for instance. */
  badge?: ReactNode;
  /** The hero title in the pixel face, one string per line. */
  title: TitleLines;
  /** What the product is built on, as icons and names after `proofLabel`. */
  proof?: ReadonlyArray<HeroProof>;
  /** "Built on" by default. */
  proofLabel?: string;
  /** The promise, on the right, in the lead size. */
  lead: ReactNode;
  /**
   * The command to start with, shown before the action in the same frame: a string (drawn as an
   * unframed `CommandLine`), or your own element.
   */
  command?: ReactNode;
  /** The primary action, in ember with its marker. */
  action: { href: string; label: string };
  className?: string;
}

/**
 * The top of a landing page: badge, title and proof on the left; the lead and the way in (a
 * command and the primary action, framed together) on the right, aligned on the bottom.
 */
export function Hero({
  badge,
  title,
  proof = [],
  proofLabel = "Built on",
  lead,
  command,
  action,
  className,
}: HeroProps) {
  return (
    <div className={cx("fg-hero", className)}>
      <div className="fg-hero-left">
        {badge}
        <Title as="h1" size="hero">
          {titleLines(title)}
        </Title>
        {proof.length > 0 ? (
          <div className="fg-hero-proof">
            <span className="text-eyebrow fg-hero-proof-label">{proofLabel}</span>
            {proof.map((p) => (
              <span key={p.text} className="fg-hero-chip text-eyebrow">
                <Icon icon={p.icon} size={24} />
                {p.text}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="fg-hero-right">
        <p className="text-lead fg-hero-lead">{lead}</p>
        <div className="fg-hero-cta">
          {typeof command === "string" ? (
            <CommandLine framed={false}>{command}</CommandLine>
          ) : (
            command
          )}
          <Button href={action.href} size="lg" variant="primary" marker>
            {action.label}
          </Button>
        </div>
      </div>
    </div>
  );
}

export interface LogoStripProps {
  /** The lead cell's words, "Forging at". */
  label: string;
  /** The names, in the pixel face. Real names only: empty slots render as hatched cells. */
  names: ReadonlyArray<string>;
  /** How many cells after the lead, filled or hatched. */
  slots: number;
  className?: string;
}

/** A band of customer names in glued cells, the empty ones hatched until they are filled. */
export function LogoStrip({ label, names, slots, className }: LogoStripProps) {
  return (
    <ul className={cx("fg-bento fg-logos", className)}>
      <li className="fg-cell fg-ticks fg-logos-lead">
        <span className="text-eyebrow fg-logos-label">{label}</span>
      </li>
      {Array.from({ length: slots }, (_, i) => names[i]).map((name, i) =>
        name ? (
          <li key={name} className="fg-cell fg-ticks fg-logos-name">
            <span className="fg-logos-text">{name}</span>
          </li>
        ) : (
          <li key={`empty-${i}`} className="fg-cell fg-logos-empty" aria-hidden="true" />
        ),
      )}
    </ul>
  );
}
