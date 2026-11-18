import type { PixelIcon } from "../types";

// Universal access: the accessibility figure inside a circle, the head in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "universal-access-circle",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#...oo...#",
    ".#...oo...#",
    "#..######..#",
    "#....##....#",
    "#....##....#",
    "#...#..#...#",
    ".#.#....#.#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
