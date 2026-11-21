// A panel fixed to a point of the page (the caret, a selection), in the body so no overflow
// clips it. It opens below the point, or above when there is no room, and stays in the viewport.

import { type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cx } from "./cx";

export interface FloatingProps {
  /** The box to stay next to, in viewport pixels. */
  rect: { left: number; right: number; top: number; bottom: number };
  placement?: "below" | "above";
  className?: string;
  children: ReactNode;
  /** Role and name of the panel for assistive technology. */
  role?: string;
  label?: string;
  /** Keeps the editor's focus when the panel is clicked (a menu does; a field does not). */
  keepFocus?: boolean;
}

const GAP = 6;
const EDGE = 8;

/** Where a panel of `size` goes next to `rect` inside a viewport: flipped and clamped. Pure. */
export function placePanel(
  rect: FloatingProps["rect"],
  size: { width: number; height: number },
  viewport: { width: number; height: number },
  placement: "below" | "above" = "below",
): { left: number; top: number } {
  const below = rect.bottom + GAP;
  const above = rect.top - GAP - size.height;
  const fitsBelow = below + size.height <= viewport.height - EDGE;
  const fitsAbove = above >= EDGE;
  let top =
    placement === "below"
      ? fitsBelow || !fitsAbove
        ? below
        : above
      : fitsAbove || !fitsBelow
        ? above
        : below;
  top = Math.max(EDGE, Math.min(top, viewport.height - size.height - EDGE));
  const left = Math.max(EDGE, Math.min(rect.left, viewport.width - size.width - EDGE));
  return { left, top };
}

export function Floating({
  rect,
  placement = "below",
  className,
  children,
  role,
  label,
  keepFocus = true,
}: FloatingProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { left, right, top, bottom } = rect;
  const [pos, setPos] = useState({ left, top: bottom + GAP });
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const next = placePanel(
      { left, right, top, bottom },
      { width: node.offsetWidth, height: node.offsetHeight },
      { width: window.innerWidth, height: window.innerHeight },
      placement,
    );
    // The same place is not a new state: the panel measures itself again on every render.
    setPos((now) => (now.left === next.left && now.top === next.top ? now : next));
  }, [left, right, top, bottom, placement, children]);
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      ref={ref}
      role={role}
      aria-label={label}
      className={cx("fg-rt-float", className)}
      style={{ left: pos.left, top: pos.top }}
      onMouseDown={keepFocus ? (e) => e.preventDefault() : undefined}
    >
      {children}
    </div>,
    document.body,
  );
}
