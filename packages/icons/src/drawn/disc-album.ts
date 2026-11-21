import type { PixelIcon } from "../types";

// Album: a vinyl disc inside its square sleeve, the label in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "disc-album",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#..####..#",
    ".#.#....#.#",
    ".#.#.oo.#.#",
    ".#.#.oo.#.#",
    ".#.#....#.#",
    ".#..####..#",
    ".#........#",
    "..########",
  ],
};

export default icon;
