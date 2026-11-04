import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "./cx";

export interface DrawerProps {
  title: ReactNode;
  description?: ReactNode;
  /** Escape and the close button. */
  onClose: () => void;
  /** Buttons at the foot. */
  footer?: ReactNode;
  className?: string;
  children?: ReactNode;
}

/**
 * A panel on the side for the detail of one thing. Not modal: the page behind stays readable. Focus goes
 * in when it opens and returns to what had it when it closes; Escape closes it. Render it only while open.
 */
export function Drawer({ title, description, onClose, footer, className, children }: DrawerProps) {
  const id = useId();
  const box = useRef<HTMLElement>(null);
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    box.current?.focus();
    return () => before?.focus?.();
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
        <div>
          <h2 id={`${id}-title`} className="fg-drawer-title">
            {title}
          </h2>
          {description ? <p className="fg-drawer-desc">{description}</p> : null}
        </div>
        <button type="button" className="fg-btn fg-btn-ghost fg-btn-sm" onClick={onClose}>
          Close
        </button>
      </header>
      <div className="fg-drawer-body">{children}</div>
      {footer ? <footer className="fg-drawer-foot">{footer}</footer> : null}
    </aside>
  );
}
