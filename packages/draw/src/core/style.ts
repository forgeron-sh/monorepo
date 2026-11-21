// What a new item takes by default: the stroke, the fill and the style the inspector's last
// choices make. Data only; the kinds and the tools read it.

import type { ArrowHead, ArrowRoute, DrawColor, DrawFill, DrawStroke, StickyColor } from "./types";

export const DEFAULT_STROKE: DrawStroke = { color: "ink", width: 2, dash: "solid" };
export const DEFAULT_FILL: DrawFill = { type: "none" };
export const DEFAULT_TEXT_SIZE = 20;

/** What a new item takes when its tool draws it: the inspector's last choices. */
export interface DrawStyle {
  fill: DrawFill;
  stroke: DrawStroke;
  sticky: StickyColor;
  textSize: number;
  textColor: DrawColor;
  head: ArrowHead;
  route: ArrowRoute;
  penColor: DrawColor;
  penWeight: number;
}

export const DEFAULT_STYLE: DrawStyle = {
  fill: DEFAULT_FILL,
  stroke: DEFAULT_STROKE,
  sticky: "amber",
  textSize: DEFAULT_TEXT_SIZE,
  textColor: "ink",
  head: "end",
  route: "straight",
  penColor: "accent",
  penWeight: 1,
};
