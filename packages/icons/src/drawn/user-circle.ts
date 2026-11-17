import type { PixelIcon } from "../types";

// Person in a ring: the ring of `clock-01`, the head in the secondary tone, the shoulders.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "user-circle",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#...oo...#",
    ".#..oooo..#",
    ".#..oooo..#",
    ".#...oo...#",
    ".#........#",
    ".#.######.#",
    "..#......#",
    "...######",
  ],
};

export default icon;
