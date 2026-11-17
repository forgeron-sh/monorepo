import type { PixelIcon } from "../types";

// Graduation cap: a flat diamond board, the cap under it, the tassel hanging on the right in the
// secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mortarboard-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".....##",
    "...##..##",
    ".##......##",
    "...##..##.o",
    "...#.##.#.o",
    "...#....#.o",
    "...#....#.o",
    "....####..o",
  ],
};

export default icon;
