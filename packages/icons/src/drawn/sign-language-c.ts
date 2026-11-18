import type { PixelIcon } from "../types";

// Sign language C: a hand curved into the letter C, the fingers over the top, the thumb under, a cuff below.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "sign-language-c",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....######",
    "...#######",
    "..##.....#",
    "..##",
    "..##",
    "..##",
    "..###...#",
    "...#####",
    "",
    "...####",
  ],
};

export default icon;
