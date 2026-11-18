import type { PixelIcon } from "../types";

// Victory sign from the back: the V of `victory-finger-01` mirrored, the folded fingers hidden behind the hand.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "victory-finger-03",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...#.....#",
    "...#.....#",
    "....#...#",
    "....#...#",
    ".....#.#",
    ".#######",
    ".#######",
    ".#######",
    "..#####",
    "",
    "..#####",
  ],
};

export default icon;
