import type { PixelIcon } from "../types";

// A turn-right sign: a line rising then bending into an arrow pointing right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "direction-right-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".......#",
    "........#",
    "...######",
    "..#....#",
    "..#....#",
    "..#",
    "..#",
    "..#",
    "..#",
    "..#",
  ],
};

export default icon;
