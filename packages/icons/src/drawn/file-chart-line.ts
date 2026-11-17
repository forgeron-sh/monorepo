import type { PixelIcon } from "../types";

// File with a rising line chart badge on a base line.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-chart-line",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#####",
    ".#...##",
    ".#...#.#",
    ".#...####",
    ".#",
    ".#........o",
    ".#.......o",
    ".#....o.o",
    ".#.....o",
    ".####.ooooo",
  ],
};

export default icon;
