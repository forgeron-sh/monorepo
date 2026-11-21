// The bar at the top of a marketing page.
//
// A root with parts. `SiteNav` takes `links`, `start` and `github` as shorthand, or the parts:
// `SiteNavBar` (`SiteNavHome`, `SiteNavLinks`, `SiteNavActions`).

import { GithubIcon } from "@forgeron/icons";
import type { ReactNode } from "react";
import { Button } from "../button";
import { Icon } from "../icon";
import { Logo } from "../logo";
import { part, type PartProps } from "../part";

export interface SiteNavLink {
  href: string;
  label: string;
}

export interface SiteNavProps extends Omit<PartProps<"nav">, "children"> {
  /** The page's sections, or other pages, in the order they are read. */
  links?: ReadonlyArray<SiteNavLink>;
  /** Where the primary action leads. */
  start?: string;
  /** The primary action's label; "Get started" by default. */
  startLabel?: string;
  /** The public repository, behind the GitHub button. */
  github?: string;
  /** The link marked as the current page (`aria-current`), if any. */
  current?: string;
  /** The parts, when there are no `links`. */
  children?: ReactNode;
}

/**
 * The bar at the top of a marketing page: the logo home, the section links (hidden under 860px),
 * GitHub (hidden under 480px) and the primary action. Sticky under a light blur.
 */
export function SiteNav({
  links,
  start,
  startLabel = "Get started",
  github,
  current,
  children,
  ...rest
}: SiteNavProps) {
  return part(
    "nav",
    "site-nav",
    "fg-snav",
    {
      ...rest,
      children:
        links && start !== undefined && github !== undefined ? (
          <SiteNavBar>
            <SiteNavHome />
            <SiteNavLinks>
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  aria-current={l.href === current ? "page" : undefined}
                >
                  {l.label}
                </a>
              ))}
            </SiteNavLinks>
            <SiteNavActions>
              <Button href={github} size="sm">
                <Icon icon={GithubIcon} size={16} variant="mono" />
                GitHub
              </Button>
              <Button href={start} size="sm" variant="primary" marker>
                {startLabel}
              </Button>
            </SiteNavActions>
          </SiteNavBar>
        ) : (
          children
        ),
    } as never,
    { "aria-label": "Main navigation" },
  );
}

/** The centred row of the bar. */
export function SiteNavBar(props: PartProps<"div">) {
  return part("div", "site-nav-bar", "fg-rail fg-snav-bar", props);
}

/** The logo, linking home. */
export function SiteNavHome({ children, href = "/", ...rest }: PartProps<"a">) {
  return part("a", "site-nav-home", undefined, {
    ...rest,
    href,
    "aria-label": "Forgeron, home",
    children: children ?? <Logo />,
  } as never);
}

/** The section links. */
export function SiteNavLinks(props: PartProps<"div">) {
  return part("div", "site-nav-links", "fg-snav-links text-eyebrow", props);
}

/** GitHub and the primary action. */
export function SiteNavActions(props: PartProps<"div">) {
  return part("div", "site-nav-actions", "fg-snav-actions", props);
}
