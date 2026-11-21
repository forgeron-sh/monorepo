// The closing call of a landing page.
//
// A root with parts. `CtaBand` takes `title`, `lead`, `action`, `command` as shorthand, or the
// parts: `CtaBandInner` (`CtaBandCopy`, `CtaBandActions` with `CtaBandCell`s) and `CtaBandArt`.

import type { ReactNode } from "react";
import { Button } from "../button";
import { CommandLine } from "../command-line";
import { titleLines } from "../section-head";
import type { TitleLines } from "../section-head";
import { Title } from "../title";
import { part, type PartProps } from "../part";

export interface CtaBandProps extends Omit<PartProps<"section">, "title" | "children"> {
  /** The anchor the page's "Get started" links lead to. */
  id?: string;
  /** In the hero size of the pixel face, one string per line. */
  title?: TitleLines;
  lead?: ReactNode;
  /** The primary action, in ember with its marker. */
  action?: { href: string; label: string };
  /** The command, framed, in the second cell. */
  command?: string;
  /** Above the command: "Or in your terminal". */
  commandLabel?: string;
  /** The drawing on the right (on top under 1100px), over corner brackets: canvases fill it. With
   * no `title`, these are the parts of the band. */
  children?: ReactNode;
}

/**
 * The closing call of a landing page: the title and lead fill the left column, the two ways to
 * start sit in glued cells at its foot, a drawing takes the right.
 */
export function CtaBand({
  title,
  lead,
  action,
  command,
  commandLabel = "Or in your terminal",
  children,
  ...rest
}: CtaBandProps) {
  return part("section", "cta-band", "fg-rail fg-cta", {
    ...rest,
    children:
      title !== undefined && action ? (
        <>
          <CtaBandInner>
            <CtaBandCopy>
              <Title as="h2" size="hero">
                {titleLines(title)}
              </Title>
              {lead ? <p className="fg-sec-lead">{lead}</p> : null}
            </CtaBandCopy>
            <CtaBandActions>
              <CtaBandCell>
                <Button href={action.href} size="lg" variant="primary" marker>
                  {action.label}
                </Button>
              </CtaBandCell>
              {command ? (
                <CtaBandCell>
                  <span className="text-eyebrow fg-cta-label">{commandLabel}</span>
                  <CommandLine>{command}</CommandLine>
                </CtaBandCell>
              ) : null}
            </CtaBandActions>
          </CtaBandInner>
          <CtaBandArt>{children}</CtaBandArt>
        </>
      ) : (
        children
      ),
  } as never);
}

/** The left column's frame: the copy and the actions. */
export function CtaBandInner(props: PartProps<"div">) {
  return part("div", "cta-band-inner", "fg-cta-inner", props);
}

/** The title and the lead. */
export function CtaBandCopy(props: PartProps<"div">) {
  return part("div", "cta-band-copy", "fg-cta-copy", props);
}

/** The two ways to start, in glued cells. */
export function CtaBandActions(props: PartProps<"div">) {
  return part("div", "cta-band-actions", "fg-cta-actions", props);
}

/** One way to start: the button, or the command with its label. */
export function CtaBandCell(props: PartProps<"div">) {
  return part("div", "cta-band-cell", "fg-cta-cell", props);
}

/** The drawing on the right, over corner brackets. */
export function CtaBandArt(props: PartProps<"div">) {
  return part("div", "cta-band-art", "fg-cta-art fg-ticks", props);
}
