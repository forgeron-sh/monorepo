import type { PixelIcon } from "../types";

// Golf ball on a tee, the tee in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "golf-ball",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "...#....#",
    "..#......#",
    "..#......#",
    "..#......#",
    "...#....#",
    "....####",
    "...oooooo",
    ".....oo",
    ".....oo",
    ".....oo",
  ],
};

export default icon;
