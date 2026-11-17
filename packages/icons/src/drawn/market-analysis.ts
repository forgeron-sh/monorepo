import type { PixelIcon } from "../types";

// Chart axes with a dipping then rising line and a magnifier badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "market-analysis",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#",
    ".#.......#",
    ".#......#",
    ".#.#...#",
    ".#..#.#",
    ".#...#.ooo",
    ".#.....o.o",
    ".#.....ooo",
    ".#######..o",
    "..........o",
  ],
};

export default icon;
