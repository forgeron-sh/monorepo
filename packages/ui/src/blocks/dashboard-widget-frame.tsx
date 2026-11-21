// The frame of a widget: title and subtitle, a menu of actions, and what to show while the data is
// coming (skeleton), failed (message and retry) or is not there (empty). A widget can open in a
// dialog, full size. A slot holds a drag handle for the grid.
//
// Without parts it draws the header and the content. With them, the title and the state stay in the
// root (the dialog needs them) and the layout is yours:
//
//   <WidgetFrame title="Revenue" subtitle="Last 30 days" expandable loading={loading}>
//     <WidgetFrameHeader>
//       <WidgetFrameTitles />
//       <WidgetFrameTools><WidgetFrameExpand /></WidgetFrameTools>
//     </WidgetFrameHeader>
//     <WidgetFrameContent>
//       <WidgetFrameBody><Chart /></WidgetFrameBody>
//       <WidgetFrameFooter>Legend</WidgetFrameFooter>
//     </WidgetFrameContent>
//   </WidgetFrame>

import {
  Alert02Icon,
  Maximize01Icon,
  MoreHorizontalIcon,
  Minimize02Icon,
  Refresh01Icon,
} from "@forgeron/icons";
import {
  createContext,
  createElement,
  useContext,
  useId,
  type ComponentProps,
  type ReactNode,
} from "react";
import { ActionMenu, type ActionMenuEntry } from "../action-menu";
import { Button } from "../button";
import { cx } from "../cx";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../dialog";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import { hasPart, renderPart } from "../part";
import { Skeleton, SkeletonGroup } from "../skeleton";

export interface WidgetFrameProps extends Omit<ComponentProps<"section">, "className" | "title"> {
  title: ReactNode;
  /** One line under the title: the period, the source. */
  subtitle?: ReactNode;
  /** The level of the title among the headings of the page. Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** Before the title: the grip a grid drags the widget by. */
  dragHandle?: ReactNode;
  /** Controls before the menu: a period switch, a link. */
  actions?: ReactNode;
  /** The rows of the "…" menu; with none, no menu. */
  menu?: ReadonlyArray<ActionMenuEntry>;
  onMenuSelect?: (id: string) => void;
  /** Shows a button that opens the widget full size in a dialog. */
  expandable?: boolean;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** Shows skeletons in place of the content, announced as loading. */
  loading?: boolean;
  /** Shows a message and a retry button in place of the content; `true` for the default message. */
  error?: ReactNode;
  onRetry?: () => void;
  /** There is nothing to show for these filters. */
  empty?: boolean;
  emptyText?: ReactNode;
  /** Under the content: a legend, a link to the detail. */
  footer?: ReactNode;
  className?: string;
  asChild?: boolean;
  /** The content; or, with the parts, the whole layout. */
  children?: ReactNode;
}

interface WidgetFrameContext {
  titleId: string;
  title: ReactNode;
  subtitle: ReactNode;
  headingLevel: 2 | 3 | 4;
  dragHandle: ReactNode;
  actions: ReactNode;
  menu: ReadonlyArray<ActionMenuEntry> | undefined;
  onMenuSelect: ((id: string) => void) | undefined;
  expandable: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  loading: boolean | undefined;
  error: ReactNode;
  onRetry: (() => void) | undefined;
  empty: boolean | undefined;
  emptyText: ReactNode;
  footer: ReactNode;
}

const Ctx = createContext<WidgetFrameContext | null>(null);

/** The frame a part is in: its title, its state, whether it is open full size. */
export function useWidgetFrame(part = "useWidgetFrame"): WidgetFrameContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error(`<${part}> goes inside a <WidgetFrame>.`);
  return ctx;
}

/**
 * A titled box for a chart or a figure. Loading, error and empty replace the content; the menu and
 * the expand button sit in the header. Expanding opens the same content in a dialog.
 */
