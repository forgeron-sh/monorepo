import type { ReactNode } from "react";
import { Button } from "../button";
import { CommandLine } from "../command-line";
import { cx } from "../cx";
import { titleLines } from "../section-head";
import type { TitleLines } from "../section-head";
import { Title } from "../title";

export interface CtaBandProps {
  /** The anchor the page's "Get started" links lead to. */
  id?: string;
  /** In the hero size of the pixel face, one string per line. */
  title: TitleLines;
  lead?: ReactNode;
  /** The primary action, in ember with its marker. */
  action: { href: string; label: string };
  /** The command, framed, in the second cell. */
  command?: string;
  /** Above the command: "Or in your terminal". */
  commandLabel?: string;
  className?: string;
  /** The drawing on the right (on top under 1100px), over corner brackets: canvases fill it. */
  children?: ReactNode;
}

/**
 * The closing call of a landing page: the title and lead fill the left column, the two ways to
 * start sit in glued cells at its foot, a drawing takes the right.
 */
export function CtaBand({
  id,
  title,
  lead,
  action,
  command,
  commandLabel = "Or in your terminal",
  className,
  children,
}: CtaBandProps) {
  return (
    <section id={id} className={cx("fg-rail fg-cta", className)}>
      <div className="fg-cta-inner">
        <div className="fg-cta-copy">
          <Title as="h2" size="hero">
            {titleLines(title)}
          </Title>
          {lead ? <p className="fg-sec-lead">{lead}</p> : null}
        </div>
        <div className="fg-cta-actions">
          <div className="fg-cta-cell">
            <Button href={action.href} size="lg" variant="primary" marker>
              {action.label}
            </Button>
          </div>
          {command ? (
            <div className="fg-cta-cell">
              <span className="text-eyebrow fg-cta-label">{commandLabel}</span>
              <CommandLine>{command}</CommandLine>
            </div>
          ) : null}
        </div>
      </div>
      <div className="fg-cta-art fg-ticks">{children}</div>
    </section>
  );
}
