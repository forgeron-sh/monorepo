// Small pieces the administration blocks share: the confirmation of a destructive action and the
// mark of a state. Not exported from the package.

import { useRef, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "../alert-dialog";
import { Button } from "../button";

export interface AdminConfirmProps {
  title: ReactNode;
  description?: ReactNode;
  /** The verb on the button: "Revoke", "Delete forever". */
  confirmLabel: string;
  cancelLabel?: string;
  /** `danger` (default) outlines the button in red. */
  tone?: "danger" | "primary";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}

/** A modal that asks once before something that cannot be undone. Focus starts on Cancel. */
export function AdminConfirm({
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "danger",
  busy,
  onConfirm,
  onCancel,
  children,
}: AdminConfirmProps) {
  const cancel = useRef<HTMLButtonElement>(null);
  return (
    <AlertDialog open onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="fg-adm-confirm" initialFocus={cancel}>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
        {children ? <div className="fg-dialog-body">{children}</div> : null}
        <AlertDialogFooter>
          <AlertDialogCancel ref={cancel}>{cancelLabel}</AlertDialogCancel>
          <Button variant={tone} disabled={busy} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
