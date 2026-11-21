import type { PixelIcon } from "../types";

// Shelving unit: two uprights and three shelves holding goods in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "shelving-unit",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#........#",
    ".#.o.o....#",
    ".#.o.o.oo.#",
    ".##########",
    ".#.....oo.#",
    ".#.oo..oo.#",
    ".##########",
    ".#........#",
    ".#........#",
    ".##########",
    ".#........#",
  ],
};

export default icon;
