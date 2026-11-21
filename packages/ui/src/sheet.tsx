// shadcn's Sheet (D-156): a panel that slides in from an edge, on Base UI's dialog (D-147).

import { Dialog as Base } from "@base-ui/react/dialog";
import { Cancel01Icon } from "@forgeron/icons";
import type { ComponentProps, HTMLAttributes } from "react";
import { asChildProps } from "./part";
import { cx } from "./cx";
import { Icon } from "./icon";

type Part<T> = Omit<T, "className"> & { className?: string };

/** The root: `open`, `defaultOpen`, `onOpenChange`, `modal`. */
export function Sheet(props: ComponentProps<typeof Base.Root>) {
  return <Base.Root {...props} />;
}

export type SheetTriggerProps = Part<ComponentProps<typeof Base.Trigger>> & { asChild?: boolean };

export function SheetTrigger({ asChild, children, className, ...rest }: SheetTriggerProps) {
  return (
    <Base.Trigger
      data-slot="sheet-trigger"
      {...rest}
      className={className}
      {...asChildProps(asChild, children)}
    />
  );
}

export type SheetCloseProps = Part<ComponentProps<typeof Base.Close>> & { asChild?: boolean };

export function SheetClose({ asChild, children, className, ...rest }: SheetCloseProps) {
  return (
    <Base.Close
      data-slot="sheet-close"
      {...rest}
      className={className}
      {...asChildProps(asChild, children)}
    />
  );
}

export type SheetContentProps = Part<ComponentProps<typeof Base.Popup>> & {
  /** The edge it slides in from. Default `right`. */
  side?: "top" | "right" | "bottom" | "left";
  /** The close button in the corner. Default `true`, as in shadcn. */
  showCloseButton?: boolean;
};

/** The panel with its scrim, in a portal. Focus is trapped; Escape closes it. */
export function SheetContent({
  side = "right",
  showCloseButton = true,
  className,
  children,
  ...rest
}: SheetContentProps) {
  return (
    <Base.Portal>
      <Base.Backdrop className="fg-dialog-backdrop" />
      <Base.Popup
        data-slot="sheet-content"
        {...rest}
        data-side={side}
        className={cx("fg-sheet fg-sheet-popup", className)}
      >
        {children}
        {showCloseButton ? (
          <Base.Close className="fg-dialog-x" aria-label="Close">
            <Icon icon={Cancel01Icon} size={12} variant="mono" />
          </Base.Close>
        ) : null}
      </Base.Popup>
    </Base.Portal>
  );
}

export function SheetHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="sheet-header" {...rest} className={cx("fg-sheet-header", className)} />;
}

export function SheetFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="sheet-footer" {...rest} className={cx("fg-sheet-foot", className)} />;
}

export function SheetTitle({ className, ...rest }: Part<ComponentProps<typeof Base.Title>>) {
  return (
    <Base.Title data-slot="sheet-title" {...rest} className={cx("fg-dialog-title", className)} />
  );
}

export function SheetDescription({
  className,
  ...rest
}: Part<ComponentProps<typeof Base.Description>>) {
  return (
    <Base.Description
      data-slot="sheet-description"
      {...rest}
      className={cx("fg-dialog-desc", className)}
    />
  );
}
