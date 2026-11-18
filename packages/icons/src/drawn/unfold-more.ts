import type { PixelIcon } from "../types";

// Two chevrons pointing away from each other, up and down: expand.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "unfold-more",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....####",
    "...##..##",
    "...#....#",
    "",
    "",
    "...#....#",
    "...##..##",
    "....####",
    ".....##",
  ],
};

export default icon;
