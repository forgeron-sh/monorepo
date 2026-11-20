// The frame of a widget: title and subtitle, a menu of actions, and what to show while the data is
// coming (skeleton), failed (message and retry) or is not there (empty). A widget can open in a
// dialog, full size. A slot holds a drag handle for the grid.

import {
  Alert02Icon,
  Maximize01Icon,
  MoreHorizontalIcon,
  Minimize02Icon,
  Refresh01Icon,
} from "@forgeron/icons";
import { createElement, useId, type ReactNode } from "react";
import { Button } from "../button";
import { cx } from "../cx";
import { Dialog } from "../dialog";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import { Skeleton, SkeletonGroup } from "../skeleton";
import { ActionMenu, type ActionMenuEntry } from "../action-menu";

export interface WidgetFrameProps {
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
  children?: ReactNode;
}

function Body({
  loading,
  error,
  onRetry,
  empty,
  emptyText,
  children,
}: Pick<WidgetFrameProps, "loading" | "error" | "onRetry" | "empty" | "emptyText" | "children">) {
  if (loading) {
    return (
      <SkeletonGroup label="Loading" className="fg-dash-frame-skel">
        <Skeleton width="40%" height={20} />
        <Skeleton height={64} />
        <Skeleton width="70%" />
      </SkeletonGroup>
    );
  }
  if (error) {
    return (
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
  }
  if (empty) {
    return (
      <div className="fg-dash-frame-state fg-dash-frame-empty" role="status">
        <p>{emptyText ?? "No data for this period"}</p>
      </div>
    );
  }
  return <>{children}</>;
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
  expandable,
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
  children,
}: WidgetFrameProps) {
  const id = useId();
  const [open, setOpen] = useControllableState({
    value: expanded,
    defaultValue: defaultExpanded,
    onChange: onExpandedChange,
  });
  const body = (
    <Body loading={loading} error={error} onRetry={onRetry} empty={empty} emptyText={emptyText}>
      {children}
    </Body>
  );
  return (
    <section
      className={cx("fg-dash-frame", open && "fg-dash-frame-open", className)}
      aria-labelledby={`${id}-title`}
      aria-busy={loading || undefined}
    >
      <header className="fg-dash-frame-head">
        {dragHandle ? <span className="fg-dash-frame-grip">{dragHandle}</span> : null}
        <div className="fg-dash-frame-titles">
          {createElement(
            `h${headingLevel}`,
            { className: "fg-dash-frame-title", id: `${id}-title` },
            title,
          )}
          {subtitle ? <p className="fg-dash-frame-sub">{subtitle}</p> : null}
        </div>
        <div className="fg-dash-frame-tools">
          {actions}
          {expandable ? (
            <IconButton
              size="sm"
              icon={open ? Minimize02Icon : Maximize01Icon}
              label={open ? "Close full size" : "Open full size"}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            />
          ) : null}
          {menu && menu.length > 0 ? (
            <ActionMenu
              items={menu}
              onSelect={(item) => onMenuSelect?.(item)}
              label="Widget actions"
              align="end"
              trigger={<IconButton size="sm" icon={MoreHorizontalIcon} label="Widget actions" />}
            />
          ) : null}
        </div>
      </header>
      {open ? (
        <>
          <div className="fg-dash-frame-state fg-dash-frame-away" role="status">
            <p>Open in full size</p>
          </div>
          <Dialog
            title={title}
            description={subtitle}
            onClose={() => setOpen(false)}
            className="fg-dash-wide"
          >
            <div className="fg-dash-frame-body">{body}</div>
            {footer ? <div className="fg-dash-frame-foot">{footer}</div> : null}
          </Dialog>
        </>
      ) : (
        <>
          <div className="fg-dash-frame-body">{body}</div>
          {footer ? <div className="fg-dash-frame-foot">{footer}</div> : null}
        </>
      )}
    </section>
  );
}
