import type { PixelIcon } from "../types";

// Sheet with a folded corner on the upper right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-01",
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
    "..#......#",
    "..#......#",
    "..#......#",
    "..#......#",
    "..########",
  ],
};

export default icon;
