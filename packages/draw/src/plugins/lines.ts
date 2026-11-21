// The lines family, core half: arrows (and lines, an arrow without a head), the pixel pen and the
// eraser. The eraser owns no kind: it is an editor tool, so its core half only names it.

import { definePlugin } from "../core/plugin";

export { arrow, arrowItem } from "./arrow";
export { pen } from "./pen";

export const eraser = definePlugin({
  id: "eraser",
  name: "Eraser",
  description: "Removes what the pointer crosses, in one undo step on release.",
});
