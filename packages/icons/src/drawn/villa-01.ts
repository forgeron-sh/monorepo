import type { PixelIcon } from "../types";

// Villa: a gabled house with a lower flat-roofed wing.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "villa-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...##",
    "..#..#",
    ".#....#",
    ".#....#####",
    ".#....#...#",
    ".#....#.o.#",
    ".#....#.o.#",
    ".#.##.#...#",
    ".#.##.#...#",
    ".##########",
  ],
};

export default icon;
