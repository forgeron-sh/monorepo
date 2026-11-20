// Constructors of new items with the board's defaults: what a tool adds, what a test builds. Each
// lives with the kind it makes (`../plugins`); this is the one place that lists them.

export {
  DEFAULT_FILL,
  DEFAULT_STROKE,
  DEFAULT_STYLE,
  DEFAULT_TEXT_SIZE,
  type DrawStyle,
} from "./style";
export { arrowItem } from "../plugins/arrow";
export { frameItem } from "../plugins/frame";
export { imageBounds, imageItem } from "../plugins/media";
export { STICKY_SIZE, stickyItem, textItem } from "../plugins/notes";
export { shapeItem } from "../plugins/shapes";
