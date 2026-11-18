import type { PixelIcon } from "../types";

// The Wattpad W in a full-grid rounded square, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "wattpad-square",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".##########",
    "#..........#",
    "#..........#",
    "#.o..oo..o.#",
    "#.o..oo..o.#",
    "#.o.o..o.o.#",
    "#.o.o..o.o.#",
    "#..o....o..#",
    "#..o....o..#",
    "#..........#",
    "#..........#",
    ".##########",
  ],
};

export default icon;
