import type { PixelIcon } from "../types";

// Battery half charged: `battery-full` with three of its five columns of charge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "battery-medium-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".#########",
    ".#.......#",
    ".#.ooo...##",
    ".#.ooo...##",
    ".#.......#",
    ".#########",
  ],
};

export default icon;
