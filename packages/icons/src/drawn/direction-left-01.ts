import type { PixelIcon } from "../types";

// A turn-left sign: a line rising then bending into an arrow pointing left.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "direction-left-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....#",
    "...#",
    "..######",
    "...#....#",
    "....#....#",
    ".........#",
    ".........#",
    ".........#",
    ".........#",
    ".........#",
  ],
};

export default icon;
