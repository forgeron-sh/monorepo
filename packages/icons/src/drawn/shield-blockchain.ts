import type { PixelIcon } from "../types";

// A shield with a bitcoin B inside in the secondary tone (the B of `coins-bitcoin` and
// `bitcoin-shield`), and two linked chain rings cutting its lower right corner, like
// `shield-cog-corner`. The B in the primary tone merged with the rim (tried on 2026-11-18).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "shield-blockchain",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".##########",
    ".#........#",
    ".#.oooo...#",
    ".#.o...o..#",
    ".#.oooo...#",
    ".#.o...o..#",
    ".#.oooo",
    "..#......###",
    "...#.....#.#",
    "....#..#####",
    ".....#.#.#",
    ".......###",
  ],
};

export default icon;
