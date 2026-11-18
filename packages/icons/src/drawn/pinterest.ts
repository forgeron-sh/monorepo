import type { PixelIcon } from "../types";

// The Pinterest mark in pixels: the P cut out of a round disc, its stem running out at the bottom.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "pinterest",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..########",
    ".####...###",
    ".###.###.##",
    "####.###.###",
    "####.###.###",
    "####.##.####",
    "####...#####",
    ".###.######",
    ".###.######",
    "..##.#####",
    ".....###",
  ],
};

export default icon;
