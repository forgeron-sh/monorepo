import type { PixelIcon } from "../types";

// Arrow moving up, then turning right at a square corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-move-up-right",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".......#",
    "........#",
    "..########",
    "..#.....#",
    "..#....#",
    "..#",
    "..#",
    "..#",
    "..#",
    "..#",
  ],
};

export default icon;
