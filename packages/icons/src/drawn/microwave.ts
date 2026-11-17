import type { PixelIcon } from "../types";

// Microwave: a box with a door on the left and two knobs in the secondary tone on the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "microwave",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    ".#....#...#",
    ".#....#.o.#",
    ".#....#...#",
    ".#....#.o.#",
    ".#....#...#",
    ".##########",
    "..#......#",
  ],
};

export default icon;
