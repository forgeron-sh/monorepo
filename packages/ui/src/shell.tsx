// The frame of an app: AppShell, Sidebar and Nav. Each takes the props form people use (`sidebar`,
// `items`, `header`...) or, as in shadcn, its parts: `AppShellHeader`, `AppShellSidebar`,
// `AppShellMain`; `SidebarHeader`, `SidebarContent`, `SidebarGroup`, `SidebarMenuButton`...;
// `NavList`, `NavListItem`, `NavLink`... (D-156).

import { Cancel01Icon, Menu01Icon } from "@forgeron/icons";
import {
  createContext,
  use,
  useId,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
} from "react";
import { cx } from "./cx";
import { useControllableState } from "./hooks/use-controllable";
import { IconButton } from "./identity";
import { hasPart, renderPart, type Part } from "./shell-part";

/* ------------------------------------------------------------------------------------ Nav */

export interface NavItem {
  id: string;
  label: string;
  href: string;
  /** The page being shown: gets `aria-current="page"` and the `inverse` selection. */
  current?: boolean;
  /** A count or a state next to the label, e.g. pending approvals. */
  badge?: ReactNode;
  /** A small glyph before the label (16px, `currentColor`); decorative. */
  icon?: ReactNode;
}

export interface NavProps {
  /** Accessible name of the landmark. */
  label: string;
  items: ReadonlyArray<NavItem>;
  /** A small title above the group: "Account", "Workspace". */
  heading?: string;
  /** Called on a plain click, so the caller can route without a page load; omit for normal links. */
  onNavigate?: (href: string, event: MouseEvent<HTMLAnchorElement>) => void;
  className?: string;
}

/** The root of the parts form: no `items`; the children are `NavHeading` and `NavList`. */
export interface NavRootProps extends Part<Omit<ComponentProps<"nav">, "aria-label">> {
  /** Accessible name of the landmark. */
  label: string;
  items?: undefined;
  heading?: undefined;
  onNavigate?: undefined;
  asChild?: boolean;
}

const plainClick = (e: MouseEvent) =>
  e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

/**
 * A vertical list of links; the current one is told by `aria-current`, not by color alone. With
 * `items`: the whole list. Without: the root of the parts (`NavHeading`, `NavList`, `NavListItem`,
 * `NavLink`, `NavIcon`, `NavLabel`, `NavBadge`).
 */
export function Nav(props: NavProps | NavRootProps) {
  if (props.items === undefined) return <NavRoot {...(props as NavRootProps)} />;
  const { label, items, heading, onNavigate, className } = props as NavProps;
  return (
    <NavRoot label={label} className={className}>
      {heading ? <NavHeading>{heading}</NavHeading> : null}
      <NavList>
        {items.map((item) => (
          <NavListItem key={item.id}>
            <NavLink href={item.href} current={item.current} onNavigate={onNavigate}>
              <NavLabel>
                {item.icon ? <NavIcon>{item.icon}</NavIcon> : null}
                {item.label}
              </NavLabel>
              {item.badge !== undefined && item.badge !== null ? (
                <NavBadge>{item.badge}</NavBadge>
              ) : null}
            </NavLink>
          </NavListItem>
        ))}
      </NavList>
    </NavRoot>
  );
}

function NavRoot({
  label,
  asChild,
  className,
  items: _items,
  heading: _heading,
  onNavigate: _onNavigate,
  ...rest
}: NavRootProps) {
  return renderPart("nav", cx("fg-nav", className), asChild, { ...rest, "aria-label": label });
}

export interface NavHeadingProps extends Part<ComponentProps<"p">> {
  asChild?: boolean;
}
/** A small title above a list. */
export function NavHeading({ asChild, className, ...rest }: NavHeadingProps) {
  return renderPart("p", cx("fg-nav-heading", className), asChild, rest);
}

export interface NavListProps extends Part<ComponentProps<"ul">> {
  asChild?: boolean;
}
export function NavList({ asChild, className, ...rest }: NavListProps) {
  return renderPart("ul", cx("fg-nav-list", className), asChild, rest);
}

export interface NavListItemProps extends Part<ComponentProps<"li">> {
  asChild?: boolean;
}
export function NavListItem({ asChild, className, ...rest }: NavListItemProps) {
  return renderPart("li", className, asChild, rest);
}

