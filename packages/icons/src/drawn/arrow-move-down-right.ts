import type { PixelIcon } from "../types";

// Arrow moving down, then turning right: `arrow-move-up-right` flipped.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-move-down-right",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#",
    "..#",
    "..#",
    "..#",
    "..#",
    "..#....#",
    "..#.....#",
    "..########",
    "........#",
    ".......#",
  ],
};

export default icon;
