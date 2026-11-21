// The left column of an app, after Tasks: the app switcher and its icon buttons on top, the
// primary links (Inbox with its count), sections that fold under a mono heading, nested links
// under a team, and a footer. Controlled by the current href: the matching link carries
// `aria-current="page"` and the ember bar.
//
// A preset of the `Sidebar` parts of shell.tsx. With props (`app`, `items`, `sections`…) it draws
// the usual column; without `app` it is the root of the parts:
//
//   <AppSidebar current={href} onNavigate={go}>
//     <AppSidebarHeader><AppSidebarSwitcher app={{ name: "Tasks", icon }} /></AppSidebarHeader>
//     <AppSidebarNav aria-label="Tasks navigation">
//       <AppSidebarMenu>
//         <AppSidebarItem><AppSidebarLink href="#/inbox" icon={InboxIcon} count={4}>Inbox</AppSidebarLink></AppSidebarItem>
//       </AppSidebarMenu>
//       <AppSidebarSection label="Workspace">…</AppSidebarSection>
//     </AppSidebarNav>
//     <AppSidebarFooter>…</AppSidebarFooter>
//   </AppSidebar>

import type { IconDefinition } from "@forgeron/icons";
import { ArrowDown01Icon } from "@forgeron/icons";
import type { ComponentProps, MouseEvent, ReactNode } from "react";
import { createContext, useContext, useId, useState } from "react";
import { ActionMenu, type ActionMenuEntry } from "../action-menu";
import { cx } from "../cx";
import { Icon } from "../icon";
import { AppTile } from "../identity";
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "../shell";
import { renderPart, type Part } from "../part";

export interface AppSidebarLink {
  /** Where the link goes; compared with `current`. Unused on a row with `items`: it only folds. */
  href?: string;
  label: string;
  icon?: IconDefinition;
  /** A letter in a framed square in place of the icon: a team. */
  initial?: string;
  /**
   * An ember count after the label, only for what waits on the user (unread notifications), never
   * a total. Absent or 0 hides it.
   */
  count?: number;
  /** Links nested under this one (a team's Issues, Projects, Views); the row then folds them. */
  items?: ReadonlyArray<AppSidebarLink>;
  /** Whether the nested links show at first. */
  defaultOpen?: boolean;
}

