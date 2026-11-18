import { GithubIcon } from "@forgeron/icons";
import { Button } from "../button";
import { cx } from "../cx";
import { Icon } from "../icon";
import { Logo } from "../logo";

export interface SiteNavLink {
  href: string;
  label: string;
}

export interface SiteNavProps {
  /** The page's sections, or other pages, in the order they are read. */
  links: ReadonlyArray<SiteNavLink>;
  /** Where the primary action leads. */
  start: string;
  /** The primary action's label; "Get started" by default. */
  startLabel?: string;
  /** The public repository, behind the GitHub button. */
  github: string;
  /** The link marked as the current page (`aria-current`), if any. */
  current?: string;
  className?: string;
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
  className,
}: SiteNavProps) {
  return (
    <nav className={cx("fg-snav", className)} aria-label="Main navigation">
      <div className="fg-rail fg-snav-bar">
        <a href="/" aria-label="Forgeron, home">
          <Logo />
        </a>
        <div className="fg-snav-links text-eyebrow">
          {links.map((l) => (
            <a key={l.href} href={l.href} aria-current={l.href === current ? "page" : undefined}>
              {l.label}
            </a>
          ))}
        </div>
        <div className="fg-snav-actions">
          <Button href={github} size="sm">
            <Icon icon={GithubIcon} size={16} variant="mono" />
            GitHub
          </Button>
          <Button href={start} size="sm" variant="primary" marker>
            {startLabel}
          </Button>
        </div>
      </div>
    </nav>
  );
}
