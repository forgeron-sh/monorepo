// The top bar of a list view: where it is (a breadcrumb or a title), the views of the list (All
// issues, Active, Backlog), and on the right the filter, the display options and the main action.
//
// Two ways to use it. With props (`breadcrumb`, `tabs`, `filter`, `display`, `action`…) it renders
// the usual bar. With children it is the root of the parts:
//
//   <ViewHeader>
//     <ViewHeaderBar>
//       <ViewHeaderTitle><ViewHeaderName>Issues</ViewHeaderName></ViewHeaderTitle>
//       <ViewHeaderTabs>
//         <ViewHeaderTab current onClick={…}>All<ViewHeaderCount>12</ViewHeaderCount></ViewHeaderTab>
//       </ViewHeaderTabs>
//       <ViewHeaderActions>{filter}{display}{action}</ViewHeaderActions>
//     </ViewHeaderBar>
//   </ViewHeader>

import type { ComponentProps, ReactNode } from "react";
import { cx } from "../cx";
import { Breadcrumb, type BreadcrumbItem } from "../identity";
import { renderPart, type Part } from "../part";

export interface ViewTab {
  value: string;
  label: string;
  /** How many records the view holds: shown on the current tab only. */
  count?: number;
  /** A link to the view; without it the tab is a button that calls `onTabChange`. */
  href?: string;
}

export interface ViewHeaderProps {
  /** Where the view sits: the team, then the page. Takes the place of `title`. */
  breadcrumb?: ReadonlyArray<BreadcrumbItem>;
  /** The name of the view, when there is no breadcrumb. */
  title?: ReactNode;
  tabs?: ReadonlyArray<ViewTab>;
  /** The current tab's `value`. */
  tab?: string;
  onTabChange?: (value: string) => void;
  /** The layouts as icons, before the filter: a `LayoutSwitch`. */
  switcher?: ReactNode;
  /** The filter button: a `FilterMenu`. */
  filter?: ReactNode;
  /** The display button: a `DisplayMenu`. */
  display?: ReactNode;
  /** The main action: a primary `Button` such as "New issue" with its shortcut. */
  action?: ReactNode;
  className?: string;
}

/** The parts form: the shorthand props are `undefined`, the children are the bar. */
export interface ViewHeaderRootProps extends Part<Omit<ComponentProps<"header">, "title">> {
  asChild?: boolean;
  breadcrumb?: undefined;
  title?: undefined;
  tabs?: undefined;
  tab?: undefined;
  onTabChange?: undefined;
  switcher?: undefined;
  filter?: undefined;
  display?: undefined;
  action?: undefined;
}

/**
 * The bar above a list: title, view tabs, then filter, display and the main action on the right.
 * On a phone the tabs move to a second line and scroll sideways. With children, the root of the
 * parts (`ViewHeaderBar`, `ViewHeaderTitle`, `ViewHeaderTabs`, `ViewHeaderActions`…).
 */
export function ViewHeader(props: ViewHeaderProps | ViewHeaderRootProps) {
  if ("children" in props && props.children !== undefined) {
    const { asChild, className, breadcrumb: _b, title: _t, ...rest } = props as ViewHeaderRootProps;
    return renderPart("header", cx("fg-vhead", className), asChild, {
      "data-slot": "view-header",
      ...rest,
    });
  }
  const {
    breadcrumb,
    title,
    tabs = [],
    tab,
    onTabChange,
    switcher,
    filter,
    display,
    action,
    className,
  } = props as ViewHeaderProps;
  return (
    <ViewHeaderRoot {...(className ? { className } : {})}>
      <ViewHeaderBar>
        <ViewHeaderTitle>
          {breadcrumb ? (
            <Breadcrumb items={breadcrumb} />
          ) : title ? (
            <ViewHeaderName>{title}</ViewHeaderName>
          ) : null}
        </ViewHeaderTitle>
        {tabs.length > 0 ? (
          <ViewHeaderTabs>
            {tabs.map((t) => {
              const current = t.value === tab;
              return (
                <ViewHeaderTab
                  key={t.value}
                  current={current}
                  {...(t.href !== undefined
                    ? { href: t.href }
                    : { onClick: () => onTabChange?.(t.value) })}
                >
                  {t.label}
                  {current && t.count !== undefined ? (
                    <ViewHeaderCount>{t.count}</ViewHeaderCount>
                  ) : null}
                </ViewHeaderTab>
              );
            })}
          </ViewHeaderTabs>
        ) : null}
        {switcher || filter || display || action ? (
          <ViewHeaderActions>
            {switcher}
            {filter}
            {display}
            {action}
          </ViewHeaderActions>
        ) : null}
      </ViewHeaderBar>
    </ViewHeaderRoot>
  );
}

