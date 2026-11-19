/**
 * `play`: a scene on a canvas, on the engine (docs/blueprint/engine.md §3). The scene is a
 * `.bp` scene (`{ lib, scene }`, or `{ compiled, scene }` compiled at build time) or a scene
 * function or block list (the script layer); the loop calls the engine once per frame and hands
 * the result to a presenter: the 2D canvas by default, WebGL2 on request (at most four per page,
 * the 2D presenter beyond). It keeps `mount`'s behaviour: refit on resize, frames only while on
 * screen, the clock held at 0 under `prefers-reduced-motion` (scroll and hover still change the
 * picture), colours from the CSS tokens on the canvas at mount and on each resize.
 *
 * A data scene may carry a script layer (`script`): its vars, machines and camera are the file's,
 * its pixels a scene function's (the site's scroll and hover scenes, P4). While the canvas is off
 * screen, `set` on a scene with machines draws one frame at once, so that `on("state")` follows
 * the host's inputs (a page reading its camera shot from the state) without the loop running.
 *
 * A page that only plays compiled scenes uses `playCompiled` (`play-compiled.ts`): the same loop
 * without the reader and the SceneBin writer that `{ lib }` needs.
 */
import type { SceneSource } from "../core/types";
import { createScene } from "../engine/scene";
import { labelsOf } from "../format/compile";
import type { Library } from "../format/read";
import { type CompiledSource, playCompiled } from "./play-compiled";
import { fitOf, type Player, type PlayOptions, run } from "./player";

/** A data scene: a scene of a library read by `readBlueprint`. */
export interface DataSource {
  lib: Library;
  scene: string;
  /** A script layer drawn by the scene: a function whose blocks follow the scene's own. */
  script?: SceneSource;
}

const isData = (s: SceneSource | DataSource | CompiledSource): s is DataSource =>
  typeof s === "object" && s !== null && "lib" in s && "scene" in s;

export function play(
  canvas: HTMLCanvasElement,
  source: SceneSource | DataSource | CompiledSource,
  options: PlayOptions = {},
): Player {
  if (!isData(source)) return playCompiled(canvas, source, options);
  const scene = createScene(source.lib, source.scene, fitOf(options));
  if (source.script) scene.script(source.script);
  const s = source.lib.scenes.get(source.scene);
  return run(
    canvas,
    scene,
    { title: s?.title, description: s?.description, labels: labelsOf(source.lib) },
    options,
  );
}
