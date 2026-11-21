// Run state, editor half: with it the `run` prop of `<FlowCanvas>` is shown: node outlines by
// state, edge colours, items marching along running edges (the styles are in `flow.css`, keyed by
// `data-status`), and the minimap coloured by state. Without it a run prop is ignored.

import { defineEditorPlugin } from "../../react/plugin";
import { run as runCore } from "../run";

export const run = defineEditorPlugin({ core: runCore });
