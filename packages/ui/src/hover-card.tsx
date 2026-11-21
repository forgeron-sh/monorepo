// shadcn's HoverCard (D-156) on Base UI's preview card: a panel that opens when the pointer rests on
// a link (or the link takes focus), for a glance at what it points to.

import { PreviewCard as Base } from "@base-ui/react/preview-card";
import { createContext, useContext, type ComponentProps } from "react";
import { asChildProps } from "./part";
import { cx } from "./cx";

type Part<T> = Omit<T, "className"> & { className?: string };

const Delays = createContext<{ openDelay?: number; closeDelay?: number }>({});

export type HoverCardProps = Omit<ComponentProps<typeof Base.Root>, "onOpenChange"> & {
  /** Milliseconds before it opens. Default 700, as in shadcn. */
  openDelay?: number;
  /** Milliseconds before it closes. Default 300. */
  closeDelay?: number;
  onOpenChange?: (open: boolean) => void;
};

/** The root: `open`, `defaultOpen`, `onOpenChange`, `openDelay`, `closeDelay`. */
export function HoverCard({ openDelay, closeDelay, onOpenChange, ...rest }: HoverCardProps) {
  const delays: { openDelay?: number; closeDelay?: number } = {};
  if (openDelay !== undefined) delays.openDelay = openDelay;
  if (closeDelay !== undefined) delays.closeDelay = closeDelay;
  return (
    <Delays.Provider value={delays}>
      <Base.Root
        {...rest}
        {...(onOpenChange ? { onOpenChange: (open: boolean) => onOpenChange(open) } : {})}
      />
    </Delays.Provider>
  );
}

export type HoverCardTriggerProps = Part<ComponentProps<typeof Base.Trigger>> & {
  asChild?: boolean;
};

/** What the pointer rests on. A link by default; `asChild` draws your own element. */
export function HoverCardTrigger({ asChild, children, className, ...rest }: HoverCardTriggerProps) {
  const { openDelay, closeDelay } = useContext(Delays);
  return (
    <Base.Trigger
      delay={openDelay ?? 700}
      closeDelay={closeDelay ?? 300}
      data-slot="hover-card-trigger"
      {...rest}
      className={className}
      {...asChildProps(asChild, children)}
    />
  );
}

export type HoverCardContentProps = Part<ComponentProps<typeof Base.Popup>> & {
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  sideOffset?: number;
};

/** The card, in a portal, placed by the trigger. */
export function HoverCardContent({
  side = "bottom",
  align = "center",
  sideOffset = 4,
  className,
  ...rest
}: HoverCardContentProps) {
  return (
    <Base.Portal>
      <Base.Positioner
        className="fg-pop-positioner"
        side={side}
        align={align}
        sideOffset={sideOffset}
      >
        <Base.Popup
          data-slot="hover-card-content"
          {...rest}
          className={cx("fg-pop fg-hover-card", className)}
        />
      </Base.Positioner>
    </Base.Portal>
  );
}
