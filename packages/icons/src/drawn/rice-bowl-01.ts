import type { PixelIcon } from "../types";

// Rice bowl: the bowl of ice-cream-bowl, a mound of rice in the secondary tone and a pair of chopsticks.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "rice-bowl-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..........#",
    ".........#.#",
    "....oooo#.#",
    "..oo....#o",
    ".o.....#..o",
    "############",
    "#..........#",
    ".#........#",
    "..##....##",
    "....####",
    "...######",
  ],
};

export default icon;
