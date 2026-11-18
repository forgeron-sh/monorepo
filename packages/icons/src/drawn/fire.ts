import type { PixelIcon } from "../types";

// Flame: a leaning tip and a side lick, a small solid inner flame in the secondary tone (a
// symmetric flame with a ring inside read as a drop with an eye).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "fire",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....#",
    "....##",
    "....#.#",
    "...#...#.#",
    "...#....##",
    "..#..o...#",
    "..#.ooo..#",
    "..#.ooo..#",
    "..#......#",
    "...######",
  ],
};

export default icon;
