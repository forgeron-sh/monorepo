import type { PixelIcon } from "../types";

// Flip vertically: a solid triangle and its outlined mirror image across a dashed horizontal axis.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "flip-vertical",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..########",
    "...######",
    "....####",
    ".....##",
    "",
    ".oo..oo..oo",
    ".oo..oo..oo",
    "",
    ".....##",
    "....#..#",
    "...#....#",
    "..########",
  ],
};

export default icon;
