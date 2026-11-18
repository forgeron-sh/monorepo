import type { PixelIcon } from "../types";

// Corrupted file: the sheet of `file-01` with a jagged crack in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-corrupt",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#####",
    "..#...##",
    "..#...#.#",
    "..#...####",
    "..#......#",
    "..#o...o.#",
    "..#.o.o.o#",
    "..#..o...#",
    "..#......#",
    "..########",
  ],
};

export default icon;
