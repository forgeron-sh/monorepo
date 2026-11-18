import type { PixelIcon } from "../types";

// Library: three books standing side by side, of different heights, each with a band on its spine.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "library-big",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###",
    ".#.#.....###",
    ".#.#.###.#.#",
    ".#.#.#.#.#.#",
    ".#.#.#.#.#.#",
    ".#.#.#.#.#.#",
    ".###.###.###",
    ".#.#.#.#.#.#",
    ".#.#.#.#.#.#",
    ".###.###.###",
  ],
};

export default icon;
