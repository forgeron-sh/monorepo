import type { PixelIcon } from "../types";

// A document and a column chart badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-chart-column",
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
    ".#......o",
    ".#......o",
    ".#......o.o",
    ".#....o.o.o",
    ".####.o.o.o",
  ],
};

export default icon;
