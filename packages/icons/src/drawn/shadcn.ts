import type { PixelIcon } from "../types";

// The shadcn/ui mark in pixels: two parallel slashes, a long one and a short one.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "shadcn",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..........##",
    ".........##",
    "........##",
    ".......##",
    "......##",
    ".....##",
    "....##....##",
    "...##....##",
    "..##....##",
    ".##....##",
    "##....##",
    "#....##",
  ],
};

export default icon;
