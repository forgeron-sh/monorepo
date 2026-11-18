import type { PixelIcon } from "../types";

// Chevron first: a left chevron against a bar.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chevron-first",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..#.....##",
    "..#....##",
    "..#...##",
    "..#..##",
    "..#..##",
    "..#...##",
    "..#....##",
    "..#.....##",
  ],
};

export default icon;
