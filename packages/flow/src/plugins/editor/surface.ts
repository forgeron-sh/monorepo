// What the editor halves share about the surface they draw on: finding it from an element, a
// client point in world units, giving it the focus, and the path an edge style draws.

import { screenToWorld, type Point } from "@forgeron/canvas";
import { straightPath, type EdgePath } from "../../core/geometry";
import type { Registry } from "../../core/plugin";
import type { FlowApi } from "../../react/use-flow";

function surfaceOf(el: Element) {
  return el.closest<HTMLElement>(".fg-canvas");
}

export function worldAt<D>(flow: FlowApi<D>, el: Element, clientX: number, clientY: number): Point {
  const root = surfaceOf(el);
  const r = root?.getBoundingClientRect() ?? { left: 0, top: 0 };
  return screenToWorld(flow.store.getState().viewport, { x: clientX - r.left, y: clientY - r.top });
}

export function focusSurface(el: Element) {
  const root = surfaceOf(el);
  if (!root) return;
  root.dataset.pointer = "";
  root.focus({ preventScroll: true });
}

/**
 * The path of an edge style: the plugin's own, else the first style a plugin brings, else a
 * straight line (an editor with no edge style plugin still draws its edges).
 */
export function pathOf(core: Registry, style: string): EdgePath {
  return core.edgeStyle(style)?.path ?? core.edgeStyles[0]?.spec.path ?? straightPath;
}
