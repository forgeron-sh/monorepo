// @forgeron/icons: one named export per icon (`AnvilIcon`, `ArrowDown01Icon`…), plain data that a
// bundler drops when it is not imported, and a renderer to SVG markup. The React component is in
// `@forgeron/icons/react`, the whole catalog with its manifest in `@forgeron/icons/catalog`.
export * from "./generated/index";
export type { IconName } from "./generated/names";
export { hasDuotone, iconTree, pixelRows, toSvg } from "./render";
export type { SvgElement } from "./render";
export type * from "./types";
