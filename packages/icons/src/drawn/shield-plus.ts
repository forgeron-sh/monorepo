import type { PixelIcon } from "../types";

// Shield with a two-pixel plus inside in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "shield-plus",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#...oo...#",
    ".#...oo...#",
    ".#.oooooo.#",
    ".#.oooooo.#",
    "..#..oo..#",
    "...#.oo.#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