export interface NavLinkProps extends Part<ComponentProps<"a">> {
  /** The page being shown: `aria-current="page"` and the inverse selection. */
  current?: boolean;
  /** Called on a plain click, so the caller can route without a page load. */
  onNavigate?: ((href: string, event: MouseEvent<HTMLAnchorElement>) => void) | undefined;
  /** The one child element (a router link) is the link: it gets the props. */
  asChild?: boolean;
}
export function NavLink({
  current,
  onNavigate,
  asChild,
  className,
  onClick,
  href,
  ...rest
}: NavLinkProps) {
  return renderPart("a", cx("fg-nav-link", className), asChild, {
    ...rest,
    href,
    "aria-current": current ? "page" : rest["aria-current"],
    onClick: (e: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e);
      if (e.defaultPrevented || !onNavigate || href === undefined || !plainClick(e)) return;
      e.preventDefault();
      onNavigate(href, e);
    },
  });
}

export interface NavLabelProps extends Part<ComponentProps<"span">> {
  asChild?: boolean;
}
/** The text of a link, with its icon before it. */
export function NavLabel({ asChild, className, ...rest }: NavLabelProps) {
  return renderPart("span", cx("fg-nav-label", className), asChild, rest);
}
export function NavIcon({ asChild, className, ...rest }: NavLabelProps) {
  return renderPart("span", cx("fg-nav-icon", className), asChild, rest);
}
/** A count or a state at the end of a link. */
export function NavBadge({ asChild, className, ...rest }: NavLabelProps) {
  return renderPart("span", cx("fg-nav-badge", className), asChild, rest);
}

/* --------------------------------------------------------------------------------- Sidebar */

interface SidebarState {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}
const SidebarContext = createContext<SidebarState | null>(null);
const SIDEBAR_FALLBACK: SidebarState = { open: true, setOpen: () => {}, toggle: () => {} };

/** Whether the sidebar is open, and how to change it; "open" and a no-op outside a `SidebarProvider`. */
export function useSidebar(): SidebarState {
  return use(SidebarContext) ?? SIDEBAR_FALLBACK;
}

