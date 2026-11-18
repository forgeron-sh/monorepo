import type { PixelIcon } from "../types";

// The Skype mark in pixels: the S cut out of the round shape with its two bumps.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "skype",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".####",
    "#######",
    "#########",
    "####.....#",
    "###.#######",
    "####...#####",
    "#####...####",
    ".#######.###",
    "..#.....####",
    "...#########",
    ".....#######",
    ".......####",
  ],
};

export default icon;
