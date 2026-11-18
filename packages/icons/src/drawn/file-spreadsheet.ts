import type { PixelIcon } from "../types";

// Spreadsheet file: a sheet with a folded corner, a grid of cells in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-spreadsheet",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#####",
    "..#...##",
    "..#...#.#",
    "..#...####",
    "..#..o...#",
    "..#oooooo#",
    "..#..o...#",
    "..#oooooo#",
    "..#..o...#",
    "..########",
  ],
};

export default icon;
