import type { PixelIcon } from "../types";

// Shop: a striped awning with three scallops (stripes in the secondary tone), a window, a door
// (a plain awning over two posts read as a gate).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "store-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#oo#oo#oo#",
    ".#oo#oo#oo#",
    "..##.##.##",
    "..#......#",
    "..#.##...#",
    "..#.##.oo#",
    "..#....oo#",
    "..#....oo#",
    ".##########",
  ],
};

export default icon;
