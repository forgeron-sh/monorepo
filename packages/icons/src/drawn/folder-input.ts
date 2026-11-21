import type { PixelIcon } from "../types";

// Folder input: `folder-01` with an arrow in the secondary tone entering through its left side.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "folder-input",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..####",
    "..#...######",
    "..#........#",
    "....o......#",
    "oooooo.....#",
    "....o......#",
    "..#........#",
    "..##########",
  ],
};

export default icon;
