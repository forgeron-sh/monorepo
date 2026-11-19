// Small pieces the administration blocks share: the confirmation of a destructive action and the
// mark of a state. Not exported from the package.

import type { ReactNode } from "react";
import { Button } from "../button";
import { Dialog } from "../dialog";

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
  return (
    <Dialog
      title={title}
      {...(description ? { description } : {})}
      onClose={onCancel}
      className="fg-adm-confirm"
      footer={
        <>
          <Button data-autofocus onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={tone} disabled={busy} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  );
}
