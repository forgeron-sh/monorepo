// @forgeron/blueprint-canvas: Blueprint scenes on @forgeron/canvas (docs/blueprint/engine.md, P5).
// A scene is an item kind and a layer, never the canvas's renderer: `blueprintKind` and
// `<BlueprintLayer>` (with its `BlueprintStage`), and the viewer built on them. Canvas never imports
// Blueprint (`canvas-does-not-import-blueprint`). Import the styles once:
// `import "@forgeron/blueprint-canvas/styles.css"` (after the ui and canvas styles).

export { type Compositor, createCompositor, type Picture, type Placement } from "./compositor";
export {
  type LibraryEntry,
  type OpenedFile,
  openBlueprint,
  type Outline,
  type OutlineScene,
  outlineOf,
  scrubLength,
} from "./document";
export {
  BLUEPRINT_KIND,
  type BlueprintItemData,
  blueprintItem,
  blueprintKind,
  type Depth,
  isBlueprintItem,
  turn,
  VIEWS,
} from "./kind";
export { BlueprintLayer, type BlueprintLayerProps } from "./layer";
export { DepthReview, type DepthReviewProps, renderStill, type Still } from "./review";
export { DEFAULT_FILL, previewScene, SceneCache, sceneOf, withView } from "./scenes";
export {
  BlueprintStage,
  DEFAULT_STEPS,
  type Frames,
  type HoverHit,
  type StageOptions,
  type StageStats,
} from "./stage";
export { BlueprintViewer, type BlueprintViewerProps } from "./viewer";
