// Helpers for the layers drawn above or below the items, in world units: an SVG that covers the
// whole world (edges, arrows, guides) and the connection being drawn.

import type { ReactNode, SVGProps } from "react";
import type { Connection } from "../core/types";
import { useCanvasContext, useCanvasState } from "./context";

/**
 * An SVG at the world origin that draws outside its box: paths in world units. Give strokes
 * `vectorEffect="non-scaling-stroke"` to keep them 1 px at every zoom. It lets clicks through;
 * an element that wants them sets `pointer-events` and `data-canvas-interactive`.
 */
export function WorldSvg({
  children,
  className,
  ...rest
}: SVGProps<SVGSVGElement> & { children?: ReactNode }) {
  return (
    <svg
      {...rest}
      className={["fg-canvas-world-svg", className].filter(Boolean).join(" ")}
      width={1}
      height={1}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** The connect gesture while it runs, for a preview wire; null otherwise. */
export function useConnection(): Connection | null {
  const store = useCanvasContext();
  return useCanvasState(store, (s) => s.connection);
}
