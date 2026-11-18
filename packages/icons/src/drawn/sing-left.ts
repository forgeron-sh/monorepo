import type { PixelIcon } from "../types";

// Singing: a person with a music note on the left.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "sing-left",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".oo..####",
    ".o..#....#",
    ".o..#....#",
    "oo..#....#",
    "oo...####",
    "",
    "....######",
    "...#......#",
    "..#........#",
    "..##########",
  ],
};

export default icon;
