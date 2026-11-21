// @forgeron/flow/plugins: the core halves of the bundled plugins and the preset lists. No React, no
// canvas React layer, no ui: a read-only place (a run plan on a server, a Worker validating a
// graph, a layout computed outside the browser) imports this and the core, nothing more. The
// editor halves are in `@forgeron/flow/plugins/editor`. Each family is also a subpath of its own
// (`.../plugins/connect`, `.../plugins/layout`) for the plugins an app picks one by one.

import type { FlowCorePlugin } from "../core/plugin";
import { clipboard } from "./clipboard";
import { connectionPlugins } from "./connect";
import { bezier, orthogonal } from "./edges";
import { groups } from "./groups";
import { layeredLayout } from "./layout";
import { run } from "./run";
import {
  deleteKeys,
  edgeArrows,
  edgeInsert,
  edgeReconnect,
  edges,
  far,
  minimap,
  nodes,
  toolbar,
  zoomControls,
} from "./ui";

export { clipboard, groups, layeredLayout, run, bezier, orthogonal };
export {
  connectionPlugins,
  duplicateRule,
  cycleRule,
  fanOut,
  fanOutRule,
  noCycles,
  noDuplicates,
  occupiedRule,
  portTypes,
  selfLoop,
  selfLoopRule,
  singleInput,
  typeRule,
} from "./connect";
export {
  deleteKeys,
  edgeArrows,
  edgeInsert,
  edgeReconnect,
  edges,
  far,
  minimap,
  nodes,
  toolbar,
  zoomControls,
};

/** Nodes and edges, nothing else: no types, no layout, no clipboard. */
export const minimalCorePlugins: ReadonlyArray<FlowCorePlugin> = [nodes, edges, bezier, deleteKeys];

/** Minimal, plus the connection rules and arrowheads: a graph whose ports have types. */
export const typedCorePlugins: ReadonlyArray<FlowCorePlugin> = [
  ...minimalCorePlugins,
  edgeArrows,
  ...connectionPlugins,
];

/** Everything that ships: the behaviour of the editor before it was made of plugins. */
export const fullCorePlugins: ReadonlyArray<FlowCorePlugin> = [
  nodes,
  edges,
  bezier,
  orthogonal,
  edgeArrows,
  edgeInsert,
  edgeReconnect,
  ...connectionPlugins,
  layeredLayout,
  groups,
  run,
  clipboard,
  deleteKeys,
  far,
  toolbar,
  zoomControls,
  minimap,
];
