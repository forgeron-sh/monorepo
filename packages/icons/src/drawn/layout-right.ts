import type { PixelIcon } from "../types";

// Layout with a right panel: a frame whose right column is in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "layout-right",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    "..#...#oo#",
    "..#...#oo#",
    "..#...#oo#",
    "..#...#oo#",
    "..#...#oo#",
    "..#...#oo#",
    "..#...#oo#",
    "..#...#oo#",
    "..########",
  ],
};

export default icon;