export function WidgetFrame({
  title,
  subtitle,
  headingLevel = 3,
  dragHandle,
  actions,
  menu,
  onMenuSelect,
  expandable = false,
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  loading,
  error,
  onRetry,
  empty,
  emptyText,
  footer,
  className,
  asChild,
  children,
  ...rest
}: WidgetFrameProps) {
  const id = useId();
  const [open, setOpen] = useControllableState({
    value: expanded,
    defaultValue: defaultExpanded,
    onChange: onExpandedChange,
  });
  const ctx: WidgetFrameContext = {
    titleId: `${id}-title`,
    title,
    subtitle,
    headingLevel,
    dragHandle,
    actions,
    menu,
    onMenuSelect,
    expandable,
    open,
    setOpen,
    loading,
    error,
    onRetry,
    empty,
    emptyText,
    footer,
  };
  const composed = hasPart(children, [
    WidgetFrameHeader,
    WidgetFrameContent,
    WidgetFrameBody,
    WidgetFrameFooter,
  ]);
  return (
    <Ctx.Provider value={ctx}>
      {renderPart(
        "section",
        cx("fg-dash-frame", open && "fg-dash-frame-open", className),
        asChild,
        {
          "data-slot": "widget-frame",
          "aria-labelledby": `${id}-title`,
          "aria-busy": loading || undefined,
          ...rest,
          children: composed ? (
            children
          ) : (
            <>
              <WidgetFrameHeader />
              <WidgetFrameContent>
                <WidgetFrameBody>{children}</WidgetFrameBody>
                <WidgetFrameFooter />
              </WidgetFrameContent>
            </>
          ),
        },
      )}
    </Ctx.Provider>
  );
}

/* ---------------------------------------------------------------- parts */

/** The head: grip, title and subtitle, tools. */
export function WidgetFrameHeader({ className, children, ...rest }: ComponentProps<"header">) {
  const { dragHandle } = useWidgetFrame("WidgetFrameHeader");
  return (
    <header
      data-slot="widget-frame-header"
      {...rest}
      className={cx("fg-dash-frame-head", className)}
    >
      {children ?? (
        <>
          {dragHandle ? <WidgetFrameGrip /> : null}
          <WidgetFrameTitles />
          <WidgetFrameTools />
        </>
      )}
    </header>
  );
}

/** Where a grid takes the widget by: the root's `dragHandle`. */
export function WidgetFrameGrip({ className, children, ...rest }: ComponentProps<"span">) {
  const { dragHandle } = useWidgetFrame("WidgetFrameGrip");
  return (
    <span data-slot="widget-frame-grip" {...rest} className={cx("fg-dash-frame-grip", className)}>
      {children ?? dragHandle}
    </span>
  );
}

/** The title and the subtitle under it. */
export function WidgetFrameTitles({ className, children, ...rest }: ComponentProps<"div">) {
  const { subtitle } = useWidgetFrame("WidgetFrameTitles");
  return (
    <div
      data-slot="widget-frame-titles"
      {...rest}
      className={cx("fg-dash-frame-titles", className)}
    >
      {children ?? (
        <>
          <WidgetFrameTitle />
          {subtitle ? <WidgetFrameSubtitle /> : null}
        </>
      )}
    </div>
  );
}

/** The title, a heading of the level the root says. */
export function WidgetFrameTitle({ className, children, ...rest }: ComponentProps<"h3">) {
  const { titleId, title, headingLevel } = useWidgetFrame("WidgetFrameTitle");
  return createElement(
    `h${headingLevel}`,
    {
      "data-slot": "widget-frame-title",
      ...rest,
      className: cx("fg-dash-frame-title", className),
      id: titleId,
    },
    children ?? title,
  );
}

/** The line under the title. */
export function WidgetFrameSubtitle({ className, children, ...rest }: ComponentProps<"p">) {
  const { subtitle } = useWidgetFrame("WidgetFrameSubtitle");
  return (
    <p data-slot="widget-frame-subtitle" {...rest} className={cx("fg-dash-frame-sub", className)}>
      {children ?? subtitle}
    </p>
  );
}

