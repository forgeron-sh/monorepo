import type { PixelIcon } from "../types";

// Two arrows forming a banknote, with a coin inside in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "money-exchange-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........#",
    ".........#",
    ".##########",
    ".#.......#",
    ".#...oo.#",
    "...#.oo...#",
    "..#.......#",
    ".##########",
    "..#",
    "...#",
  ],
};

export default icon;
