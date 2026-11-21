import type { PixelIcon } from "../types";

// Arrow pointing down and right: `arrow-up-right-02` flipped.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-down-right-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..##",
    "...##",
    "....##...#",
    ".....##.##",
    "......####",
    "......####",
    ".....#####",
    "....######",
  ],
};

export default icon;