export interface SidebarProviderProps {
  open?: boolean;
  /** Default `true`. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

/**
 * Holds whether the sidebar is open (controlled or not). A `Sidebar` inside it says
 * `data-state="open"` or `"collapsed"`, and a collapsed one is hidden; `SidebarTrigger` toggles it.
 */
export function SidebarProvider({
  open,
  defaultOpen = true,
  onOpenChange,
  children,
}: SidebarProviderProps) {
  const [current, setCurrent] = useControllableState<boolean>({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  return (
    <SidebarContext
      value={{ open: current, setOpen: setCurrent, toggle: () => setCurrent(!current) }}
    >
      {children}
    </SidebarContext>
  );
}

export interface SidebarProps extends Part<Omit<ComponentProps<"div">, "children">> {
  /** Top: the workspace. Same as a `SidebarHeader` child. */
  header?: ReactNode;
  /** Bottom: the signed-in person and sign-out. Same as a `SidebarFooter` child. */
  footer?: ReactNode;
  /**
   * The body. Made of `SidebarHeader`, `SidebarContent` and `SidebarFooter` (parts form), or
   * anything else: it is then wrapped in a `SidebarContent`.
   */
  children?: ReactNode;
}

/** The `surface` column on the left: header, navigation, footer. */
export function Sidebar({ header, footer, className, children, ...rest }: SidebarProps) {
  const { open } = useSidebar();
  const parts = hasPart(children, [SidebarHeader, SidebarContent, SidebarFooter]);
  return (
    <div {...rest} className={cx("fg-sidebar", className)} data-state={open ? "open" : "collapsed"}>
      {header ? <SidebarHeader>{header}</SidebarHeader> : null}
      {parts ? children : <SidebarContent>{children}</SidebarContent>}
      {footer ? <SidebarFooter>{footer}</SidebarFooter> : null}
    </div>
  );
}

interface AsChild {
  asChild?: boolean;
}

export interface SidebarHeaderProps extends Part<ComponentProps<"div">>, AsChild {}
export function SidebarHeader({ asChild, className, ...rest }: SidebarHeaderProps) {
  return renderPart("div", cx("fg-sidebar-head", className), asChild, rest);
}
export function SidebarContent({ asChild, className, ...rest }: SidebarHeaderProps) {
  return renderPart("div", cx("fg-sidebar-body", className), asChild, rest);
}
export function SidebarFooter({ asChild, className, ...rest }: SidebarHeaderProps) {
  return renderPart("div", cx("fg-sidebar-foot", className), asChild, rest);
}
/** A rule between two groups. */
export function SidebarSeparator({ className, ...rest }: Part<ComponentProps<"hr">>) {
  return <hr {...rest} className={cx("fg-sidebar-sep", className)} />;
}

/** A group of the body: a label and a menu. */
export function SidebarGroup({ asChild, className, ...rest }: SidebarHeaderProps) {
  return renderPart("div", cx("fg-sidebar-group", className), asChild, {
    role: "group",
    ...rest,
  });
}
export interface SidebarGroupLabelProps extends Part<ComponentProps<"p">>, AsChild {}
export function SidebarGroupLabel({ asChild, className, ...rest }: SidebarGroupLabelProps) {
  return renderPart("p", cx("fg-sidebar-group-label", className), asChild, rest);
}
export function SidebarGroupContent({ asChild, className, ...rest }: SidebarHeaderProps) {
  return renderPart("div", cx("fg-sidebar-group-content", className), asChild, rest);
}

export interface SidebarMenuProps extends Part<ComponentProps<"ul">>, AsChild {}
export function SidebarMenu({ asChild, className, ...rest }: SidebarMenuProps) {
  return renderPart("ul", cx("fg-sidebar-menu", className), asChild, rest);
}
export interface SidebarMenuItemProps extends Part<ComponentProps<"li">>, AsChild {}
export function SidebarMenuItem({ asChild, className, ...rest }: SidebarMenuItemProps) {
  return renderPart("li", cx("fg-sidebar-item", className), asChild, rest);
}

export interface SidebarMenuButtonProps extends Part<ComponentProps<"button">> {
  /** The one child element (a link, a router link) is the button: it gets the props. */
  asChild?: boolean;
  /** The page being shown: `aria-current="page"` and the inverse selection. */
  isActive?: boolean;
}
/** A row of a menu: a `button`, or with `asChild` the link you give it. */
export function SidebarMenuButton({
  asChild,
  isActive,
  className,
  type,
  ...rest
}: SidebarMenuButtonProps) {
  return renderPart("button", cx("fg-sidebar-btn", className), asChild, {
    ...(asChild ? {} : { type: type ?? "button" }),
    ...rest,
    "aria-current": isActive ? "page" : rest["aria-current"],
    "data-active": isActive ? "" : undefined,
  });
}
/** A count or a state at the end of a menu row. */
export function SidebarMenuBadge({
  asChild,
  className,
  ...rest
}: Part<ComponentProps<"span">> & AsChild) {
  return renderPart("span", cx("fg-nav-badge", className), asChild, rest);
}

export interface SidebarTriggerProps extends Omit<
  ComponentProps<typeof IconButton>,
  "icon" | "label" | "href"
> {
  label?: string;
}
/** A button that opens and collapses the sidebar of the `SidebarProvider` around it. */
export function SidebarTrigger({
  label = "Toggle sidebar",
  onClick,
  ...rest
}: SidebarTriggerProps) {
  const { open, toggle } = useSidebar();
  return (
    <IconButton
      {...(rest as object)}
      icon={open ? Cancel01Icon : Menu01Icon}
      label={label}
      aria-expanded={open}
      onClick={(e: MouseEvent<HTMLButtonElement>) => {
        (onClick as ((e: MouseEvent<HTMLButtonElement>) => void) | undefined)?.(e);
        if (!e.defaultPrevented) toggle();
      }}
    />
  );
}

/* --------------------------------------------------------------------------------- AppShell */

interface ShellState {
  menuOpen: boolean;
  toggle: () => void;
  sideId: string;
  contentId: string;
}
const ShellContext = createContext<ShellState | null>(null);
const useShell = (part: string): ShellState => {
  const state = use(ShellContext);
  if (!state) throw new Error(`${part} must be inside an AppShell`);
  return state;
};

export interface AppShellProps {
  sidebar: ReactNode;
  /** The bar shown at phone width, where the sidebar collapses: the product name, say. */
  topbar?: ReactNode;
  /** Whether the collapsed sidebar is open (phone width only). */
  menuOpen?: boolean;
  onMenuToggle?: () => void;
  /** The id the skip link jumps to. */
  contentId?: string;
  /**
   * `page` (default): the shell fills the window, the sidebar sticks to it. `box`: it fills its
   * parent instead, for a shell inside a frame (a preview, a demo).
   */
  frame?: "page" | "box";
  className?: string;
  children?: ReactNode;
}

/** The root of the parts form: no `sidebar`; the children are `AppShellHeader`, `AppShellSidebar`, `AppShellMain`. */
export interface AppShellRootProps extends Part<ComponentProps<"div">> {
  sidebar?: undefined;
  topbar?: undefined;
  /** Whether the collapsed sidebar is open (phone width only), when you own it. */
  menuOpen?: boolean;
  defaultMenuOpen?: boolean;
  onMenuOpenChange?: (open: boolean) => void;
  /** Called each time the menu button is pressed. */
  onMenuToggle?: () => void;
  contentId?: string;
  frame?: "page" | "box";
}

/**
 * Sidebar on the left, content on `bg`, a skip link, and a menu button at phone width. With
 * `sidebar`: the whole shell. Without: the root of `AppShellHeader`, `AppShellSidebar` and
 * `AppShellMain`.
 */
export function AppShell(props: AppShellProps | AppShellRootProps) {
  if (props.sidebar === undefined) return <AppShellRoot {...(props as AppShellRootProps)} />;
  const { sidebar, topbar, menuOpen = false, children, ...rest } = props as AppShellProps;
  return (
    <AppShellRoot menuOpen={menuOpen} {...rest}>
      <AppShellHeader>{topbar}</AppShellHeader>
      <AppShellSidebar>{sidebar}</AppShellSidebar>
      <AppShellMain>{children}</AppShellMain>
    </AppShellRoot>
  );
}

function AppShellRoot({
  menuOpen,
  defaultMenuOpen = false,
  onMenuOpenChange,
  onMenuToggle,
  contentId = "content",
  frame = "page",
  className,
  children,
  sidebar: _sidebar,
  topbar: _topbar,
  ...rest
}: AppShellRootProps) {
  const sideId = `${useId()}-side`;
  const [open, setOpen] = useControllableState<boolean>({
    value: menuOpen,
    defaultValue: defaultMenuOpen,
    onChange: onMenuOpenChange,
  });
  const toggle = () => {
    onMenuToggle?.();
    setOpen(!open);
  };
  return (
    <ShellContext value={{ menuOpen: open, toggle, sideId, contentId }}>
      <div
        {...rest}
        className={cx(
          "fg-shell",
          frame === "box" && "fg-shell-box",
          open && "fg-shell-open",
          className,
        )}
      >
        <a className="fg-skip" href={`#${contentId}`}>
          Skip to content
        </a>
        {children}
        {open ? <div className="fg-shell-scrim" aria-hidden="true" onClick={toggle} /> : null}
      </div>
    </ShellContext>
  );
}

export interface AppShellHeaderProps extends Part<ComponentProps<"header">> {
  /** The menu button shown at phone width. Default `true`. */
  menuButton?: boolean;
}
/** The bar shown at phone width, where the sidebar collapses: the menu button, then what you put in it. */
export function AppShellHeader({
  menuButton = true,
  className,
  children,
  ...rest
}: AppShellHeaderProps) {
  const shell = useShell("AppShellHeader");
  return (
    <header {...rest} className={cx("fg-topbar", className)}>
      {menuButton ? (
        <IconButton
          icon={shell.menuOpen ? Cancel01Icon : Menu01Icon}
          label={shell.menuOpen ? "Close menu" : "Menu"}
          aria-expanded={shell.menuOpen}
          aria-controls={shell.sideId}
          onClick={shell.toggle}
        />
      ) : null}
      {children}
    </header>
  );
}

export interface AppShellSidebarProps extends Part<ComponentProps<"aside">>, AsChild {}
/** The left column; folds behind the menu button at phone width. */
export function AppShellSidebar({ asChild, className, ...rest }: AppShellSidebarProps) {
  const shell = useShell("AppShellSidebar");
  return renderPart("aside", cx("fg-shell-side", className), asChild, {
    id: shell.sideId,
    ...rest,
  });
}

export interface AppShellMainProps extends Part<ComponentProps<"div">>, AsChild {}
/** The content: the target of the skip link. */
export function AppShellMain({ asChild, className, ...rest }: AppShellMainProps) {
  const shell = useShell("AppShellMain");
  return renderPart("div", cx("fg-shell-main", className), asChild, {
    id: shell.contentId,
    tabIndex: -1,
    ...rest,
  });
}
