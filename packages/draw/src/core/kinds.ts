// What each kind of the whiteboard tells the canvas: its hit test and its resize rule, for the
// bundled kinds (the `full` preset). An engine built on another plugin list takes its own from the
// registry (`registry.kinds`). The look is in the kinds' `paint` and in the React layer.

import { DEFAULT_REGISTRY } from "./defaults";

export { FRAME_EDGE, FRAME_TITLE, frameHit } from "../plugins/frame";
export const drawKinds = DEFAULT_REGISTRY.kinds;
