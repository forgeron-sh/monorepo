import type { PixelIcon } from "../types";

// Calendar: two rings, a solid header, four days in the secondary tone (three read as a face).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "calendar-03",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...#....#",
    ".##########",
    ".##########",
    ".#........#",
    ".#.oo..oo.#",
    ".#.oo..oo.#",
    ".#........#",
    ".#.oo..oo.#",
    ".#.oo..oo.#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
