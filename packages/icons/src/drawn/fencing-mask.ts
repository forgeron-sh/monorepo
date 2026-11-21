import type { PixelIcon } from "../types";

// Fencing mask, front view: a rounded mesh face with vertical bars in the secondary tone, the bib flaring below.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "fencing-mask",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#..o..o..#",
    ".#..o..o..#",
    ".#..o..o..#",
    ".#..o..o..#",
    "..#.o..o.#",
    "..########",
    ".#........#",
    "############",
  ],
};

export default icon;
