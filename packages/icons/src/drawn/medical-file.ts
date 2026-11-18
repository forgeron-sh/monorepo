import type { PixelIcon } from "../types";

// File with a pulse line in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "medical-file",
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
    "..#..o...#",
    "..oooo.ooo",
    "..#...o..#",
    "..#......#",
    "..########",
  ],
};

export default icon;
