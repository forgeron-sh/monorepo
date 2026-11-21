import type { PixelIcon } from "../types";

// Frame with a highlighted panel down its left side.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "layout-panel-left",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    "..#oo#...#",
    "..#oo#...#",
    "..#oo#...#",
    "..#oo#...#",
    "..#oo#...#",
    "..#oo#...#",
    "..#oo#...#",
    "..#oo#...#",
    "..########",
  ],
};

export default icon;
