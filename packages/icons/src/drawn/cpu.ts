import type { PixelIcon } from "../types";

// Processor: a chip with two pins a side and the die in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cpu",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....#..#",
    "..########",
    "..#......#",
    ".##.oooo.##",
    "..#.o..o.#",
    "..#.o..o.#",
    ".##.oooo.##",
    "..#......#",
    "..########",
    "....#..#",
  ],
};

export default icon;
