// A short label on hover or focus of a control (Base UI, D-147), and shadcn's Tooltip parts (D-156):
// `Tooltip` with `content` is the props-driven one, without it the root of the parts.

import { Tooltip as Base } from "@base-ui/react/tooltip";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { asChildProps } from "./part";
import { cx } from "./cx";

export interface TooltipProps extends Omit<ComponentProps<"div">, "content" | "children"> {
  /** A few words: what the control does. Never information found nowhere else. */
  content: ReactNode;
  /** A shortcut shown after the words. */
  kbd?: string;
  side?: "top" | "bottom" | "left" | "right";
  /** The control it describes: one element that takes a ref (a Button, an IconButton). */
  children: ReactElement;
}

/**
 * With `content`: a short label on hover or focus of a control, after a short delay; not shown on
 * touch. Without: the root of shadcn's parts (`TooltipTrigger`, `TooltipContent`), D-156.
 */
export function Tooltip(props: TooltipProps | TooltipRootProps) {
  return props.content !== undefined ? (
    <TooltipLabel {...(props as TooltipProps)} />
  ) : (
    <TooltipRoot {...(props as TooltipRootProps)} />
  );
}

function TooltipLabel({ content, kbd, side = "top", children, className, ...rest }: TooltipProps) {
  return (
    <Base.Root>
      <Base.Trigger delay={400} render={children} />
      <Base.Portal>
        <Base.Positioner side={side} sideOffset={6} className="fg-pop-positioner">
          <Base.Popup
            data-slot="tooltip-content"
            {...(rest as object)}
            className={cx("fg-tooltip", className)}
          >
            {content}
            {kbd ? <kbd className="fg-tooltip-kbd">{kbd}</kbd> : null}
          </Base.Popup>
        </Base.Positioner>
      </Base.Portal>
    </Base.Root>
  );
}

type Part<T> = Omit<T, "className"> & { className?: string };

/** Shares the delay between the tooltips under it (400 ms, as ours). Optional. */
export function TooltipProvider({ delay = 400, ...rest }: ComponentProps<typeof Base.Provider>) {
  return <Base.Provider delay={delay} {...rest} />;
}

/** `content` stays undefined: with content, `Tooltip` is the props-driven one. */
export type TooltipRootProps = ComponentProps<typeof Base.Root> & { content?: undefined };

/** The root of the composed tooltip: `open`, `defaultOpen`, `onOpenChange`. */
function TooltipRoot({ content: _content, ...props }: TooltipRootProps) {
  return <Base.Root {...props} />;
}

export type TooltipTriggerProps = Part<ComponentProps<typeof Base.Trigger>> & { asChild?: boolean };

export function TooltipTrigger({ asChild, children, className, ...rest }: TooltipTriggerProps) {
  return (
    <Base.Trigger
      data-slot="tooltip-trigger"
      {...rest}
      className={className}
      {...asChildProps(asChild, children)}
    />
  );
}

export type TooltipContentProps = Part<ComponentProps<typeof Base.Popup>> & {
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
};

/** The words, in ink on the page, in a portal. */
export function TooltipContent({
  side = "top",
  sideOffset = 6,
  className,
  ...rest
}: TooltipContentProps) {
  return (
    <Base.Portal>
      <Base.Positioner className="fg-pop-positioner" side={side} sideOffset={sideOffset}>
        <Base.Popup data-slot="tooltip-content" {...rest} className={cx("fg-tooltip", className)} />
      </Base.Positioner>
    </Base.Portal>
  );
}
