import type { PixelIcon } from "../types";

// Target: two rings and the bull's eye in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "target-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#..####..#",
    ".#.#....#.#",
    ".#.#.oo.#.#",
    ".#.#.oo.#.#",
    ".#.#....#.#",
    ".#..####..#",
    "..#......#",
    "...######",
  ],
};

export default icon;
