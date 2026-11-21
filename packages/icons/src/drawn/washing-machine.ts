import type { PixelIcon } from "../types";

// Washing machine: a box with a control strip and a round door in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "washing-machine",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#.##..##.#",
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
