import type { PixelIcon } from "../types";

// High-speed train seen from the side: a long body, a window band in the secondary tone, a nose sloping down to the right, wheels.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "train-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".#######",
    ".#......#",
    ".#.oooo..##",
    ".#.........#",
    ".###########",
    "..##....##",
  ],
};

export default icon;
