import type { PixelIcon } from "../types";

// Moonset: a crescent sinking below the horizon, with a down arrow in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "moonset",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...###...o",
    "..#.#....o",
    ".#..#..o.o.o",
    ".#..#...ooo",
    ".#..#....o",
    ".#...#",
    ".#....####",
    "############",
    "",
    "...######",
  ],
};

export default icon;