/** The controls at the end of the head: the root's `actions`, expand and the menu. */
export function WidgetFrameTools({ className, children, ...rest }: ComponentProps<"div">) {
  const { actions } = useWidgetFrame("WidgetFrameTools");
  return (
    <div data-slot="widget-frame-tools" {...rest} className={cx("fg-dash-frame-tools", className)}>
      {children ?? (
        <>
          {actions}
          <WidgetFrameExpand />
          <WidgetFrameMenu />
        </>
      )}
    </div>
  );
}

/** The button that opens the widget full size. Nothing unless the root is `expandable`. */
export function WidgetFrameExpand(props: Partial<ComponentProps<typeof IconButton>>) {
  const { expandable, open, setOpen } = useWidgetFrame("WidgetFrameExpand");
  if (!expandable) return null;
  return (
    <IconButton
      size="sm"
      data-slot="widget-frame-expand"
      icon={open ? Minimize02Icon : Maximize01Icon}
      label={open ? "Close full size" : "Open full size"}
      aria-expanded={open}
      onClick={() => setOpen(!open)}
      {...(props as object)}
    />
  );
}

/** The "…" menu of the root's `menu`. Nothing without rows. */
export function WidgetFrameMenu() {
  const { menu, onMenuSelect } = useWidgetFrame("WidgetFrameMenu");
  if (!menu || menu.length === 0) return null;
  return (
    <ActionMenu
      items={menu}
      onSelect={(item) => onMenuSelect?.(item)}
      label="Widget actions"
      align="end"
      trigger={<IconButton size="sm" icon={MoreHorizontalIcon} label="Widget actions" />}
    />
  );
}

/**
 * The body and the footer. Opened full size, they move into a dialog and a note says so where they
 * were.
 */
export function WidgetFrameContent({ children }: { children?: ReactNode }) {
  const { open, setOpen, title, subtitle } = useWidgetFrame("WidgetFrameContent");
  if (!open) return <>{children}</>;
  return (
    <>
      <div
        data-slot="widget-frame-away"
        className="fg-dash-frame-state fg-dash-frame-away"
        role="status"
      >
        <p>Open in full size</p>
      </div>
      <Dialog open onOpenChange={(next: boolean) => !next && setOpen(false)}>
        <DialogContent className="fg-dash-wide" showCloseButton>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {subtitle ? <DialogDescription>{subtitle}</DialogDescription> : null}
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    </>
  );
}

/** What the widget shows: skeletons while it loads, the error and its retry, the empty note, or the children. */
export function WidgetFrameBody({ className, children, ...rest }: ComponentProps<"div">) {
  const { loading, error, onRetry, empty, emptyText } = useWidgetFrame("WidgetFrameBody");
  let state: ReactNode;
  if (loading) {
    state = (
      <SkeletonGroup label="Loading" className="fg-dash-frame-skel">
        <Skeleton width="40%" height={20} />
        <Skeleton height={64} />
        <Skeleton width="70%" />
      </SkeletonGroup>
    );
  } else if (error) {
    state = (
      <div className="fg-dash-frame-state fg-dash-frame-error" role="alert">
        <Icon icon={Alert02Icon} size={20} variant="mono" />
        <p>{error === true ? "This widget could not load." : error}</p>
        {onRetry ? (
          <Button size="sm" onClick={onRetry}>
            <Icon icon={Refresh01Icon} size={12} variant="mono" />
            Retry
          </Button>
        ) : null}
      </div>
    );
  } else if (empty) {
    state = (
      <div className="fg-dash-frame-state fg-dash-frame-empty" role="status">
        <p>{emptyText ?? "No data for this period"}</p>
      </div>
    );
  } else state = children;
  return (
    <div data-slot="widget-frame-body" {...rest} className={cx("fg-dash-frame-body", className)}>
      {state}
    </div>
  );
}

/** Under the body: a legend, a link to the detail. The root's `footer` by default; nothing without. */
export function WidgetFrameFooter({ className, children, ...rest }: ComponentProps<"div">) {
  const { footer } = useWidgetFrame("WidgetFrameFooter");
  const content = children ?? footer;
  if (!content) return null;
  return (
    <div data-slot="widget-frame-footer" {...rest} className={cx("fg-dash-frame-foot", className)}>
      {content}
    </div>
  );
}
