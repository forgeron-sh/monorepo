import type { IconDefinition } from "@forgeron/icons";
import { Fragment } from "react";
import { cx } from "../cx";
import { Icon } from "../icon";
import { Logo } from "../logo";
import { PixelText } from "../pixel-text";
import { SectionBand } from "../section-head";

export interface SiteFooterColumn {
  title: string;
  links: ReadonlyArray<{ href: string; label: string; icon?: IconDefinition }>;
}

export interface SiteFooterProps {
  /** The coordinate of the page's last section, `/0.9`: the band above reads `/0.9 → /1.0`. */
  from: string;
  /** The site's index, a column per topic, after the logo's cell. */
  columns: ReadonlyArray<SiteFooterColumn>;
  /** The wordmark across the foot, in the pixel face; `forgeron` by default. */
  wordmark?: string;
  /** Short facts in the hatched strip at the very bottom. */
  legal: ReadonlyArray<string>;
  className?: string;
}

/**
 * The foot of a marketing page: the band, the site's index in glued cells, the wordmark across,
 * then the legal strip. The hearth (`data-hearth`, its canvas and the `data-hearth-word` slot) is
 * left to a script: without it the wordmark is the static pixel drawing in cold iron.
 */
export function SiteFooter({
  from,
  columns,
  wordmark = "forgeron",
  legal,
  className,
}: SiteFooterProps) {
  const next = `/${(Number(from.slice(1)) + 0.1).toFixed(1)}`;
  return (
    <footer className={cx("fg-rail fg-foot", className)}>
      <SectionBand from={from} to={next} label="Index" />
      <div className="fg-foot-hearth" data-hearth="">
        <canvas aria-hidden="true" />
        <nav className="fg-foot-cells" aria-label="Site index">
          <div className="fg-foot-cell fg-ticks fg-foot-brand">
            <Logo size={28} />
          </div>
          {columns.map((c) => (
            <div key={c.title} className="fg-foot-cell fg-ticks">
              <span className="text-eyebrow fg-foot-title">{c.title}</span>
              {c.links.map((l) => (
                <Fragment key={`${l.label}-${l.href}`}>
                  {l.icon ? (
                    <a href={l.href} className="fg-foot-icon-link">
                      <Icon icon={l.icon} size={16} variant="mono" />
                      {l.label}
                    </a>
                  ) : (
                    <a href={l.href}>{l.label}</a>
                  )}
                </Fragment>
              ))}
            </div>
          ))}
        </nav>
        <div className="fg-foot-word" data-hearth-word="">
          <PixelText text={wordmark} />
        </div>
      </div>
      <div className="fg-foot-legal text-eyebrow">
        {legal.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </footer>
  );
}
