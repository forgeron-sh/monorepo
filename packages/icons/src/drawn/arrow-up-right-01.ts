import type { PixelIcon } from "../types";

// Arrow pointing up and right: a 45° shaft into a corner, 8×8 and centred.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-up-right-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "....######",
    "........##",
    ".......#.#",
    "......#..#",
    ".....#...#",
    "....#....#",
    "...#",
    "..#",
  ],
};

export default icon;