function ViewHeaderRoot({ className, ...rest }: Part<ComponentProps<"header">>) {
  return <header data-slot="view-header" {...rest} className={cx("fg-vhead", className)} />;
}

/* ---------------------------------------------------------------- parts */

type PartProps<T extends keyof React.JSX.IntrinsicElements> = Part<ComponentProps<T>> & {
  asChild?: boolean;
};

/** The row: title, tabs and actions. */
export function ViewHeaderBar({ asChild, className, ...rest }: PartProps<"div">) {
  return renderPart("div", cx("fg-vhead-bar", className), asChild, {
    "data-slot": "view-header-bar",
    ...rest,
  });
}

/** The left end: a breadcrumb or a `ViewHeaderName`. */
export function ViewHeaderTitle({ asChild, className, ...rest }: PartProps<"div">) {
  return renderPart("div", cx("fg-vhead-title", className), asChild, {
    "data-slot": "view-header-title",
    ...rest,
  });
}

/** The name of the view. */
export function ViewHeaderName({ asChild, className, ...rest }: PartProps<"h2">) {
  return renderPart("h2", cx("fg-vhead-name", className), asChild, {
    "data-slot": "view-header-name",
    ...rest,
  });
}

/** The views of the list, as a navigation. */
export function ViewHeaderTabs({ asChild, className, ...rest }: PartProps<"nav">) {
  return renderPart("nav", cx("fg-vhead-tabs", className), asChild, {
    "aria-label": "Views",
    "data-slot": "view-header-tabs",
    ...rest,
  });
}

export interface ViewHeaderTabProps extends Part<ComponentProps<"a">> {
  /** The view being shown. */
  current?: boolean;
  asChild?: boolean;
}

/** One view: a link with `href`, else a button that is pressed when it is the current one. */
export function ViewHeaderTab({
  current,
  asChild,
  className,
  href,
  type: _type,
  ...rest
}: ViewHeaderTabProps) {
  const cls = cx("fg-vhead-tab", className);
  if (href === undefined && !asChild) {
    return (
      <button
        data-slot="view-header-tab"
        {...(rest as ComponentProps<"button">)}
        type="button"
        className={cls}
        aria-pressed={Boolean(current)}
      />
    );
  }
  return renderPart("a", cls, asChild, {
    "data-slot": "view-header-tab",
    ...(href !== undefined ? { href } : {}),
    ...(current ? { "aria-current": "page" } : {}),
    ...rest,
  });
}

/** How many records the view holds. */
export function ViewHeaderCount({ asChild, className, ...rest }: PartProps<"span">) {
  return renderPart("span", cx("fg-vhead-count", className), asChild, {
    "data-slot": "view-header-count",
    ...rest,
  });
}

/** The right end: the layout switch, the filter, the display button and the main action. */
export function ViewHeaderActions({ asChild, className, ...rest }: PartProps<"div">) {
  return renderPart("div", cx("fg-vhead-actions", className), asChild, {
    "data-slot": "view-header-actions",
    ...rest,
  });
}
