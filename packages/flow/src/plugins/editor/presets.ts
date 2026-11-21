// What a named preset means for the editor: a list of plugins, the editor halves of the same plugins
// as `../index.ts` lists as core halves.

import type { FlowEditorPlugin } from "../../react/plugin";
import { clipboard } from "./clipboard";
import { connectionPlugins } from "./connect";
import { edgeArrowsPlugin, edgeInsertPlugin, edgeReconnectPlugin } from "./edge-parts";
import { bezier, orthogonal } from "./edge-styles";
import { edges } from "./edges";
import { groups } from "./groups";
import { layout } from "./layout";
import { nodes } from "./nodes";
import { run } from "./run";
import { deleteKeys, far, minimap, toolbar, zoomControls } from "./ui";

/** Nodes and edges, nothing else: no types, no layout, no clipboard, no toolbar. */
export const minimalEditorPlugins: ReadonlyArray<FlowEditorPlugin> = [
  nodes,
  edges,
  bezier,
  deleteKeys,
];

/** Minimal, plus the connection rules and arrowheads: a graph whose ports have types. */
export const typedEditorPlugins: ReadonlyArray<FlowEditorPlugin> = [
  ...minimalEditorPlugins,
  edgeArrowsPlugin,
  ...connectionPlugins,
];

/** Everything that ships: the editor as it was before it was made of plugins. */
export const fullEditorPlugins: ReadonlyArray<FlowEditorPlugin> = [
  nodes,
  edges,
  bezier,
  orthogonal,
  edgeArrowsPlugin,
  edgeInsertPlugin,
  edgeReconnectPlugin,
  ...connectionPlugins,
  layout,
  groups,
  run,
  clipboard,
  deleteKeys,
  far,
  toolbar,
  zoomControls,
  minimap,
];

export type FlowPreset = "minimal" | "typed" | "full";

/** The list a preset names. */
export const presetPlugins = (preset: FlowPreset): ReadonlyArray<FlowEditorPlugin> =>
  preset === "minimal"
    ? minimalEditorPlugins
    : preset === "typed"
      ? typedEditorPlugins
      : fullEditorPlugins;
