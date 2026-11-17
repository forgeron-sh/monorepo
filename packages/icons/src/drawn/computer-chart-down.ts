import type { PixelIcon } from "../types";

// Monitor of `computer-add` showing a falling chart line with an arrowhead.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "computer-chart-down",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#.o.o....#",
    ".#..o.o.o.#",
    ".#.....oo.#",
    ".#....ooo.#",
    ".#........#",
    ".##########",
    ".....##",
    "...######",
  ],
};

export default icon;
