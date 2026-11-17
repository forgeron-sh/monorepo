import type { PixelIcon } from "../types";

// Kitchen scale: a weighing plate on a stem over a body with a dial in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "weight-scale",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".....##",
    ".##########",
    ".#........#",
    ".#..oooo..#",
    ".#.o....o.#",
    ".#.o....o.#",
    ".#..oooo..#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
