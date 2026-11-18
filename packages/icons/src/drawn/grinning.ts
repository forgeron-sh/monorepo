import type { PixelIcon } from "../types";

// Grinning face: the ring of `smile`, open eyes and a wide open mouth in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "grinning",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#........#",
    ".#.oooooo.#",
    ".#.o....o.#",
    ".#..oooo..#",
    "..#......#",
    "...######",
  ],
};

export default icon;
