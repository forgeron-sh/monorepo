import type { PixelIcon } from "../types";

// Ring with the check of `checkmark-square-01`, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "checkmark-circle-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#......o.#",
    ".#.o...o..#",
    ".#..o.o...#",
    ".#...o....#",
    ".#........#",
    "..#......#",
    "...######",
  ],
};

export default icon;
