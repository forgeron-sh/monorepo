import type { PixelIcon } from "../types";

// Monitor of `computer-add` showing a rising chart line with an arrowhead.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "computer-chart-up",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#....ooo.#",
    ".#.....oo.#",
    ".#..o.o.o.#",
    ".#.o.o....#",
    ".#........#",
    ".##########",
    ".....##",
    "...######",
  ],
};

export default icon;
