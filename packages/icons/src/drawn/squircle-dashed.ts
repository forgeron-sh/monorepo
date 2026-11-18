import type { PixelIcon } from "../types";

// A dashed squircle: a rounded square outline broken in the middle of each side.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "squircle-dashed",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...##..##",
    "..#......#",
    ".#........#",
    ".#........#",
    "",
    "",
    ".#........#",
    ".#........#",
    "..#......#",
    "...##..##",
  ],
};

export default icon;
