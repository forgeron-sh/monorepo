// A modal over the page, whole at once (no fade): a header with its context, title and close
// button, then the content. A composite over the Dialog parts (dialog.tsx): focus trap, Escape,
// outside press and the return of focus are Base UI's Dialog.

import { Cancel01Icon } from "@forgeron/icons";
import type { ReactElement, ReactNode, RefObject } from "react";
import { cx } from "./cx";
import {
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogPopup,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  DialogViewport,
} from "./dialog";
import { Icon } from "./icon";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What the modal is: "New issue", "Rename view". Its accessible name. */
  title: ReactNode;
  /** Where it happens, before the title: a team chip, a project. */
  context?: ReactNode;
  /** A button that opens it; focus returns to it on close. */
  trigger?: ReactElement;
  /** Takes focus on open; the first field by default. */
  initialFocus?: RefObject<HTMLElement | null>;
  /** `md` (default) 750px, for a record; `sm` 480px, for a short form. */
  size?: "sm" | "md";
  children: ReactNode;
  className?: string;
}

/**
 * A modal over the page, whole at once (no fade): a header with its context, title and close
 * button, then the content. Escape and a press outside close it; focus stays inside.
 */
export function Modal({
  open,
  onOpenChange,
  title,
  context,
  trigger,
  initialFocus,
  size = "md",
  children,
  className,
}: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => onOpenChange(next)}>
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogPortal>
        <DialogOverlay className="fg-modal-backdrop" />
        <DialogViewport className="fg-modal-viewport">
          <DialogPopup
            className={cx("fg-modal", size === "sm" && "fg-modal-sm", className)}
            {...(initialFocus ? { initialFocus } : {})}
          >
            <div className="fg-modal-head">
              {context ? (
                <>
                  {context}
                  <span className="fg-modal-sep" aria-hidden="true">
                    ›
                  </span>
                </>
              ) : null}
              <DialogTitle className="fg-modal-title">{title}</DialogTitle>
              <DialogClose className="fg-iconbtn fg-iconbtn-sm fg-modal-close" aria-label="Close">
                <Icon icon={Cancel01Icon} size={12} variant="mono" />
              </DialogClose>
            </div>
            {children}
          </DialogPopup>
        </DialogViewport>
      </DialogPortal>
    </Dialog>
  );
}
