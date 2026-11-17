import type { PixelIcon } from "../types";

// Tally marks: two upright strokes, the stroke of `tally-1`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tally-2",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#..#",
    "..#..#",
    "..#..#",
    "..#..#",
    "..#..#",
    "..#..#",
    "..#..#",
    "..#..#",
    "..#..#",
    "..#..#",
  ],
};

export default icon;
