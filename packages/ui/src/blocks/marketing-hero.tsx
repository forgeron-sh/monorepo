// The top of a landing page, and the strip of customer names.
//
// Roots with parts. `Hero` takes `badge`, `title`, `proof`, `lead`, `command`, `action` as
// shorthand, or the parts: `HeroLeft` (`HeroProofRow`, `HeroChip`) and `HeroRight` (`HeroLead`,
// `HeroCta`). `LogoStrip` takes `names` and `slots`, or `LogoStripLead` and `LogoStripName`s.

import type { IconDefinition } from "@forgeron/icons";
import type { ReactNode } from "react";
import { Button } from "../button";
import { CommandLine } from "../command-line";
import { Icon } from "../icon";
import { titleLines } from "../section-head";
import type { TitleLines } from "../section-head";
import { Title } from "../title";
import { part, type PartProps } from "../part";

export interface HeroProof {
  icon: IconDefinition;
  text: string;
}

export interface HeroProps extends Omit<PartProps<"div">, "title" | "children"> {
  /** Above the title: a `MarkBadge`, for instance. */
  badge?: ReactNode;
  /** The hero title in the pixel face, one string per line. */
  title?: TitleLines;
  /** What the product is built on, as icons and names after `proofLabel`. */
  proof?: ReadonlyArray<HeroProof>;
  /** "Built on" by default. */
  proofLabel?: string;
  /** The promise, on the right, in the lead size. */
  lead?: ReactNode;
  /**
   * The command to start with, shown before the action in the same frame: a string (drawn as an
   * unframed `CommandLine`), or your own element.
   */
  command?: ReactNode;
  /** The primary action, in ember with its marker. */
  action?: { href: string; label: string };
  /** The parts, when there is no `title`. */
  children?: ReactNode;
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
  children,
  ...rest
}: HeroProps) {
  return part("div", "hero", "fg-hero", {
    ...rest,
    children:
      title !== undefined && action ? (
        <>
          <HeroLeft>
            {badge}
            <Title as="h1" size="hero">
              {titleLines(title)}
            </Title>
            {proof.length > 0 ? (
              <HeroProofRow>
                <span className="text-eyebrow fg-hero-proof-label">{proofLabel}</span>
                {proof.map((p) => (
                  <HeroChip key={p.text}>
                    <Icon icon={p.icon} size={24} />
                    {p.text}
                  </HeroChip>
                ))}
              </HeroProofRow>
            ) : null}
          </HeroLeft>
          <HeroRight>
            <HeroLead>{lead}</HeroLead>
            <HeroCta>
              {typeof command === "string" ? (
                <CommandLine framed={false}>{command}</CommandLine>
              ) : (
                command
              )}
              <Button href={action.href} size="lg" variant="primary" marker>
                {action.label}
              </Button>
            </HeroCta>
          </HeroRight>
        </>
      ) : (
        children
      ),
  } as never);
}

/** The left column: badge, title and proof. */
export function HeroLeft(props: PartProps<"div">) {
  return part("div", "hero-left", "fg-hero-left", props);
}

/** The "Built on" row. */
export function HeroProofRow(props: PartProps<"div">) {
  return part("div", "hero-proof", "fg-hero-proof", props);
}

/** One name of the proof, with its icon. */
export function HeroChip(props: PartProps<"span">) {
  return part("span", "hero-chip", "fg-hero-chip text-eyebrow", props);
}

/** The right column: the lead and the way in. */
export function HeroRight(props: PartProps<"div">) {
  return part("div", "hero-right", "fg-hero-right", props);
}

/** The promise, in the lead size. */
export function HeroLead(props: PartProps<"p">) {
  return part("p", "hero-lead", "text-lead fg-hero-lead", props);
}

/** The command and the primary action, framed together. */
export function HeroCta(props: PartProps<"div">) {
  return part("div", "hero-cta", "fg-hero-cta", props);
}

export interface LogoStripProps extends Omit<PartProps<"ul">, "children"> {
  /** The lead cell's words, "Forging at". */
  label?: string;
  /** The names, in the pixel face. Real names only: empty slots render as hatched cells. */
  names?: ReadonlyArray<string>;
  /** How many cells after the lead, filled or hatched. */
  slots?: number;
  /** The parts, when there is no `label`. */
  children?: ReactNode;
}

/** A band of customer names in glued cells, the empty ones hatched until they are filled. */
export function LogoStrip({ label, names = [], slots = 0, children, ...rest }: LogoStripProps) {
  return part("ul", "logo-strip", "fg-bento fg-logos", {
    ...rest,
    children:
      label !== undefined ? (
        <>
          <LogoStripLead>{label}</LogoStripLead>
          {Array.from({ length: slots }, (_, i) => names[i]).map((name, i) =>
            name ? (
              <LogoStripName key={name}>{name}</LogoStripName>
            ) : (
              <LogoStripEmpty key={`empty-${i}`} />
            ),
          )}
        </>
      ) : (
        children
      ),
  } as never);
}

/** The lead cell: its words. */
export function LogoStripLead({ children, ...rest }: PartProps<"li">) {
  return part("li", "logo-strip-lead", "fg-cell fg-ticks fg-logos-lead", {
    ...rest,
    children: <span className="text-eyebrow fg-logos-label">{children}</span>,
  } as never);
}

/** A customer's name, in the pixel face. */
export function LogoStripName({ children, ...rest }: PartProps<"li">) {
  return part("li", "logo-strip-name", "fg-cell fg-ticks fg-logos-name", {
    ...rest,
    children: <span className="fg-logos-text">{children}</span>,
  } as never);
}

/** A hatched cell, until a name fills it. */
export function LogoStripEmpty(props: PartProps<"li">) {
  return part("li", "logo-strip-empty", "fg-cell fg-logos-empty", props, { "aria-hidden": "true" });
}
