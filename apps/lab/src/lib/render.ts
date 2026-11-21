import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { initBlueprint, renderSvg, type SceneSource } from "@forgeron/blueprint";
import { FILTERS } from "./scenes";

/**
 * A scene as a static SVG, at build. The engine is started here with the package's own `.wasm`:
 * once bundled, the engine cannot find it next to its own file. Astro runs from `apps/lab`.
 */
const WASM = resolve(process.cwd(), "../../packages/blueprint/wasm/fg_blueprint_bg.wasm");
await initBlueprint(readFileSync(WASM));

export function sceneSvg(scene: SceneSource, width: number, height: number): string {
  return renderSvg(scene, { width, height, filters: FILTERS });
}
