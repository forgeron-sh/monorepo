import type { PixelIcon } from "../types";

// Saturn: a round planet crossed by its ring in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "saturn-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "....####",
    "...#....#",
    "..#......#",
    "o.#......#.o",
    ".oooooooooo",
    "..#......#",
    "...#....#",
    "....####",
  ],
};

export default icon;
