// @forgeron/canvas/react: the surface, its chrome and the hooks. Import the styles once:
// `import "@forgeron/canvas/styles.css"` (after `@forgeron/ui/styles.css`).

export { Canvas } from "./canvas";
export type { CanvasProps, CanvasToolApi, RenderItemState } from "./canvas";
export {
  CanvasProvider,
  useCanvas,
  useCanvasContext,
  useCanvasState,
  useCanvasStore,
} from "./context";
export type { UseCanvas } from "./context";
export { useConnection, WorldSvg } from "./layers";
export { Minimap } from "./minimap";
export { createDomRenderer } from "./renderer";
export type { CanvasRenderer, Primitive, RendererLayers, Scene, ScenePrimitive } from "./renderer";
export type { MinimapProps } from "./minimap";
export { animateViewport, prefersReducedMotion } from "./motion";
export { CanvasShortcuts, ZoomControls } from "./zoom-controls";
export type { CanvasShortcutsProps, ZoomControlsProps } from "./zoom-controls";
