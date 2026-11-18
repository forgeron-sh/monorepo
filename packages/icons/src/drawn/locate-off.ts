import type { PixelIcon } from "../types";

// Locate off: `crosshair` struck by a 45° slash in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "locate-off",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "o...###",
    ".o##.#.##",
    ".#o..#...#",
    ".#.o.#...#",
    "#...o.....#",
    "####.o.####",
    "#.....o...#",
    ".#...#.o.#",
    ".#...#..o#",
    "..##.#.##o",
    "....###...o",
    "...........o",
  ],
};

export default icon;
