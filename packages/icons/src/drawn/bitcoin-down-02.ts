import type { PixelIcon } from "../types";

// Bitcoin trend down: the zigzag of `chart-down` under the bitcoin badge of `file-bitcoin`, moved to the upper right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "bitcoin-down-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".......oooo",
    ".......o...o",
    ".......oooo",
    ".#.....o...o",
    "..#....oooo",
    "...#.#",
    "....#.#",
    ".......#",
    "........#.#",
    ".........##",
    "........###",
  ],
};

export default icon;
