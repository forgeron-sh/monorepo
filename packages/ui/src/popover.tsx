// A panel that opens from a button and holds anything: a form, a few settings, a preview. Base UI
// gives it focus handling, Escape, click outside and placement (D-147); the frame is ours.

import { Popover as Base } from "@base-ui/react/popover";
import { Cancel01Icon } from "@forgeron/icons";
import type { ReactElement, ReactNode } from "react";
import { cx } from "./cx";
import { useDisclosure } from "./hooks/use-disclosure";
import { Icon } from "./icon";

export interface PopoverProps {
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

/** A panel that opens from a button: any content, with an optional heading and close button. */
export function Popover({
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
