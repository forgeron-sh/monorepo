import type { PixelIcon } from "../types";

// Noodles: the bowl of rice-bowl-01, wavy noodles in the secondary tone lifted by a pair of chopsticks.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "noodles",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..........#",
    ".........#.#",
    "...o..o.#.#",
    "....o..o#o",
    "...o..o#..o",
    "############",
    "#..........#",
    ".#........#",
    "..##....##",
    "....####",
    "...######",
  ],
};

export default icon;
