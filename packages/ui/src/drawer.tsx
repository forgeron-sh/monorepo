import { Cancel01Icon } from "@forgeron/icons";
import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "./cx";
import { IconButton } from "./identity";

export interface DrawerProps {
  title: ReactNode;
  description?: ReactNode;
  /** Escape and the close button. */
  onClose: () => void;
  /** Buttons at the foot. */
  footer?: ReactNode;
  /** Small buttons in the header, before the close button: open in full, copy a link. */
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
}

/**
 * A panel on the side for the detail of one thing. Not modal: the page behind stays readable. Focus goes
 * in when it opens and returns to what had it when it closes; Escape closes it. Render it only while open.
 */
export function Drawer({
  title,
  description,
  onClose,
  footer,
  actions,
  className,
  children,
}: DrawerProps) {
  const id = useId();
  const box = useRef<HTMLElement>(null);
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    // The panel sits in view by design: focusing it must not scroll the page under it.
    box.current?.focus({ preventScroll: true });
    return () => before?.focus?.({ preventScroll: true });
  }, []);
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
    }
  };
  return (
    <aside
      ref={box}
      role="complementary"
      aria-labelledby={`${id}-title`}
      tabIndex={-1}
      className={cx("fg-drawer", className)}
      onKeyDown={onKeyDown}
    >
      <header className="fg-drawer-head">
        <div className="fg-drawer-titles">
          <h2 id={`${id}-title`} className="fg-drawer-title">
            {title}
          </h2>
          {description ? <p className="fg-drawer-desc">{description}</p> : null}
        </div>
        <div className="fg-drawer-actions">
          {actions}
          <IconButton icon={Cancel01Icon} label="Close" size="sm" onClick={onClose} />
        </div>
      </header>
      <div className="fg-drawer-body">{children}</div>
      {footer ? <footer className="fg-drawer-foot">{footer}</footer> : null}
    </aside>
  );
}
