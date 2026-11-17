import type { PixelIcon } from "../types";

// Pilcrow (paragraph mark): a solid bowl and two stems.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pilcrow",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#######",
    "..#####..#",
    "..#####..#",
    "..#####..#",
    "...####..#",
    "......#..#",
    "......#..#",
    "......#..#",
    "......#..#",
    "......#..#",
  ],
};

export default icon;
