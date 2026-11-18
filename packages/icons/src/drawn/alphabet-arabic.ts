import type { PixelIcon } from "../types";

// Arabic alphabet: the letter ain.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "alphabet-arabic",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....###",
    "....#...#",
    "....#",
    ".....####",
    "....#",
    "...#",
    "..#",
    "..#",
    "...#",
    "....######",
  ],
};

export default icon;
