import type { PixelIcon } from "../types";

// Shield with a lightning bolt in the secondary tone; the shield-plus base.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "shield-energy",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#...oo...#",
    ".#..oo....#",
    ".#.oooooo.#",
    ".#....oo..#",
    ".#...oo...#",
    "..#.oo...#",
    "...#....#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
