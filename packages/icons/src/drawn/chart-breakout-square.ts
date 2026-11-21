import type { PixelIcon } from "../types";

// Chart breakout: a square frame with a chart line breaking out of its upper-right corner, the line in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chart-breakout-square",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".######",
    ".#.......ooo",
    ".#........#o",
    ".#.......o.o",
    ".#......o",
    ".#.....o",
    ".#.o.o.o..#",
    ".#o.o.....#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
