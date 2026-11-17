import type { PixelIcon } from "../types";

// Shuffle: two lines crossing on a 2×2 centre, each ending in a 45° head on the right; symmetric
// top to bottom.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "shuffle",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........#",
    ".........#",
    ".###....###",
    "....#..#.#",
    ".....##.#",
    ".....##.#",
    "....#..#.#",
    ".###....###",
    ".........#",
    "........#",
  ],
};

export default icon;
