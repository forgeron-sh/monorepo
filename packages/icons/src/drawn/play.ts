import type { PixelIcon } from "../types";

// Play: a triangle with 2:1 sides, set one column right of the geometric centre (optical centre).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "play",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "...##",
    "...#.##",
    "...#...##",
    "...#.....##",
    "...#.....##",
    "...#...##",
    "...#.##",
    "...##",
  ],
};

export default icon;
