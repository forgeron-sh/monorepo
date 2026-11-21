import { useRender } from "@base-ui/react/use-render";
import { isValidElement, type ComponentProps, type MouseEvent, type ReactNode } from "react";
import { cx } from "./cx";

export interface ToolIconProps extends Omit<ComponentProps<"span">, "className" | "children"> {
  /** The tool's name: its first letters make the mark. */
  name: string;
  size?: "md" | "lg";
  className?: string;
}

/** A square monogram. Black and white, sharp corners: a tool has no logo of its own here. */
export function ToolIcon({ name, size = "md", className, ...rest }: ToolIconProps) {
  const letters = name.replace(/[^\p{L}\p{N}]/gu, "").slice(0, 2) || "?";
  return (
    <span
      aria-hidden="true"
      data-slot="tool-icon"
      {...rest}
      className={cx("fg-toolicon", size === "lg" && "fg-toolicon-lg", className)}
    >
      {letters}
    </span>
  );
}

export interface ToolCardProps {
  name: string;
  summary: string;
  /** Where the card goes: the tool's page. The whole title is the link. */
  href: string;
  onNavigate?: (href: string) => void;
  /** Small facts under the summary: version, interfaces. */
  meta?: ReactNode;
  /** The one thing to do from here: Open, Connect, or what to ask for. */
  footer?: ReactNode;
  className?: string;
}

/** The parts form: the card's root, its parts as children (ToolCardHeader, ToolCardDescription…). */
export interface ToolCardRootProps extends Omit<ComponentProps<"li">, "children"> {
  name?: undefined;
  children?: ReactNode;
}

const plainClick =
  (href: string, onNavigate: ((href: string) => void) | undefined) =>
  (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      !onNavigate ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    onNavigate(href);
  };

/**
 * A tool in a grid: icon, name, summary, facts, and what to do next. With `name`, `summary` and
 * `href` it builds itself; without, compose it from ToolCardHeader, ToolCardTitle,
 * ToolCardDescription and ToolCardFooter.
 */
export function ToolCard(props: ToolCardProps | ToolCardRootProps) {
  if (props.name === undefined) {
    const { name: _name, className, children, ...rest } = props;
    return (
      <li data-slot="tool-card" {...rest} className={cx("fg-toolcard", className)}>
        {children}
      </li>
    );
  }
  const { name, summary, href, onNavigate, meta, footer, className } = props;
  return (
    <ToolCard className={className}>
      <ToolCardHeader>
        <ToolIcon name={name} />
        <ToolCardHeading>
          <ToolCardTitle>
            <ToolCardLink href={href} {...(onNavigate ? { onNavigate } : {})}>
              {name}
            </ToolCardLink>
          </ToolCardTitle>
          {meta ? <ToolCardMeta>{meta}</ToolCardMeta> : null}
        </ToolCardHeading>
      </ToolCardHeader>
      <ToolCardDescription>{summary}</ToolCardDescription>
      {footer ? <ToolCardFooter>{footer}</ToolCardFooter> : null}
    </ToolCard>
  );
}

/** Icon and titles side by side, at the top of the card. */
export function ToolCardHeader({ className, ...rest }: ComponentProps<"div">) {
  return (
    <div data-slot="tool-card-header" className={cx("fg-toolcard-top", className)} {...rest} />
  );
}

export interface ToolCardIconProps extends ComponentProps<"span"> {
  /** The tool's name: its first letters make the mark. Without it, the children are the mark. */
  name?: string;
  size?: "md" | "lg";
}

/** The card's square mark: a monogram from `name`, or any children. */
export function ToolCardIcon({
  name,
  size = "md",
  className,
  children,
  ...rest
}: ToolCardIconProps) {
  if (name !== undefined) return <ToolIcon name={name} size={size} className={className} />;
  return (
    <span
      data-slot="tool-card-icon"
      aria-hidden="true"
      {...rest}
      className={cx("fg-toolicon", size === "lg" && "fg-toolicon-lg", className)}
    >
      {children}
    </span>
  );
}

/** The column next to the icon: the title and the facts. */
export function ToolCardHeading({ className, ...rest }: ComponentProps<"div">) {
  return (
    <div data-slot="tool-card-heading" className={cx("fg-toolcard-titles", className)} {...rest} />
  );
}

export function ToolCardTitle({ className, ...rest }: ComponentProps<"h3">) {
  return <h3 data-slot="tool-card-title" className={cx("fg-toolcard-name", className)} {...rest} />;
}

export interface ToolCardLinkProps extends ComponentProps<"a"> {
  href: string;
  onNavigate?: (href: string) => void;
  /** The one child element (a router link) becomes the link. */
  asChild?: boolean;
}

/** The title's link; its stretched target makes the whole card the click area. */
export function ToolCardLink({
  href,
  onNavigate,
  asChild,
  className,
  children,
  onClick,
  ...rest
}: ToolCardLinkProps) {
  const child = asChild && isValidElement(children);
  const go = plainClick(href, onNavigate);
  return useRender({
    defaultTagName: "a",
    render: child ? children : undefined,
    props: {
      "data-slot": "tool-card-link",
      ...rest,
      href,
      className: cx("fg-toolcard-link", className),
      onClick: (event: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented) go(event);
      },
      ...(child ? {} : { children }),
    },
  });
}

/** Small facts under the title: version, interfaces. */
export function ToolCardMeta({ className, ...rest }: ComponentProps<"div">) {
  return <div data-slot="tool-card-meta" className={cx("fg-toolcard-meta", className)} {...rest} />;
}

export function ToolCardDescription({ className, ...rest }: ComponentProps<"p">) {
  return (
    <p
      data-slot="tool-card-description"
      className={cx("fg-toolcard-summary", className)}
      {...rest}
    />
  );
}

/** What to do next; stays clickable above the title's stretched link. */
export function ToolCardFooter({ className, ...rest }: ComponentProps<"div">) {
  return (
    <div data-slot="tool-card-footer" className={cx("fg-toolcard-footer", className)} {...rest} />
  );
}

export interface DetailItem {
  label: string;
  value: ReactNode;
}

export interface DetailListProps {
  items: ReadonlyArray<DetailItem>;
  className?: string;
}

/** The parts form: DetailListItem rows as children. */
export interface DetailListRootProps extends Omit<ComponentProps<"dl">, "children"> {
  items?: undefined;
  children?: ReactNode;
}

/** Label and value pairs: the right column of a tool card. */
export function DetailList(props: DetailListProps | DetailListRootProps) {
  if (props.items === undefined) {
    const { items: _items, className, children, ...rest } = props;
    return (
      <dl data-slot="detail-list" {...rest} className={cx("fg-details", className)}>
        {children}
      </dl>
    );
  }
  return (
    <DetailList className={props.className}>
      {props.items.map((item) => (
        <DetailListItem key={item.label}>
          <DetailListTerm>{item.label}</DetailListTerm>
          <DetailListValue>{item.value}</DetailListValue>
        </DetailListItem>
      ))}
    </DetailList>
  );
}

/** One row: a term and its value. */
export function DetailListItem({ className, ...rest }: ComponentProps<"div">) {
  return <div data-slot="detail-list-item" className={cx("fg-details-row", className)} {...rest} />;
}

export function DetailListTerm(props: ComponentProps<"dt">) {
  return <dt data-slot="detail-list-term" {...props} />;
}

export function DetailListValue(props: ComponentProps<"dd">) {
  return <dd data-slot="detail-list-value" {...props} />;
}
