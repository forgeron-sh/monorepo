import type { PixelIcon } from "../types";

// Cloud of `rain` with an exclamation mark in the secondary tone running out of its base.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cloud-alert",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....###",
    "...##...#",
    "..#......#",
    ".#...oo...#",
    ".#...oo...#",
    "..##.oo.##",
    ".....oo",
    ".....oo",
    "",
    ".....oo",
  ],
};

export default icon;
