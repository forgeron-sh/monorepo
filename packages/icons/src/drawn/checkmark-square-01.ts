import type { PixelIcon } from "../types";

// Ticked box: a square with cut corners, a one-pixel check inside in the secondary tone,
// a one-pixel gap all round. Replaces the lab's `check` (a check escaping the box over a dotted
// baseline), which read as a broken drawing. Same check as `shield-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "checkmark-square-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#........#",
    ".#......o.#",
    ".#.o...o..#",
    ".#..o.o...#",
    ".#...o....#",
    ".#........#",
    ".#........#",
    "..########",
  ],
};

export default icon;
