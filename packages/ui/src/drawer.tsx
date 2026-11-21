import { Drawer as Base } from "@base-ui/react/drawer";
import { Cancel01Icon } from "@forgeron/icons";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  type ComponentProps,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { asChildProps } from "./part";
import { cx } from "./cx";
import { IconButton } from "./identity";

export interface DrawerProps extends Omit<
  HTMLAttributes<HTMLElement>,
  "title" | "className" | "children" | "onKeyDown"
> {
  title: ReactNode;
  description?: ReactNode;
  /** Escape and the close button. */
  onClose: () => void;
  /** Buttons at the foot. */
  footer?: ReactNode;
  /** Small buttons in the header, before the close button: open in full, copy a link. */
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
}

/**
 * With `title`: a panel on the side for the detail of one thing. Not modal: the page behind stays
 * readable. Focus goes in when it opens and returns to what had it when it closes; Escape closes it.
 * Render it only while open. Without `title`: the root of shadcn's parts (`DrawerTrigger`,
 * `DrawerContent`…), D-156, a modal panel that slides in from `direction` (default the bottom).
 */
export function Drawer(props: DrawerProps | DrawerRootProps) {
  return props.title !== undefined ? (
    <DrawerPanel {...(props as DrawerProps)} />
  ) : (
    <DrawerRoot {...(props as DrawerRootProps)} />
  );
}

function DrawerPanel({
  title,
  description,
  onClose,
  footer,
  actions,
  className,
  children,
  ...rest
}: DrawerProps) {
  const id = useId();
  const box = useRef<HTMLElement>(null);
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    // The panel sits in view by design: focusing it must not scroll the page under it.
    box.current?.focus({ preventScroll: true });
    return () => before?.focus?.({ preventScroll: true });
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
      data-slot="drawer"
      {...rest}
      className={cx("fg-drawer", className)}
      onKeyDown={onKeyDown}
    >
      <header className="fg-drawer-head">
        <div className="fg-drawer-titles">
          <h2 id={`${id}-title`} className="fg-drawer-title">
            {title}
          </h2>
          {description ? <p className="fg-drawer-desc">{description}</p> : null}
        </div>
        <div className="fg-drawer-actions">
          {actions}
          <IconButton icon={Cancel01Icon} label="Close" size="sm" onClick={onClose} />
        </div>
      </header>
      <div className="fg-drawer-body">{children}</div>
      {footer ? <footer className="fg-drawer-foot">{footer}</footer> : null}
    </aside>
  );
}

/* ---------------------------------------------------------------- shadcn parts (D-156) */

type Part<T> = Omit<T, "className"> & { className?: string };
type Direction = "top" | "right" | "bottom" | "left";

const SWIPE = { top: "up", right: "right", bottom: "down", left: "left" } as const;
const DirectionContext = createContext<Direction>("bottom");

/** `title` stays undefined: with a title, `Drawer` is the props-driven panel. */
export type DrawerRootProps = Omit<ComponentProps<typeof Base.Root>, "swipeDirection"> & {
  title?: undefined;
  /** The edge it slides in from. Default `bottom`. */
  direction?: Direction;
};

function DrawerRoot({ title: _title, direction = "bottom", ...props }: DrawerRootProps) {
  return (
    <DirectionContext.Provider value={direction}>
      <Base.Root {...props} swipeDirection={SWIPE[direction]} />
    </DirectionContext.Provider>
  );
}

export type DrawerTriggerProps = Part<ComponentProps<typeof Base.Trigger>> & { asChild?: boolean };

/** Opens the drawer. `asChild` draws your own element. */
export function DrawerTrigger({ asChild, children, className, ...rest }: DrawerTriggerProps) {
  return (
    <Base.Trigger
      data-slot="drawer-trigger"
      {...rest}
      className={className}
      {...asChildProps(asChild, children)}
    />
  );
}

export type DrawerCloseProps = Part<ComponentProps<typeof Base.Close>> & { asChild?: boolean };

/** Closes the drawer. */
export function DrawerClose({ asChild, children, className, ...rest }: DrawerCloseProps) {
  return (
    <Base.Close
      data-slot="drawer-close"
      {...rest}
      className={className}
      {...asChildProps(asChild, children)}
    />
  );
}

export function DrawerPortal(props: ComponentProps<typeof Base.Portal>) {
  return <Base.Portal {...props} />;
}

/** The scrim behind the drawer. */
export function DrawerOverlay({ className, ...rest }: Part<ComponentProps<typeof Base.Backdrop>>) {
  return (
    <Base.Backdrop
      data-slot="drawer-overlay"
      {...rest}
      className={cx("fg-dialog-backdrop", className)}
    />
  );
}

export type DrawerContentProps = Part<ComponentProps<typeof Base.Popup>>;

/** The panel with its scrim, in a portal. Swipe it away, or press Escape. */
export function DrawerContent({ className, children, ...rest }: DrawerContentProps) {
  const direction = useContext(DirectionContext);
  return (
    <Base.Portal>
      <Base.Backdrop className="fg-dialog-backdrop" />
      <Base.Popup
        data-slot="drawer-content"
        {...rest}
        data-side={direction}
        className={cx("fg-sheet fg-sheet-popup", className)}
      >
        {direction === "bottom" ? <span className="fg-drawer-grip" aria-hidden="true" /> : null}
        {children}
      </Base.Popup>
    </Base.Portal>
  );
}

const box =
  (slot: string, base: string) =>
  ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
    <div data-slot={slot} {...rest} className={cx(base, className)} />
  );

export const DrawerHeader = box("drawer-header", "fg-sheet-header");
export const DrawerFooter = box("drawer-footer", "fg-sheet-foot");

export function DrawerTitle({ className, ...rest }: Part<ComponentProps<typeof Base.Title>>) {
  return (
    <Base.Title data-slot="drawer-title" {...rest} className={cx("fg-dialog-title", className)} />
  );
}

export function DrawerDescription({
  className,
  ...rest
}: Part<ComponentProps<typeof Base.Description>>) {
  return (
    <Base.Description
      data-slot="drawer-description"
      {...rest}
      className={cx("fg-dialog-desc", className)}
    />
  );
}
