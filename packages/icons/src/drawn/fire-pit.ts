import type { PixelIcon } from "../types";

// Fire pit: the flame of `fire` in a bowl.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "fire-pit",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....#",
    "....##",
    "....#.#",
    "...#...#.#",
    "...#....##",
    "..#..o...#",
    "..#.ooo..#",
    "...######",
    "",
    "############",
    ".#........#",
    "..########",
  ],
};

export default icon;
