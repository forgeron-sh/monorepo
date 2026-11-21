// A settings page: groups of rows. `SettingsGroup` and `SettingsRow` take the props form (`title`,
// `label`...) or, as in shadcn, parts: `SettingsGroupHeader`, `SettingsGroupTitle`,
// `SettingsGroupDescription`, `SettingsGroupCard`; `SettingsRowText`, `SettingsRowLabel`,
// `SettingsRowDescription`, `SettingsRowControl`, `SettingsRowValue` (D-156).

import { ArrowRight01Icon } from "@forgeron/icons";
import type { ComponentProps, MouseEvent, ReactNode } from "react";
import { cx } from "./cx";
import { Icon } from "./icon";
import { hasPart, renderPart, type Part } from "./part";

interface AsChild {
  asChild?: boolean;
}

export interface SettingsGroupProps extends Part<Omit<ComponentProps<"section">, "title">> {
  title?: ReactNode;
  description?: ReactNode;
  /** A danger zone: a `danger` outline and title. Last on the page. */
  tone?: "default" | "danger";
  /**
   * The rows (they are put in the card), or the parts: `SettingsGroupHeader` and
   * `SettingsGroupCard` as children, laid out as you write them.
   */
  children?: ReactNode;
}

/** A titled card of rows: one group of a settings page. */
export function SettingsGroup({
  title,
  description,
  tone = "default",
  className,
  children,
  ...rest
}: SettingsGroupProps) {
  const parts = hasPart(children, [SettingsGroupHeader, SettingsGroupCard]);
  return (
    <section
      data-slot="settings-group"
      {...rest}
      className={cx("fg-sgroup", tone === "danger" && "fg-sgroup-danger", className)}
    >
      {title || description ? (
        <SettingsGroupHeader>
          {title ? <SettingsGroupTitle>{title}</SettingsGroupTitle> : null}
          {description ? <SettingsGroupDescription>{description}</SettingsGroupDescription> : null}
        </SettingsGroupHeader>
      ) : null}
      {parts ? children : <SettingsGroupCard>{children}</SettingsGroupCard>}
    </section>
  );
}

export interface SettingsGroupHeaderProps extends Part<ComponentProps<"header">>, AsChild {}
export function SettingsGroupHeader({ asChild, className, ...rest }: SettingsGroupHeaderProps) {
  return renderPart("header", cx("fg-sgroup-head", className), asChild, {
    "data-slot": "settings-group-header",
    ...rest,
  });
}
export interface SettingsGroupTitleProps extends Part<ComponentProps<"h2">>, AsChild {}
/** An `h2`; `asChild` for another level. */
export function SettingsGroupTitle({ asChild, className, ...rest }: SettingsGroupTitleProps) {
  return renderPart("h2", cx("fg-sgroup-title", className), asChild, {
    "data-slot": "settings-group-title",
    ...rest,
  });
}
export interface SettingsGroupDescriptionProps extends Part<ComponentProps<"p">>, AsChild {}
export function SettingsGroupDescription({
  asChild,
  className,
  ...rest
}: SettingsGroupDescriptionProps) {
  return renderPart("p", cx("fg-sgroup-desc", className), asChild, {
    "data-slot": "settings-group-description",
    ...rest,
  });
}
export interface SettingsGroupCardProps extends Part<ComponentProps<"div">>, AsChild {}
/** The card the rows are in. */
export function SettingsGroupCard({ asChild, className, ...rest }: SettingsGroupCardProps) {
  return renderPart("div", cx("fg-sgroup-card", className), asChild, {
    "data-slot": "settings-group-card",
    ...rest,
  });
}

export interface SettingsRowProps extends Part<Omit<ComponentProps<"div">, "children">> {
  label: ReactNode;
  description?: ReactNode;
  /** The control, right: a button, a switch, a value, a select. */
  children?: ReactNode;
  /** Present: the whole row is a link to a sub-page and ends with a chevron. */
  href?: string;
  onNavigate?: (href: string, event: MouseEvent<HTMLAnchorElement>) => void;
  /** The value shown before the chevron of a link row. */
  value?: ReactNode;
}

/** The parts form: no `label`; the children are `SettingsRowText` and `SettingsRowControl`. */
export interface SettingsRowRootProps extends Part<ComponentProps<"div">>, AsChild {
  label?: undefined;
}

const plainClick = (e: MouseEvent) =>
  e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

/**
 * A row of a settings group: label and description left, control right; a link row ends with a
 * chevron. Without `label`: the root of the parts; with `asChild`, the one child (a link) is the row.
 */
export function SettingsRow(props: SettingsRowProps | SettingsRowRootProps) {
  if (props.label === undefined) {
    const { asChild, className, label: _label, ...rest } = props as SettingsRowRootProps;
    return renderPart("div", cx("fg-srow", className), asChild, {
      "data-slot": "settings-row",
      ...rest,
    });
  }
  const { label, description, children, href, onNavigate, value, className, ...rest } =
    props as SettingsRowProps;
  const text = (
    <SettingsRowText>
      <SettingsRowLabel>{label}</SettingsRowLabel>
      {description ? <SettingsRowDescription>{description}</SettingsRowDescription> : null}
    </SettingsRowText>
  );
  if (href !== undefined) {
    return (
      <a
        data-slot="settings-row"
        {...(rest as ComponentProps<"a">)}
        className={cx("fg-srow fg-srow-link", className)}
        href={href}
        onClick={
          onNavigate
            ? (e) => {
                if (!plainClick(e)) return;
                e.preventDefault();
                onNavigate(href, e);
              }
            : undefined
        }
      >
        {text}
        <SettingsRowControl>
          {value ? <SettingsRowValue>{value}</SettingsRowValue> : null}
          <Icon icon={ArrowRight01Icon} size={12} variant="mono" className="fg-srow-chev" />
        </SettingsRowControl>
      </a>
    );
  }
  return (
    <div data-slot="settings-row" {...rest} className={cx("fg-srow", className)}>
      {text}
      {children ? <SettingsRowControl>{children}</SettingsRowControl> : null}
    </div>
  );
}

export interface SettingsRowPartProps extends Part<ComponentProps<"span">>, AsChild {}
/** Label and description, left. */
export function SettingsRowText({ asChild, className, ...rest }: SettingsRowPartProps) {
  return renderPart("span", cx("fg-srow-text", className), asChild, {
    "data-slot": "settings-row-text",
    ...rest,
  });
}
export function SettingsRowLabel({ asChild, className, ...rest }: SettingsRowPartProps) {
  return renderPart("span", cx("fg-srow-label", className), asChild, {
    "data-slot": "settings-row-label",
    ...rest,
  });
}
export function SettingsRowDescription({ asChild, className, ...rest }: SettingsRowPartProps) {
  return renderPart("span", cx("fg-srow-desc", className), asChild, {
    "data-slot": "settings-row-description",
    ...rest,
  });
}
export interface SettingsRowControlProps extends Part<ComponentProps<"div">>, AsChild {}
/** The control, right. */
export function SettingsRowControl({ asChild, className, ...rest }: SettingsRowControlProps) {
  return renderPart("div", cx("fg-srow-control", className), asChild, {
    "data-slot": "settings-row-control",
    ...rest,
  });
}
/** The current value, before the chevron of a link row. */
export function SettingsRowValue({ asChild, className, ...rest }: SettingsRowPartProps) {
  return renderPart("span", cx("fg-srow-value", className), asChild, {
    "data-slot": "settings-row-value",
    ...rest,
  });
}
