import type { ComponentProps, ReactNode } from "react";
import type { IconDefinition } from "@forgeron/icons";
import { cx } from "./cx";
import { Icon } from "./icon";
import { hasPart, renderPart } from "./shell-part";

type PartProps<T extends "div" | "p"> = ComponentProps<T> & { asChild?: boolean };

export interface NoticeProps extends Omit<ComponentProps<"div">, "title"> {
  tone?: "info" | "success" | "warning" | "danger";
  /** With `NoticeTitle`, `NoticeDescription` or `NoticeAction` as children, leave `title` and `action` out. */
  title?: ReactNode;
  /** A button or link at the end: the thing to do next. */
  action?: ReactNode;
}

const TONE_WORD = { info: "Note", success: "Done", warning: "Warning", danger: "Error" } as const;

/** A message in the flow of the page. The state always comes with a word, never a color alone. */
export function Notice({
  tone = "info",
  title,
  action,
  className,
  children,
  ...rest
}: NoticeProps) {
  const root = {
    role: tone === "danger" || tone === "warning" ? "alert" : "status",
    ...rest,
    "data-slot": "notice",
    className: cx("fg-notice", `fg-notice-${tone}`, className),
  };
  if (!title && !action && hasPart(children, [NoticeTitle, NoticeDescription, NoticeAction])) {
    const list = Array.isArray(children) ? (children as ReactNode[]) : [children];
    const isAction = (c: ReactNode) =>
      typeof c === "object" && c !== null && "type" in c && c.type === NoticeAction;
    return (
      <div {...root}>
        <span className="fg-notice-mark">{TONE_WORD[tone]}</span>
        <div className="fg-notice-body">{list.filter((c) => !isAction(c))}</div>
        {list.filter(isAction)}
      </div>
    );
  }
  return (
    <div {...root}>
      <span className="fg-notice-mark">{TONE_WORD[tone]}</span>
      <div className="fg-notice-body">
        {title ? <p className="fg-notice-title">{title}</p> : null}
        {children ? <div className="fg-notice-text">{children}</div> : null}
      </div>
      {action ? <div className="fg-notice-action">{action}</div> : null}
    </div>
  );
}

export function NoticeTitle({ className, asChild, ...rest }: PartProps<"p">) {
  return renderPart("p", cx("fg-notice-title", className), asChild, {
    ...rest,
    "data-slot": "notice-title",
  });
}

export function NoticeDescription({ className, asChild, ...rest }: PartProps<"div">) {
  return renderPart("div", cx("fg-notice-text", className), asChild, {
    ...rest,
    "data-slot": "notice-description",
  });
}

/** The thing to do next, at the end of the notice. */
export function NoticeAction({ className, asChild, ...rest }: PartProps<"div">) {
  return renderPart("div", cx("fg-notice-action", className), asChild, {
    ...rest,
    "data-slot": "notice-action",
  });
}

interface EmptyStateBase {
  /**
   * `plain` (default): a dashed frame. `hatch`: the hatched field of the lab language, the words
   * set on the background colour, the way an empty list fills its pane.
   */
  variant?: "plain" | "hatch";
}

/** The props form: `title` (with `icon`, `description`, `action`) builds the content. */
export interface EmptyStateProps
  extends EmptyStateBase, Omit<ComponentProps<"div">, "title" | "children"> {
  title: ReactNode;
  /** A pixel icon above the title, in `ink-dim`. */
  icon?: IconDefinition;
  description?: ReactNode;
  /** The one thing to do about it. */
  action?: ReactNode;
}

/** The parts form: no `title`, the children are `EmptyStateIcon`, `EmptyStateTitle`… */
export interface EmptyStatePartsProps extends EmptyStateBase, ComponentProps<"div"> {
  title?: undefined;
  icon?: undefined;
  description?: undefined;
  action?: undefined;
}

/** What a list shows when there is nothing in it yet, and what to do about it. */
export function EmptyState(props: EmptyStateProps | EmptyStatePartsProps) {
  const { variant = "plain", className } = props;
  const classes = cx("fg-empty", variant === "hatch" && "fg-empty-hatch", className);
  if (props.title === undefined) {
    const {
      variant: _v,
      className: _c,
      title: _t,
      icon: _i,
      description: _d,
      action: _a,
      ...rest
    } = props;
    return <div {...rest} data-slot="empty-state" className={classes} />;
  }
  const { variant: _v, className: _c, title, icon, description, action, ...rest } = props;
  return (
    <div {...rest} data-slot="empty-state" className={classes}>
      {icon ? <Icon icon={icon} size={36} className="fg-empty-icon" /> : null}
      <p className="fg-empty-title">{title}</p>
      {description ? <p className="fg-empty-text">{description}</p> : null}
      {action ? <div className="fg-empty-action">{action}</div> : null}
    </div>
  );
}

export interface EmptyStateIconProps extends ComponentProps<"div"> {
  /** A pixel icon of `@forgeron/icons`; or put your own drawing in the children. */
  icon?: IconDefinition;
  asChild?: boolean;
}

export function EmptyStateIcon({
  icon,
  className,
  asChild,
  children,
  ...rest
}: EmptyStateIconProps) {
  return renderPart("div", cx("fg-empty-icon", className), asChild, {
    ...rest,
    "data-slot": "empty-state-icon",
    children: icon ? <Icon icon={icon} size={36} /> : children,
  });
}

export function EmptyStateTitle({ className, asChild, ...rest }: PartProps<"p">) {
  return renderPart("p", cx("fg-empty-title", className), asChild, {
    ...rest,
    "data-slot": "empty-state-title",
  });
}

export function EmptyStateDescription({ className, asChild, ...rest }: PartProps<"p">) {
  return renderPart("p", cx("fg-empty-text", className), asChild, {
    ...rest,
    "data-slot": "empty-state-description",
  });
}

export function EmptyStateActions({ className, asChild, ...rest }: PartProps<"div">) {
  return renderPart("div", cx("fg-empty-action", className), asChild, {
    ...rest,
    "data-slot": "empty-state-actions",
  });
}

export interface SpinnerProps extends Omit<ComponentProps<"span">, "children"> {
  /** Said to assistive technology and shown beside the mark. */
  label?: string;
}

/** Eight pixels on a ring lighting in turn: the loading state. Nothing turns, nothing bounces. */
export function Spinner({ label = "Loading", className, ...rest }: SpinnerProps) {
  return (
    <span role="status" {...rest} data-slot="spinner" className={cx("fg-spinner", className)}>
      <span className="fg-spinner-mark" aria-hidden="true" />
      <span className="fg-spinner-label">{label}</span>
    </span>
  );
}
