import type { PixelIcon } from "../types";

// Calculator: a screen in the secondary tone and two rows of keys.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "calculator",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#.oooooo.#",
    ".#.oooooo.#",
    ".#........#",
    ".#.##..##.#",
    ".#........#",
    ".#.##..##.#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
