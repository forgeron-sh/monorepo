import type { PixelIcon } from "../types";

// Line chart: two axes and a line in the secondary tone through four data points in the primary.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chart-line-data-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#",
    ".#.......#",
    ".#......o.o",
    ".#.....o...o",
    ".#..#.o",
    ".#.o.#",
    ".#o",
    ".#",
    ".#",
    ".##########",
  ],
};

export default icon;
