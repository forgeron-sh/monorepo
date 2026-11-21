import type { PixelIcon } from "../types";

// A domed taco shell under an arc of filling.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "taco-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "....oooo",
    "..oo....oo",
    ".o..####..o",
    "o..#....#..o",
    "o.#......#.o",
    ".#........#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
