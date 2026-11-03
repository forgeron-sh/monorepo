import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "./cx";

export interface DialogProps {
  title: ReactNode;
  description?: ReactNode;
  /** Called on Escape, on a click outside and on the close button. */
  onClose: () => void;
  /** Buttons, last one the main one. */
  footer?: ReactNode;
  className?: string;
  children?: ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A modal dialog. Focus goes in when it opens, Tab stays inside, Escape closes it and focus
 * returns to what had it. Render it only while it is open.
 */
export function Dialog({ title, description, onClose, footer, className, children }: DialogProps) {
  const id = useId();
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const first = box.current?.querySelector<HTMLElement>("[data-autofocus]");
    (first ?? box.current?.querySelector<HTMLElement>(FOCUSABLE) ?? box.current)?.focus();
    return () => before?.focus?.();
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !box.current) return;
    const items = [...box.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    if (items.length === 0) return;
    const first = items[0]!;
    const last = items[items.length - 1]!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="fg-dialog-scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={description ? `${id}-desc` : undefined}
        tabIndex={-1}
        className={cx("fg-dialog", className)}
        onKeyDown={onKeyDown}
      >
        <h2 id={`${id}-title`} className="fg-dialog-title">
          {title}
        </h2>
        {description ? (
          <p id={`${id}-desc`} className="fg-dialog-desc">
            {description}
          </p>
        ) : null}
        <div className="fg-dialog-body">{children}</div>
        {footer ? <div className="fg-dialog-foot">{footer}</div> : null}
      </div>
    </div>
  );
}
