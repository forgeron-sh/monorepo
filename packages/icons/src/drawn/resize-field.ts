import type { PixelIcon } from "../types";

// Resize grip: two parallel 45° strokes in the lower-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "resize-field",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..........#",
    ".........#",
    "........#",
    ".......#..#",
    "......#..#",
    ".....#..#",
    "....#..#",
    "...#..#",
    "..#..#",
  ],
};

export default icon;
