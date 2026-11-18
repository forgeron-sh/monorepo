import type { PixelIcon } from "../types";

// The Ethereum mark in a full-grid rounded square, in the secondary tone: the diamond over a solid wedge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "ethereum-rectangle",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".##########",
    "#..........#",
    "#....oo....#",
    "#...oooo...#",
    "#..oooooo..#",
    "#...oooo...#",
    "#.o..oo..o.#",
    "#.ooo..ooo.#",
    "#..oooooo..#",
    "#....oo....#",
    "#..........#",
    ".##########",
  ],
};

export default icon;
