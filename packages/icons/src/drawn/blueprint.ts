import type { PixelIcon } from "../types";

// A blueprint: a sheet rolled on the left with a floor plan in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "blueprint",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    "#..#......#",
    "#..#.oooo.#",
    "#..#.o..o.#",
    "#..#.o....#",
    "#..#.oo.o.#",
    "#..#......#",
    "#.##......#",
    "#.#########",
    ".#",
  ],
};

export default icon;
