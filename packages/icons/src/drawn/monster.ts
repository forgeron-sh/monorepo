import type { PixelIcon } from "../types";

// Horned round monster with one big eye.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "monster",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".#........#",
    ".##.####.##",
    "..##....##",
    ".#........#",
    ".#...oo...#",
    ".#..o..o..#",
    ".#..o..o..#",
    ".#...oo...#",
    ".#........#",
    ".#.#.##.#.#",
    ".###.##.###",
  ],
};

export default icon;
