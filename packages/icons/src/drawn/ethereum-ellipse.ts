import type { PixelIcon } from "../types";

// The Ethereum mark in the full-grid ring of `bitcoin-01`, in the secondary tone: the diamond over a solid wedge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "ethereum-ellipse",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#...oo...#",
    ".#..oooo..#",
    "#..oooooo..#",
    "#...oooo...#",
    "#.o..oo..o.#",
    "#.ooo..ooo.#",
    ".#.oooooo.#",
    ".#...oo...#",
    "..##....##",
    "....####",
  ],
};

export default icon;
