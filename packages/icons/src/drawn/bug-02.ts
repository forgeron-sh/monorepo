import type { PixelIcon } from "../types";

// Beetle: antennae, a head, a round shell split down the middle in the secondary tone, a pair of legs.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bug-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#....#",
    "....####",
    "",
    "....####",
    "...#.oo.#",
    "##.#.oo.#.##",
    "..#..oo..#",
    "..#..oo..#",
    "...#.oo.#",
    "....####",
  ],
};

export default icon;
