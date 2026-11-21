import type { PixelIcon } from "../types";

// Heart with a plus badge, the heart moved up and left as the bases of the badge families are.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "heart-add",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###..###",
    "#...##...#",
    "#........#",
    "#........#",
    ".#......#",
    "..#....#",
    "...#..#..o",
    "....##...o",
    ".......ooooo",
    ".........o",
    ".........o",
  ],
};

export default icon;
