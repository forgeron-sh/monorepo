import {
  useEffect,
  useId,
  useRef,
  type ComponentProps,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cx } from "./cx";
import { Dialog as Base } from "@base-ui/react/dialog";
import { Cancel01Icon } from "@forgeron/icons";
import { asChildProps } from "./part";
import { Icon } from "./icon";

export interface DialogProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "title" | "className" | "children" | "onKeyDown"
> {
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
 * A modal dialog. With `title` and `onClose`: focus goes in when it opens, Tab stays inside, Escape
 * closes it and focus returns to what had it; render it only while it is open. Without `title`: the
 * root of shadcn's parts (`DialogTrigger`, `DialogContent`, `DialogHeader`…), D-156.
 */
export function Dialog(props: DialogProps | DialogRootProps) {
  return props.title !== undefined ? (
    <DialogBox {...(props as DialogProps)} />
  ) : (
    <DialogRoot {...(props as DialogRootProps)} />
  );
}

function DialogBox({
  title,
  description,
  onClose,
  footer,
  className,
  children,
  ...rest
}: DialogProps) {
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
        data-slot="dialog"
        {...rest}
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

/* ---------------------------------------------------------------- shadcn parts (D-156) */

// shadcn's Dialog parts (D-156), on Base UI (D-147): `Dialog` takes them when given no `title`.

type Part<T> = Omit<T, "className"> & { className?: string };

/** `title` stays undefined: with a title, `Dialog` is the props-driven one. */
export type DialogRootProps = ComponentProps<typeof Base.Root> & { title?: undefined };

/** The root of the composed dialog: `open`, `defaultOpen`, `onOpenChange`, `modal`. */
function DialogRoot({ title: _title, ...props }: DialogRootProps) {
  return <Base.Root {...props} />;
}

export type DialogTriggerProps = Part<ComponentProps<typeof Base.Trigger>> & { asChild?: boolean };

/** Opens the dialog. `asChild` (or `render`) draws your own element. */
export function DialogTrigger({ asChild, children, className, ...rest }: DialogTriggerProps) {
  return (
    <Base.Trigger
      data-slot="dialog-trigger"
      {...rest}
      className={className}
      {...asChildProps(asChild, children)}
    />
  );
}

export type DialogCloseProps = Part<ComponentProps<typeof Base.Close>> & { asChild?: boolean };

/** Closes the dialog. */
export function DialogClose({ asChild, children, className, ...rest }: DialogCloseProps) {
  return (
    <Base.Close
      data-slot="dialog-close"
      {...rest}
      className={className}
      {...asChildProps(asChild, children)}
    />
  );
}

export function DialogPortal(props: ComponentProps<typeof Base.Portal>) {
  return <Base.Portal {...props} />;
}

/** The scrim behind the dialog. */
export function DialogOverlay({ className, ...rest }: Part<ComponentProps<typeof Base.Backdrop>>) {
  return (
    <Base.Backdrop
      data-slot="dialog-overlay"
      {...rest}
      className={cx("fg-dialog-backdrop", className)}
    />
  );
}

/** The bare box of a dialog, without the `fg-dialog` frame: `DialogContent` and `Modal` dress it. */
export function DialogPopup({ className, ...rest }: Part<ComponentProps<typeof Base.Popup>>) {
  return <Base.Popup data-slot="dialog-popup" {...rest} className={className} />;
}

/** A scrolling layer between the scrim and the box, for a box that sits in the flow. */
export function DialogViewport({ className, ...rest }: Part<ComponentProps<typeof Base.Viewport>>) {
  return <Base.Viewport data-slot="dialog-viewport" {...rest} className={className} />;
}

export type DialogContentProps = Part<ComponentProps<typeof Base.Popup>> & {
  /** The close button in the corner. Default `true`, as in shadcn. */
  showCloseButton?: boolean;
};

/** The dialog itself, with its scrim, in a portal. Focus is trapped; Escape closes it. */
export function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...rest
}: DialogContentProps) {
  return (
    <Base.Portal>
      <Base.Backdrop className="fg-dialog-backdrop" />
      <DialogPopup
        data-slot="dialog-content"
        {...rest}
        className={cx("fg-dialog fg-dialog-popup", className)}
      >
        {children}
        {showCloseButton ? (
          <Base.Close className="fg-dialog-x" aria-label="Close">
            <Icon icon={Cancel01Icon} size={12} variant="mono" />
          </Base.Close>
        ) : null}
      </DialogPopup>
    </Base.Portal>
  );
}

const box =
  (slot: string, base: string) =>
  ({ className, ...rest }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => (
    <div data-slot={slot} {...rest} className={cx(base, className)} />
  );

/** The title and description, at the top. */
export const DialogHeader = box("dialog-header", "fg-dialog-header");
/** The buttons, at the bottom right; last one the main one. */
export const DialogFooter = box("dialog-footer", "fg-dialog-foot");

export function DialogTitle({ className, ...rest }: Part<ComponentProps<typeof Base.Title>>) {
  return (
    <Base.Title data-slot="dialog-title" {...rest} className={cx("fg-dialog-title", className)} />
  );
}

export function DialogDescription({
  className,
  ...rest
}: Part<ComponentProps<typeof Base.Description>>) {
  return (
    <Base.Description
      data-slot="dialog-description"
      {...rest}
      className={cx("fg-dialog-desc", className)}
    />
  );
}
