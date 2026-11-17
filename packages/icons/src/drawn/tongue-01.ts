import type { PixelIcon } from "../types";

// Face sticking its tongue out: the round face, a flat mouth and the tongue below it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tongue-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#........#",
    ".#.######.#",
    ".#...oo...#",
    "..#..oo..#",
    "...######",
  ],
};

export default icon;
