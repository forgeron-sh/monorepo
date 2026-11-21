// A modal over the page, whole at once (no fade): a header with its context, title and close
// button, then the content. A preset over the Dialog parts (dialog.tsx): focus trap, Escape,
// outside press and the return of focus are Base UI's Dialog. Without `title`, `Modal` is the root
// of its own parts (`ModalContent`, `ModalHeader`, `ModalContext`, `ModalTitle`, `ModalClose`), and
// `DialogTrigger` opens it.

import { Cancel01Icon } from "@forgeron/icons";
import type { ComponentProps, HTMLAttributes, ReactElement, ReactNode, RefObject } from "react";
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
  type DialogCloseProps,
  type DialogRootProps,
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

/** `title` stays undefined: with a title, `Modal` is the props-driven one. */
export type ModalRootProps = DialogRootProps;

/**
 * With `title`: a modal over the page, whole at once (no fade): a header with its context, title
 * and close button, then the content. Escape and a press outside close it; focus stays inside.
 * Without `title`: the root of the Modal parts (`open`, `defaultOpen`, `onOpenChange`).
 */
export function Modal(props: ModalProps | ModalRootProps) {
  if (props.title === undefined) return <Dialog {...(props as ModalRootProps)} />;
  return <ModalPreset {...(props as ModalProps)} />;
}

export type ModalContentProps = Omit<ComponentProps<typeof DialogPopup>, "className"> & {
  className?: string;
  /** `md` (default) 750px; `sm` 480px. */
  size?: "sm" | "md";
};

/** The modal itself with its scrim, in a portal. */
export function ModalContent({ size = "md", className, ...rest }: ModalContentProps) {
  return (
    <DialogPortal>
      <DialogOverlay className="fg-modal-backdrop" />
      <DialogViewport className="fg-modal-viewport">
        <DialogPopup
          {...rest}
          className={cx("fg-modal", size === "sm" && "fg-modal-sm", className)}
        />
      </DialogViewport>
    </DialogPortal>
  );
}

/** The top row: context, title, then the close button at the end. */
export function ModalHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={cx("fg-modal-head", className)} />;
}

/** Where it happens, before the title: a team chip, a project; followed by a ›. */
export function ModalContext({ children }: { children?: ReactNode }) {
  return (
    <>
      {children}
      <span className="fg-modal-sep" aria-hidden="true">
        ›
      </span>
    </>
  );
}

/** The modal's accessible name. */
export function ModalTitle({ className, ...rest }: ComponentProps<typeof DialogTitle>) {
  return <DialogTitle {...rest} className={cx("fg-modal-title", className)} />;
}

/** The close button; a pixel cross unless given children. */
export function ModalClose({ className, children, ...rest }: DialogCloseProps) {
  return (
    <DialogClose
      aria-label="Close"
      {...rest}
      className={cx("fg-iconbtn fg-iconbtn-sm fg-modal-close", className)}
    >
      {children ?? <Icon icon={Cancel01Icon} size={12} variant="mono" />}
    </DialogClose>
  );
}

function ModalPreset({
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
      <ModalContent
        size={size}
        {...(className ? { className } : {})}
        {...(initialFocus ? { initialFocus } : {})}
      >
        <ModalHeader>
          {context ? <ModalContext>{context}</ModalContext> : null}
          <ModalTitle>{title}</ModalTitle>
          <ModalClose />
        </ModalHeader>
        {children}
      </ModalContent>
    </Dialog>
  );
}
