import type { PixelIcon } from "../types";

// A battery with an exclamation mark.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "battery-warning",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".#########",
    ".#..oo...#",
    ".#..oo...##",
    ".#.......##",
    ".#..oo...#",
    ".#########",
  ],
};

export default icon;
