/**
 * `playCompiled`: `play` for a page whose scenes were compiled at build time (an import of
 * `x.bp?compiled`, `@forgeron/blueprint/vite`) or are scene functions. It loads the SceneBin as
 * it is: the page ships neither the `.bp` JSON nor the format's reader and SceneBin writer.
 */
import { BlueprintError } from "../core/blocks";
import type { SceneSource } from "../core/types";
import {
  type BlueprintScene,
  createScriptScene,
  loadScene,
  type ScriptScene,
} from "../engine/scene";
import type { CompiledBlueprint } from "../format/compile";
import { fitOf, type Player, type PlayOptions, run, type SceneText } from "./player";

/** A scene of a compiled file: `{ compiled, scene }`. */
export interface CompiledSource {
  compiled: CompiledBlueprint;
  scene: string;
  /** A script layer drawn by the scene: a function whose blocks follow the scene's own. */
  script?: SceneSource;
}

const isCompiled = (s: unknown): s is CompiledSource =>
  typeof s === "object" && s !== null && "compiled" in s && "scene" in s;

/** The engine's handle of a compiled scene or a scene function, and what its overlay says. */
export function compiledScene(
  source: SceneSource | CompiledSource,
  options: PlayOptions = {},
): { scene: BlueprintScene | ScriptScene; text: SceneText | null } {
  const fit = fitOf(options);
  if (!isCompiled(source)) {
    const scene = createScriptScene(source, fit);
    if (options.cycle) scene.cycleActive(options.cycle);
    return { scene, text: null };
  }
  const compiled = source.compiled.scenes[source.scene];
  if (!compiled) throw new BlueprintError(`no scene "${source.scene}" in ${source.compiled.id}`);
  const scene = loadScene(compiled, fit);
  if (source.script) scene.script(source.script);
  return { scene, text: compiled };
}

export function playCompiled(
  canvas: HTMLCanvasElement,
  source: SceneSource | CompiledSource,
  options: PlayOptions = {},
): Player {
  const { scene, text } = compiledScene(source, options);
  return run(canvas, scene, text, options);
}
