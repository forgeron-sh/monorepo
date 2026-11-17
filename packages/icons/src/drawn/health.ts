import type { PixelIcon } from "../types";

// Heart with a medical cross inside in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "health",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..###..###",
    ".#...##...#",
    ".#...oo...#",
    ".#.oooooo.#",
    "..#.oooo.#",
    "...#.oo.#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
