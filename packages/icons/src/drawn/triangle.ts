import type { PixelIcon } from "../types";

// A triangle pointing up with rounded corners: steady 1:2 sides from a two-pixel apex,
// the base corners cut by one pixel.
// Redrawn after Hugeicons `triangle` (Iconify preview, 2026-11-17): composition only.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "triangle",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "....#..#",
    "...#....#",
    "...#....#",
    "..#......#",
    "..#......#",
    ".#........#",
    ".#........#",
    "..########",
  ],
};

export default icon;
