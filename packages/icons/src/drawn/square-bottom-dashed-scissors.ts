import type { PixelIcon } from "../types";

// Square with a dashed bottom edge and scissors inside.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "square-bottom-dashed-scissors",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#.#....#.#",
    ".#..#..#..#",
    ".#...##...#",
    ".#..#..#..#",
    ".#.oo..oo.#",
    "...oo..oo",
    ".#........#",
    ".##..##..##",
  ],
};

export default icon;
