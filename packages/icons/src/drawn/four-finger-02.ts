import type { PixelIcon } from "../types";

// Hand raising four fingers, the thumb folded: the palm of `hand` without its thumb.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "four-finger-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#.#.#.#",
    "..#.#.#.#",
    "..#.#.#.#",
    "..#.#.#.#",
    "..#######",
    "..#######",
    "..#######",
    "..#######",
    "...#####",
    "...#####",
  ],
};

export default icon;
