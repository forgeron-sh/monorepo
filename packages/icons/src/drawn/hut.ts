import type { PixelIcon } from "../types";

// Hut: a steep roof with a wide eave over low walls and a door.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hut",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "...#....#",
    "..#......#",
    ".#........#",
    "############",
    "..#......#",
    "..#.####.#",
    "..#.#..#.#",
    "..###..###",
  ],
};

export default icon;
