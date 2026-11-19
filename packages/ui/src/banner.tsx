// A notice for the whole page (Banner), at its top or the top of a pane: a maintenance, a trial
// that ends, a failed payment. With an action, and a way to dismiss it.

import { Cancel01Icon } from "@forgeron/icons";
import type { ReactNode } from "react";
import { cx } from "./cx";
import { useDisclosure } from "./hooks/use-disclosure";
import { Icon } from "./icon";

export interface BannerProps {
  tone?: "info" | "success" | "warning" | "danger";
  title?: ReactNode;
  /** A button or link at the end: the thing to do next. */
  action?: ReactNode;
  /** Shows a dismiss button. */
  dismissible?: boolean;
  /** Whether it is shown; controlled with `onOpenChange`, or left to the banner. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Hears the dismissal (also reported by `onOpenChange(false)`). */
  onDismiss?: () => void;
  className?: string;
  children?: ReactNode;
}

const WORD = { info: "Note", success: "Done", warning: "Warning", danger: "Error" } as const;

/**
 * A full-width notice: the state in a word, the message, one action and a dismiss button. Danger
 * and warning are announced at once (`role="alert"`), the others politely.
 */
export function Banner({
  tone = "info",
  title,
  action,
  dismissible,
  open,
  defaultOpen = true,
  onOpenChange,
  onDismiss,
  className,
  children,
}: BannerProps) {
  const { open: shown, setOpen } = useDisclosure({ open, defaultOpen, onOpenChange });
  if (!shown) return null;
  return (
    <div
      className={cx("fg-banner", `fg-banner-${tone}`, className)}
      role={tone === "danger" || tone === "warning" ? "alert" : "status"}
    >
      <span className="fg-banner-mark">{WORD[tone]}</span>
      <div className="fg-banner-body">
        {title ? <strong className="fg-banner-title">{title}</strong> : null}
        {children ? <span className="fg-banner-text">{children}</span> : null}
      </div>
      {action ? <div className="fg-banner-action">{action}</div> : null}
      {dismissible ? (
        <button
          type="button"
          className="fg-banner-x"
          aria-label="Dismiss"
          onClick={() => {
            setOpen(false);
            onDismiss?.();
          }}
        >
          <Icon icon={Cancel01Icon} size={12} variant="mono" />
        </button>
      ) : null}
    </div>
  );
}
