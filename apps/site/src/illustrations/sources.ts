/**
 * The site's iso scenes by name, for the engine: where `canvas.ts`'s canvases get their pictures.
 * Imported by the worker that plays them (`worker.ts`) and, where a browser has no
 * OffscreenCanvas, by the in-page fallback (`inline.ts`); never by the page itself, which ships
 * none of the scene functions.
 *
 * A scene plays from data when it was converted by hand (`<scene>.bp` of
 * `@forgeron/libraries/blueprints`, with its timelines), on the script layer otherwise (its
 * function's blocks, rasterised by the engine). The scroll and hover scenes not converted yet add
 * a control file (`control/<scene>.bp`): its vars, machines and camera are data, its pixels stay
 * the function's (docs/blueprint/engine.md, P4). The village plays from data with its vars, machine and camera in one file.
 * The files are imported compiled (`?compiled`, `@forgeron/blueprint/vite`): their SceneBin bytes,
 * not their JSON, and no reader or SceneBin writer.
 */
import type { CompiledSource } from "@forgeron/blueprint/dom";
import type { CompiledBlueprint } from "@forgeron/blueprint/format";
import cli from "@forgeron/libraries/blueprints/cli.bp?compiled";
import line from "@forgeron/libraries/blueprints/control/production-line.bp?compiled";
import resources from "@forgeron/libraries/blueprints/control/resources.bp?compiled";
import stack6 from "@forgeron/libraries/blueprints/control/stack6.bp?compiled";
import hostServers from "@forgeron/libraries/blueprints/host-servers.bp?compiled";
import mcp from "@forgeron/libraries/blueprints/mcp.bp?compiled";
import village from "@forgeron/libraries/blueprints/erp-village.bp?compiled";
import usageIso from "@forgeron/libraries/blueprints/usage-iso.bp?compiled";
import web from "@forgeron/libraries/blueprints/web.bp?compiled";
import { lineStore } from "./objects";
import { SCENES } from "./scenes";

const DATA = new Map<string, CompiledBlueprint>(
  Object.entries({
    web,
    mcp,
    cli,
    "usage-iso": usageIso,
    "host-servers": hostServers,
    "erp-village": village,
  }),
);
const CONTROL = new Map<string, CompiledBlueprint>(
  Object.entries({ "production-line": line, resources, stack6 }),
);

/** The module stores the scroll scenes' functions read their progress from. */
const STORES: Record<string, { progress: number }> = {
  "production-line": lineStore,
};

/**
 * The scene's source: its data, its control file over its function (which reads the progress
 * the page set, through its store), or its function. `vars` are the values the page set.
 */
export function sourceOf(
  name: string,
  vars: ReadonlyMap<string, number> = new Map(),
): CompiledSource | (typeof SCENES)[string] | undefined {
  const fn = SCENES[name];
  const data = DATA.get(name);
  if (data) return { compiled: data, scene: name };
  const control = CONTROL.get(name);
  if (!control || !fn) return fn;
  const store = STORES[name];
  const script: typeof fn = store
    ? (frame) => {
        store.progress = vars.get("progress") ?? 0;
        return fn(frame);
      }
    : fn;
  return { compiled: control, scene: name, script };
}
