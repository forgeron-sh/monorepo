import type { PixelIcon } from "../types";

// Gift: a bow, a lid and a box tied with a two-pixel ribbon down the middle.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
// Duotone (2026-11-17): the ribbon.
const icon: PixelIcon = {
  name: "gift",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..###..###",
    "..#..oo..#",
    ".####oo####",
    ".#...oo...#",
    ".####oo####",
    "..#..oo..#",
    "..#..oo..#",
    "..#..oo..#",
    "..#..oo..#",
    "..########",
  ],
};

export default icon;
