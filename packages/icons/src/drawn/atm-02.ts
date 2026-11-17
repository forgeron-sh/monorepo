import type { PixelIcon } from "../types";

// A cash machine handing out a banknote.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "atm-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".##########",
    "..#......#",
    "..#..oo..#",
    "..#.o..o.#",
    "..#.o..o.#",
    "..#..oo..#",
    "..#......#",
    "..########",
  ],
};

export default icon;
