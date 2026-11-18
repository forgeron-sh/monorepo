import type { PixelIcon } from "../types";

// The Plaxo mark in pixels: a ring with a P inside it, the bowl of the P a smaller ring open at its
// lower left and the stem running down to pierce the outer ring at the bottom, where the ring
// stops just short of it. Simple Icons and Iconify `logos` have no Plaxo mark: composition taken
// from `hugeicons:plaxo` (Iconify, 2026-11-18), redrawn by hand in house style.
// 12×12: outer ring of ten by twelve, bowl of six by six, one-pixel gaps. Drawn on 2026-11-18.
// Plaxo and the Plaxo logo are trademarks of their owner, used here only to refer to Plaxo.
const icon: PixelIcon = {
  name: "plaxo",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#..####..#",
    "#..#....#..#",
    "#..#....#..#",
    "#..#....#..#",
    "#..#....#..#",
    ".#.#.###..#",
    ".#.#......#",
    "..##....##",
    ".....###",
  ],
};

export default icon;