export interface AppSidebarSection {
  /** The mono heading: Workspace, Your teams. */
  label: string;
  items: ReadonlyArray<AppSidebarLink>;
  /** Whether the heading folds the section; true by default. */
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export interface AppSidebarApp {
  name: string;
  icon: IconDefinition;
}

export interface AppSidebarProps {
  /** The app on top: its tile and name. */
  app: AppSidebarApp;
  /** The other apps and workspace actions: the switcher opens them as a menu. */
  appMenu?: ReadonlyArray<ActionMenuEntry>;
  onAppMenuSelect?: (id: string) => void;
  /** Icon buttons after the switcher: search, new. */
  actions?: ReactNode;
  /** The primary links, above the sections: Inbox, My issues. */
  items: ReadonlyArray<AppSidebarLink>;
  sections?: ReadonlyArray<AppSidebarSection>;
  /** The href of the page shown. */
  current?: string;
  /** On a click on a link, for client-side routing: call `event.preventDefault()` to stay. */
  onNavigate?: (href: string, event: MouseEvent<HTMLAnchorElement>) => void;
  /** At the bottom: help, the viewer's avatar. */
  footer?: ReactNode;
  /** Names the navigation landmark; `<app> navigation` by default. */
  label?: string;
  className?: string;
}

/** The parts form: no `app` and no `items`; the children are the header, the nav and the footer. */
export interface AppSidebarRootProps extends Part<Omit<ComponentProps<"div">, "children">> {
  /** The href of the page shown: the link with this `href` is the current one. */
  current?: string;
  /** On a click on a link, for client-side routing: call `event.preventDefault()` to stay. */
  onNavigate?: (href: string, event: MouseEvent<HTMLAnchorElement>) => void;
  children?: ReactNode;
  app?: undefined;
  items?: undefined;
}

interface SidebarCtx {
  current?: string;
  onNavigate?: (href: string, event: MouseEvent<HTMLAnchorElement>) => void;
}

const Ctx = createContext<SidebarCtx>({});

/** The page shown and the navigation handler of the enclosing `AppSidebar`. */
export function useAppSidebar(): SidebarCtx {
  return useContext(Ctx);
}

/** The column itself: the `Sidebar`'s frame, open or collapsed with the enclosing provider. */
function AppSidebarFrame({ className, ...rest }: Part<ComponentProps<"div">>) {
  const { open } = useSidebar();
  return (
    <div
      data-slot="app-sidebar"
      {...rest}
      className={cx("fg-sidebar fg-aside", className)}
      data-state={open ? "open" : "collapsed"}
    />
  );
}

/** The left column of an app: switcher, links, folding sections, footer. */
export function AppSidebar(props: AppSidebarProps | AppSidebarRootProps) {
  if (props.app === undefined || props.items === undefined) {
    const { current, onNavigate, className, ...rest } = props as AppSidebarRootProps;
    return (
      <Ctx.Provider
        value={{
          ...(current !== undefined ? { current } : {}),
          ...(onNavigate ? { onNavigate } : {}),
        }}
      >
        <AppSidebarFrame {...rest} {...(className ? { className } : {})} />
      </Ctx.Provider>
    );
  }
  const {
    app,
    appMenu,
    onAppMenuSelect,
    actions,
    items,
    sections = [],
    current,
    onNavigate,
    footer,
    label,
    className,
  } = props;
  return (
    <AppSidebar
      {...(current !== undefined ? { current } : {})}
      {...(onNavigate ? { onNavigate } : {})}
      {...(className ? { className } : {})}
    >
      <AppSidebarHeader>
        <AppSidebarSwitcher
          app={app}
          {...(appMenu ? { menu: appMenu } : {})}
          {...(onAppMenuSelect ? { onSelect: onAppMenuSelect } : {})}
        />
        {actions}
      </AppSidebarHeader>
      <AppSidebarNav aria-label={label ?? `${app.name} navigation`}>
        <AppSidebarLinks items={items} />
        {sections.map((s, i) => (
          <AppSidebarSection
            key={`${s.label}-${i}`}
            label={s.label}
            {...(s.collapsible !== undefined ? { collapsible: s.collapsible } : {})}
            {...(s.defaultOpen !== undefined ? { defaultOpen: s.defaultOpen } : {})}
          >
            <AppSidebarLinks items={s.items} />
          </AppSidebarSection>
        ))}
      </AppSidebarNav>
      {footer ? <AppSidebarFooter>{footer}</AppSidebarFooter> : null}
    </AppSidebar>
  );
}

type PartProps<T extends "div" | "nav" | "ul" | "li" | "a" | "span"> = Part<ComponentProps<T>> & {
  asChild?: boolean;
};

/** The top row: the switcher, then icon buttons. */
export function AppSidebarHeader({ className, ...rest }: PartProps<"div">) {
  return (
    <SidebarHeader
      data-slot="app-sidebar-header"
      {...rest}
      className={cx("fg-aside-head", className)}
    />
  );
}

export interface AppSidebarSwitcherProps extends Part<Omit<ComponentProps<"button">, "onSelect">> {
  /** The app: its tile and name. */
  app: AppSidebarApp;
  /** The other apps and workspace actions: with them the switcher is a menu button. */
  menu?: ReadonlyArray<ActionMenuEntry>;
  onSelect?: (id: string) => void;
}

/** The app's tile and name; a menu of apps and workspace actions when it has `menu`. */
export function AppSidebarSwitcher({
  app,
  menu,
  onSelect,
  className,
  ...rest
}: AppSidebarSwitcherProps) {
  if (!menu) {
    return (
      <span
        data-slot="app-sidebar-switcher"
        className={cx("fg-aside-switcher fg-aside-static", className)}
      >
        <AppTile icon={app.icon} size={20} />
        <span className="fg-aside-app">{app.name}</span>
      </span>
    );
  }
  return (
    <ActionMenu
      trigger={
        <button
          type="button"
          data-slot="app-sidebar-switcher"
          {...rest}
          className={cx("fg-aside-switcher", className)}
        >
          <AppTile icon={app.icon} size={20} />
          <span className="fg-aside-app">{app.name}</span>
          <Icon icon={ArrowDown01Icon} size={12} variant="mono" className="fg-aside-chev" />
        </button>
      }
      items={menu}
      onSelect={(id) => onSelect?.(id)}
      label="Switch app"
    />
  );
}

/** The scrolling navigation: give it an `aria-label`. */
export function AppSidebarNav({ className, ...rest }: PartProps<"nav">) {
  return (
    <SidebarContent asChild data-slot="app-sidebar-nav">
      <nav {...rest} className={cx("fg-aside-nav", className)} />
    </SidebarContent>
  );
}

/** The bottom: help, the viewer's avatar. */
export function AppSidebarFooter({ className, ...rest }: PartProps<"div">) {
  return (
    <SidebarFooter
      data-slot="app-sidebar-footer"
      {...rest}
      className={cx("fg-aside-foot", className)}
    />
  );
}

export interface AppSidebarSectionProps extends Part<Omit<ComponentProps<"div">, "children">> {
  /** The mono heading. */
  label: ReactNode;
  /** Whether the heading folds the section; true by default. */
  collapsible?: boolean;
  defaultOpen?: boolean;
  children?: ReactNode;
}

/** A group under a mono heading that folds it. */
export function AppSidebarSection({
  label,
  collapsible = true,
  defaultOpen = true,
  className,
  children,
  ...rest
}: AppSidebarSectionProps) {
  const id = useId();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <SidebarGroup
      data-slot="app-sidebar-section"
      {...rest}
      className={cx("fg-aside-sec", className)}
    >
      {collapsible ? (
        <SidebarGroupLabel asChild>
          <button
            type="button"
            className="fg-aside-h"
            aria-expanded={open}
            aria-controls={id}
            onClick={() => setOpen(!open)}
          >
            {label}
            <Icon icon={ArrowDown01Icon} size={12} variant="mono" className="fg-aside-caret" />
          </button>
        </SidebarGroupLabel>
      ) : (
        <SidebarGroupLabel asChild>
          <div className="fg-aside-h" id={`${id}-h`}>
            {label}
          </div>
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent id={id} hidden={!open}>
        {children}
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

/** A list of links. */
export function AppSidebarMenu({ className, ...rest }: PartProps<"ul">) {
  return (
    <SidebarMenu
      data-slot="app-sidebar-menu"
      {...rest}
      className={cx("fg-aside-list", className)}
    />
  );
}

/** One row of a menu: holds a `AppSidebarLink` or an `AppSidebarFold`. */
export function AppSidebarItem(props: PartProps<"li">) {
  return <SidebarMenuItem data-slot="app-sidebar-item" {...props} />;
}

function Lead({ icon, initial }: { icon?: IconDefinition; initial?: string }) {
  if (initial)
    return (
      <span className="fg-aside-initial" aria-hidden="true">
        {initial.slice(0, 1)}
      </span>
    );
  return icon ? <Icon icon={icon} size={12} variant="mono" /> : null;
}

export interface AppSidebarLinkProps extends Part<Omit<ComponentProps<"a">, "children">> {
  icon?: IconDefinition;
  /** A letter in a framed square in place of the icon: a team. */
  initial?: string;
  /** An ember count, for what waits on the user only. 0 hides it. */
  count?: number;
  /** Indented under a fold. */
  nested?: boolean;
  /** The one child element (a router link) is the row: it gets the props. */
  asChild?: boolean;
  /** The label. */
  children?: ReactNode;
}

/** A link: the icon, the label, the count; the one whose `href` is the current one is marked. */
export function AppSidebarLink({
  icon,
  initial,
  count,
  nested,
  asChild,
  href,
  className,
  onClick,
  children,
  ...rest
}: AppSidebarLinkProps) {
  const ctx = useAppSidebar();
  const here = href !== undefined && href === ctx.current;
  const row = (
    <>
      <Lead {...(icon ? { icon } : {})} {...(initial ? { initial } : {})} />
      <span className="fg-aside-label">{children}</span>
      {count ? <span className="fg-aside-badge">{count}</span> : null}
    </>
  );
  return renderPart("a", cx("fg-aside-item", nested && "fg-aside-sub", className), asChild, {
    "data-slot": "app-sidebar-link",
    ...(href !== undefined ? { href } : {}),
    ...(here ? { "aria-current": "page" } : {}),
    onClick: (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      if (href !== undefined && !event.defaultPrevented) ctx.onNavigate?.(href, event);
    },
    ...rest,
    children: asChild ? children : row,
  });
}

export interface AppSidebarFoldProps extends Part<Omit<ComponentProps<"button">, "children">> {
  icon?: IconDefinition;
  initial?: string;
  count?: number;
  /** Whether the nested links show at first; true by default. */
  defaultOpen?: boolean;
  /** The label of the row. */
  label: ReactNode;
  /** The nested links: an `AppSidebarMenu` of nested `AppSidebarLink`s. */
  children?: ReactNode;
}

/** A row that folds the links under it. */
export function AppSidebarFold({
  icon,
  initial,
  count,
  defaultOpen = true,
  label,
  className,
  children,
  ...rest
}: AppSidebarFoldProps) {
  const id = useId();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <>
      <button
        type="button"
        data-slot="app-sidebar-fold"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        {...rest}
        className={cx("fg-aside-item", className)}
      >
        <Lead {...(icon ? { icon } : {})} {...(initial ? { initial } : {})} />
        <span className="fg-aside-label">{label}</span>
        {count ? <span className="fg-aside-badge">{count}</span> : null}
        <Icon icon={ArrowDown01Icon} size={12} variant="mono" className="fg-aside-caret" />
      </button>
      <div id={id} hidden={!open}>
        {children}
      </div>
    </>
  );
}

/** The links of the data form: a menu of links, folds for those with `items`. */
function AppSidebarLinks({
  items,
  nested,
}: {
  items: ReadonlyArray<AppSidebarLink>;
  nested?: boolean;
}) {
  return (
    <AppSidebarMenu>
      {items.map((item, i) => (
        <AppSidebarItem key={`${item.href ?? item.label}-${i}`}>
          {item.items ? (
            <AppSidebarFold
              label={item.label}
              {...(item.icon ? { icon: item.icon } : {})}
              {...(item.initial ? { initial: item.initial } : {})}
              {...(item.count !== undefined ? { count: item.count } : {})}
              {...(item.defaultOpen !== undefined ? { defaultOpen: item.defaultOpen } : {})}
            >
              <AppSidebarLinks items={item.items} nested />
            </AppSidebarFold>
          ) : (
            <AppSidebarLink
              {...(item.href !== undefined ? { href: item.href } : {})}
              {...(item.icon ? { icon: item.icon } : {})}
              {...(item.initial ? { initial: item.initial } : {})}
              {...(item.count !== undefined ? { count: item.count } : {})}
              {...(nested ? { nested } : {})}
            >
              {item.label}
            </AppSidebarLink>
          )}
        </AppSidebarItem>
      ))}
    </AppSidebarMenu>
  );
}
