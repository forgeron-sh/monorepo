import type { PixelIcon } from "../types";

// The VK mark in a full-grid rounded square, the letters V and K in the secondary tone.
// 16×16: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "vk-square",
  style: "pixel",
  grid: 16,
  // prettier-ignore
  rows: [
    "",
    "..############",
    ".#............#",
    ".#............#",
    ".#............#",
    ".#.o...o.o..o.#",
    ".#.o...o.o.o..#",
    ".#..o.o..oo...#",
    ".#..o.o..oo...#",
    ".#...o...o.o..#",
    ".#...o...o..o.#",
    ".#............#",
    ".#............#",
    ".#............#",
    "..############",
  ],
};

export default icon;
