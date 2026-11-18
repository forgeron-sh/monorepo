import type { PixelIcon } from "../types";

// Zipped file: the `file-01` sheet with the zipper and pull of `folder-zip` in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-zip",
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
    "..#..o...#",
    "..#.ooo..#",
    "..#.o.o..#",
    "..#.ooo..#",
    "..########",
  ],
};

export default icon;
