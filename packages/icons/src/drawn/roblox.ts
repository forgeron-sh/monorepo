import type { PixelIcon } from "../types";

// The Roblox mark in pixels: the tilted square with the small square hole in its middle.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "roblox",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..###",
    "..#######",
    "..##########",
    ".###########",
    ".#####.#####",
    ".####...###",
    ".###...####",
    "#####.#####",
    "##########",
    "##########",
    "...#######",
    ".......###",
  ],
};

export default icon;
