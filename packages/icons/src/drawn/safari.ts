import type { PixelIcon } from "../types";

// The Safari mark in pixels: the compass ring and its diagonal needle, the north half in the
// secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "safari",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#......o.#",
    "#.....ooo..#",
    "#....ooo...#",
    "#...###....#",
    "#..###.....#",
    ".#.#......#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
