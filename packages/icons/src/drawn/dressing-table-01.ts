import type { PixelIcon } from "../types";

// A dressing table: a round mirror on a stand over a table with a drawer.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "dressing-table-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "...#....#",
    "...#..o.#",
    "...#.o..#",
    "....####",
    ".....##",
    ".##########",
    ".#........#",
    ".##########",
    ".#........#",
    ".#........#",
  ],
};

export default icon;
