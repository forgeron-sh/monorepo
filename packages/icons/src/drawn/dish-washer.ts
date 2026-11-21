import type { PixelIcon } from "../types";

// Dishwasher: an appliance box with a control strip and a round door window, the water in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "dish-washer",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#.....##.#",
    ".##########",
    ".#........#",
    ".#..####..#",
    ".#.#oooo#.#",
    ".#.#oooo#.#",
    ".#..####..#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
