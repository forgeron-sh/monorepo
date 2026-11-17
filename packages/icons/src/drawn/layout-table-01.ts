import type { PixelIcon } from "../types";

// Table with a highlighted header row.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "layout-table-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#oooooooo#",
    ".##########",
    ".#...#....#",
    ".#...#....#",
    ".##########",
    ".#...#....#",
    ".#...#....#",
    ".##########",
  ],
};

export default icon;
