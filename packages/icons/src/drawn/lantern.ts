import type { PixelIcon } from "../types";

// Lantern: a ring handle, a cap and a floor overhanging the glass, a flame in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "lantern",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "....####",
    "....#..#",
    "..########",
    "...#....#",
    "...#.oo.#",
    "...#.oo.#",
    "...#....#",
    "..########",
  ],
};

export default icon;
