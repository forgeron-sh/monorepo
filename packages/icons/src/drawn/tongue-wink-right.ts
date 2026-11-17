import type { PixelIcon } from "../types";

// Face winking with the right eye and sticking its tongue out.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tongue-wink-right",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#..#.....#",
    ".#..#..##.#",
    ".#........#",
    ".#.######.#",
    ".#...oo...#",
    "..#..oo..#",
    "...######",
  ],
};

export default icon;
