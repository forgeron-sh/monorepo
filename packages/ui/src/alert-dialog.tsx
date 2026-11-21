// shadcn's AlertDialog (D-156): a modal that asks to confirm, on Base UI's alert dialog (D-147).
// It does not close on a click outside; the look is the dialog's.

import { AlertDialog as Base } from "@base-ui/react/alert-dialog";
import type { ComponentProps, HTMLAttributes } from "react";
import { asChildProps } from "./part";
import { cx } from "./cx";

type Part<T> = Omit<T, "className"> & { className?: string };

/** The root: `open`, `defaultOpen`, `onOpenChange`. */
export function AlertDialog(props: ComponentProps<typeof Base.Root>) {
  return <Base.Root {...props} />;
}

export type AlertDialogTriggerProps = Part<ComponentProps<typeof Base.Trigger>> & {
  asChild?: boolean;
};

export function AlertDialogTrigger({
  asChild,
  children,
  className,
  ...rest
}: AlertDialogTriggerProps) {
  return (
    <Base.Trigger
      data-slot="alert-dialog-trigger"
      {...rest}
      className={className}
      {...asChildProps(asChild, children)}
    />
  );
}

/** The dialog with its scrim, in a portal. Focus is trapped; Escape cancels. */
export function AlertDialogContent({
  className,
  ...rest
}: Part<ComponentProps<typeof Base.Popup>>) {
  return (
    <Base.Portal>
      <Base.Backdrop className="fg-dialog-backdrop" />
      <Base.Popup
        data-slot="alert-dialog-content"
        {...rest}
        className={cx("fg-dialog fg-dialog-popup", className)}
      />
    </Base.Portal>
  );
}

export function AlertDialogHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-slot="alert-dialog-header" {...rest} className={cx("fg-dialog-header", className)} />
  );
}

export function AlertDialogFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-slot="alert-dialog-footer" {...rest} className={cx("fg-dialog-foot", className)} />
  );
}

export function AlertDialogTitle({ className, ...rest }: Part<ComponentProps<typeof Base.Title>>) {
  return (
    <Base.Title
      data-slot="alert-dialog-title"
      {...rest}
      className={cx("fg-dialog-title", className)}
    />
  );
}

export function AlertDialogDescription({
  className,
  ...rest
}: Part<ComponentProps<typeof Base.Description>>) {
  return (
    <Base.Description
      data-slot="alert-dialog-description"
      {...rest}
      className={cx("fg-dialog-desc", className)}
    />
  );
}

export type AlertDialogButtonProps = Part<ComponentProps<typeof Base.Close>> & {
  asChild?: boolean;
};

/** The confirming button: closes the dialog, drawn as the primary button. */
export function AlertDialogAction({
  asChild,
  children,
  className,
  ...rest
}: AlertDialogButtonProps) {
  return (
    <Base.Close
      data-slot="alert-dialog-action"
      {...rest}
      className={cx("fg-btn fg-btn-primary", className)}
      {...asChildProps(asChild, children)}
    />
  );
}

/** The cancelling button: closes the dialog, drawn as the outlined button. */
export function AlertDialogCancel({
  asChild,
  children,
  className,
  ...rest
}: AlertDialogButtonProps) {
  return (
    <Base.Close
      data-slot="alert-dialog-cancel"
      {...rest}
      className={cx("fg-btn fg-btn-secondary", className)}
      {...asChildProps(asChild, children)}
    />
  );
}
