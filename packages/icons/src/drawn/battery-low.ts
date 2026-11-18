import type { PixelIcon } from "../types";

// Low battery: `battery-full` with one bar of charge left.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "battery-low",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".#########",
    ".#.......#",
    ".#.oo....##",
    ".#.oo....##",
    ".#.......#",
    ".#########",
  ],
};

export default icon;
