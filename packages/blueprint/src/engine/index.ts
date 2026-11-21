// @forgeron/blueprint/engine: the Rust core seen from TypeScript. `runtime` loads the module and
// keeps the P2 handles (immediate mode, still scenes); `scene` is the player's side (P3): a scene
// of a `.bp` library or a scene function, one engine call per frame.
export * from "./runtime";
export {
  BlueprintScene,
  createScene,
  createScriptScene,
  FRAME_FLAGS,
  type FrameFlags,
  loadScene,
  type PlayOptions,
  type SceneInfo,
  ScriptScene,
} from "./scene";
