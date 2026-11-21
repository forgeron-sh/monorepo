// shadcn's ScrollArea (D-156) on Base UI's scroll area: native scrolling, drawn scrollbars.

import { ScrollArea as Base } from "@base-ui/react/scroll-area";
import type { ComponentProps } from "react";
import { cx } from "./cx";

type Part<T> = Omit<T, "className"> & { className?: string };

export type ScrollAreaProps = Part<ComponentProps<typeof Base.Root>>;

/** A box that scrolls: give it a size (`height`, `max-height`) and children. Both bars when needed. */
export function ScrollArea({ className, children, ...rest }: ScrollAreaProps) {
  return (
    <Base.Root data-slot="scroll-area" {...rest} className={cx("fg-scroll", className)}>
      <Base.Viewport className="fg-scroll-viewport">{children}</Base.Viewport>
      <ScrollBar />
      <Base.Corner className="fg-scroll-corner" />
    </Base.Root>
  );
}

export type ScrollBarProps = Part<Omit<ComponentProps<typeof Base.Scrollbar>, "orientation">> & {
  /** Default `vertical`. Add `<ScrollBar orientation="horizontal" />` for a wide content. */
  orientation?: "vertical" | "horizontal";
};

/** A bar and its thumb. `ScrollArea` already draws the vertical one; shadcn's examples add the horizontal. */
export function ScrollBar({ orientation = "vertical", className, ...rest }: ScrollBarProps) {
  return (
    <Base.Scrollbar
      data-slot="scroll-bar"
      {...rest}
      orientation={orientation}
      className={cx("fg-scrollbar", className)}
    >
      <Base.Thumb className="fg-scroll-thumb" />
    </Base.Scrollbar>
  );
}
