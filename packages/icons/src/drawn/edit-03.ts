import type { PixelIcon } from "../types";

// A pencil writing on a line: the pencil of edit-02 above a baseline in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "edit-03",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........##",
    ".......#..#",
    "......#..#",
    ".....#..#",
    "....#..#",
    "...#..#",
    "..#..#",
    "..#.#",
    "..##",
    "",
    ".oooooooooo",
  ],
};

export default icon;
