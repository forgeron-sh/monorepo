// A panel that opens from a button and holds anything: a form, a few settings, a preview. Base UI
// gives it focus handling, Escape, click outside and placement (D-147); the frame is ours.

import { Popover as Base } from "@base-ui/react/popover";
import { Cancel01Icon } from "@forgeron/icons";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { cx } from "./cx";
import { useDisclosure } from "./hooks/use-disclosure";
import { Icon } from "./icon";
import { asChildProps } from "./part";

export interface PopoverProps extends Omit<
  ComponentProps<"div">,
  "title" | "children" | "className" | "onChange"
> {
  /** The control that opens it: one element that takes a ref (a Button, an IconButton, a chip). */
  trigger: ReactElement;
  /** Names the panel for assistive technology, and is its heading when `title` is not given. */
  label: string;
  /** A heading inside the panel. */
  title?: ReactNode;
  /** One line under the heading. */
  description?: ReactNode;
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  /** Width in px; the content's own, up to 360, by default. */
  width?: number;
  /** A close button in the corner. Default `false`: Escape and a click outside close it. */
  showClose?: boolean;
  /**
   * `false` (default): the page stays usable. `true`: the page behind is locked while it is open.
   * `"trap-focus"`: Tab stays inside.
   */
  modal?: boolean | "trap-focus";
  className?: string;
}

/**
 * With `trigger`: a panel that opens from a button, any content, with an optional heading and close
 * button. Without: the root of shadcn's parts (`PopoverTrigger`, `PopoverContent`…), D-156.
 */
export function Popover(props: PopoverProps | PopoverRootProps) {
  return props.trigger !== undefined ? <PopoverPanel {...props} /> : <PopoverRoot {...props} />;
}

function PopoverPanel({
  trigger,
  label,
  title,
  description,
  children,
  open: openProp,
  defaultOpen,
  onOpenChange,
  side = "bottom",
  align = "start",
  width,
  showClose,
  modal = false,
  className,
  ...rest
}: PopoverProps) {
  const { open, setOpen } = useDisclosure({
    open: openProp,
    onOpenChange,
    ...(defaultOpen !== undefined ? { defaultOpen } : {}),
  });
  return (
    <Base.Root open={open} onOpenChange={setOpen} modal={modal}>
      <Base.Trigger render={trigger} />
      <Base.Portal>
        <Base.Positioner className="fg-pop-positioner" side={side} align={align} sideOffset={6}>
          <Base.Popup
            data-slot="popover-content"
            {...(rest as object)}
            className={cx("fg-pop fg-popover", className)}
            aria-label={title ? undefined : label}
            style={width ? { width, maxWidth: "none" } : undefined}
          >
            {title || showClose ? (
              <div className="fg-popover-head">
                {title ? <Base.Title className="fg-popover-title">{title}</Base.Title> : <span />}
                {showClose ? (
                  <Base.Close className="fg-popover-x" aria-label={`Close ${label}`}>
                    <Icon icon={Cancel01Icon} size={12} variant="mono" />
                  </Base.Close>
                ) : null}
              </div>
            ) : null}
            {description ? (
              <Base.Description className="fg-popover-desc">{description}</Base.Description>
            ) : null}
            <div className="fg-popover-body">{children}</div>
          </Base.Popup>
        </Base.Positioner>
      </Base.Portal>
    </Base.Root>
  );
}

/* ---------------------------------------------------------------- shadcn parts (D-156) */

// shadcn's Popover parts (D-156), on Base UI (D-147): `Popover` takes them when given no `trigger`.

type Part<T> = Omit<T, "className"> & { className?: string };

/** `trigger` stays undefined: with a trigger, `Popover` is the props-driven one. */
export type PopoverRootProps = Omit<ComponentProps<typeof Base.Root>, "onOpenChange"> & {
  trigger?: undefined;
  onOpenChange?: (open: boolean) => void;
};

/** The root of the composed popover: `open`, `defaultOpen`, `onOpenChange`, `modal`. */
function PopoverRoot({ trigger: _trigger, onOpenChange, ...props }: PopoverRootProps) {
  return (
    <Base.Root
      {...props}
      {...(onOpenChange ? { onOpenChange: (open: boolean) => onOpenChange(open) } : {})}
    />
  );
}

export type PopoverTriggerProps = Part<ComponentProps<typeof Base.Trigger>> & { asChild?: boolean };

export function PopoverTrigger({ asChild, children, className, ...rest }: PopoverTriggerProps) {
  return (
    <Base.Trigger
      data-slot="popover-trigger"
      {...rest}
      className={className}
      {...asChildProps(asChild, children)}
    />
  );
}

export type PopoverContentProps = Part<ComponentProps<typeof Base.Popup>> & {
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  /**
   * What the panel is placed against instead of its trigger: an element, a ref to one, or a virtual
   * element (`{ getBoundingClientRect }`), passed to Base UI's Positioner.
   */
  anchor?: ComponentProps<typeof Base.Positioner>["anchor"];
};

/** The panel, in a portal, placed by the trigger (or by `anchor`). */
export function PopoverContent({
  side = "bottom",
  align = "center",
  sideOffset = 6,
  anchor,
  className,
  children,
  ...rest
}: PopoverContentProps) {
  return (
    <Base.Portal>
      <Base.Positioner
        className="fg-pop-positioner"
        side={side}
        align={align}
        sideOffset={sideOffset}
        {...(anchor !== undefined ? { anchor } : {})}
      >
        <Base.Popup
          data-slot="popover-content"
          {...rest}
          className={cx("fg-pop fg-popover", className)}
        >
          <div className="fg-popover-body">{children}</div>
        </Base.Popup>
      </Base.Positioner>
    </Base.Portal>
  );
}

/** The arrow of the panel, pointing at the trigger or the anchor; place it inside `PopoverContent`. */
export function PopoverArrow({ className, ...rest }: Part<ComponentProps<typeof Base.Arrow>>) {
  return (
    <Base.Arrow data-slot="popover-arrow" {...rest} className={cx("fg-popover-arrow", className)} />
  );
}

export function PopoverTitle({ className, ...rest }: Part<ComponentProps<typeof Base.Title>>) {
  return (
    <Base.Title data-slot="popover-title" {...rest} className={cx("fg-popover-title", className)} />
  );
}

export function PopoverDescription({
  className,
  ...rest
}: Part<ComponentProps<typeof Base.Description>>) {
  return (
    <Base.Description
      data-slot="popover-description"
      {...rest}
      className={cx("fg-popover-desc", className)}
    />
  );
}

export type PopoverCloseProps = Part<ComponentProps<typeof Base.Close>> & { asChild?: boolean };

export function PopoverClose({ asChild, children, className, ...rest }: PopoverCloseProps) {
  return (
    <Base.Close
      data-slot="popover-close"
      {...rest}
      className={className}
      {...asChildProps(asChild, children)}
    />
  );
}
