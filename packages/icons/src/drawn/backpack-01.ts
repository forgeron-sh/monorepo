import type { PixelIcon } from "../types";

// Backpack: a handle, a bag, a front pocket in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "backpack-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "...#....#",
    "..########",
    ".#........#",
    ".#........#",
    ".#.oooooo.#",
    ".#.o....o.#",
    ".#.o....o.#",
    ".#.oooooo.#",
    ".##########",
  ],
};

export default icon;
