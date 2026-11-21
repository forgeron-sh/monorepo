import type { PixelIcon } from "../types";

// Printer of `printer` with a check badge in the shared lower-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "printer-check",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "...#....#",
    ".##########",
    ".#........#",
    ".#........#",
    ".#.######",
    ".#.#......o",
    ".###.....o",
    "...#..o.o",
    "...##..o",
  ],
};

export default icon;
