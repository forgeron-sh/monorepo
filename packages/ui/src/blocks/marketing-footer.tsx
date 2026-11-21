// The foot of a marketing page.
//
// A root with parts. `SiteFooter` takes `from`, `columns`, `wordmark` and `legal` as shorthand, or
// the parts: `SiteFooterHearth` (`SiteFooterIndex` of `SiteFooterBrand` and `SiteFooterCell`s,
// `SiteFooterWord`) and `SiteFooterLegal`.

import type { IconDefinition } from "@forgeron/icons";
import type { ReactNode } from "react";
import { Fragment } from "react";
import { Icon } from "../icon";
import { Logo } from "../logo";
import { PixelText } from "../pixel-text";
import { SectionBand } from "../section-head";
import { part, type PartProps } from "../part";

export interface SiteFooterColumn {
  title: string;
  links: ReadonlyArray<{ href: string; label: string; icon?: IconDefinition }>;
}

export interface SiteFooterProps extends Omit<PartProps<"footer">, "children"> {
  /** The coordinate of the page's last section, `/0.9`: the band above reads `/0.9 → /1.0`. */
  from?: string;
  /** The site's index, a column per topic, after the logo's cell. */
  columns?: ReadonlyArray<SiteFooterColumn>;
  /** The wordmark across the foot, in the pixel face; `forgeron` by default. */
  wordmark?: string;
  /** Short facts in the hatched strip at the very bottom. */
  legal?: ReadonlyArray<string>;
  /** The parts, when there are no `columns`. */
  children?: ReactNode;
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
  legal = [],
  children,
  ...rest
}: SiteFooterProps) {
  return part("footer", "site-footer", "fg-rail fg-foot", {
    ...rest,
    children:
      columns && from !== undefined ? (
        <>
          <SectionBand
            from={from}
            to={`/${(Number(from.slice(1)) + 0.1).toFixed(1)}`}
            label="Index"
          />
          <SiteFooterHearth>
            <SiteFooterIndex>
              <SiteFooterBrand>
                <Logo size={28} />
              </SiteFooterBrand>
              {columns.map((c) => (
                <SiteFooterCell key={c.title} title={c.title}>
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
                </SiteFooterCell>
              ))}
            </SiteFooterIndex>
            <SiteFooterWord>
              <PixelText text={wordmark} />
            </SiteFooterWord>
          </SiteFooterHearth>
          <SiteFooterLegal>
            {legal.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </SiteFooterLegal>
        </>
      ) : (
        children
      ),
  } as never);
}

/** The frame the script draws the hearth in: the index, then the wordmark. */
export function SiteFooterHearth({ children, ...rest }: PartProps<"div">) {
  return part("div", "site-footer-hearth", "fg-foot-hearth", {
    ...rest,
    "data-hearth": "",
    children: (
      <>
        <canvas aria-hidden="true" />
        {children}
      </>
    ),
  } as never);
}

/** The site's index, as a navigation of glued cells. */
export function SiteFooterIndex(props: PartProps<"nav">) {
  return part("nav", "site-footer-index", "fg-foot-cells", props, { "aria-label": "Site index" });
}

/** The cell of the logo. */
export function SiteFooterBrand(props: PartProps<"div">) {
  return part("div", "site-footer-brand", "fg-foot-cell fg-ticks fg-foot-brand", props);
}

/** A column of the index: its title, then its links. */
export function SiteFooterCell({
  title,
  children,
  ...rest
}: Omit<PartProps<"div">, "title"> & { title?: ReactNode }) {
  return part("div", "site-footer-cell", "fg-foot-cell fg-ticks", {
    ...rest,
    children: (
      <>
        {title ? <span className="text-eyebrow fg-foot-title">{title}</span> : null}
        {children}
      </>
    ),
  } as never);
}

/** The wordmark across the foot, a slot for the script. */
export function SiteFooterWord(props: PartProps<"div">) {
  return part("div", "site-footer-word", "fg-foot-word", props, { "data-hearth-word": "" });
}

/** The hatched strip at the very bottom: short facts. */
export function SiteFooterLegal(props: PartProps<"div">) {
  return part("div", "site-footer-legal", "fg-foot-legal text-eyebrow", props);
}
