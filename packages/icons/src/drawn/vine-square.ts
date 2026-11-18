import type { PixelIcon } from "../types";

// The Vine mark in a full-grid rounded square, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "vine-square",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".##########",
    "#..........#",
    "#..........#",
    "#.o....oo..#",
    "#.o...o..o.#",
    "#..o...ooo.#",
    "#..o..oo...#",
    "#...o.o....#",
    "#...ooo....#",
    "#....o.....#",
    "#..........#",
    ".##########",
  ],
};

export default icon;
