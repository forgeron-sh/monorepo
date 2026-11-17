import type { PixelIcon } from "../types";

// Big arrow down under a dash: a dash in the secondary tone, a block arrow outline below.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-big-down-dash",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...oooooo",
    "",
    "...######",
    "...#....#",
    "...#....#",
    ".###....###",
    "..#......#",
    "...#....#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
