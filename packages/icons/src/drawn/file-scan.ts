import type { PixelIcon } from "../types";

// File crossed by a scan line in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-scan",
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
    ".oooooooooo",
    "..#......#",
    "..#......#",
    "..#......#",
    "..########",
  ],
};

export default icon;
