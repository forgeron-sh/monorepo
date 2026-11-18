import type { PixelIcon } from "../types";

// India Gate: a war memorial arch with a cornice and a small dome.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "india-gate",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    ".##########",
    ".#........#",
    ".##########",
    ".#........#",
    ".#..####..#",
    ".#.#....#.#",
    ".#.#....#.#",
    ".#.#....#.#",
    ".#.#....#.#",
    ".###....###",
  ],
};

export default icon;
