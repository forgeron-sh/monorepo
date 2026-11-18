import type { PixelIcon } from "../types";

// Bug: antennae, a head, a body split down the middle (secondary tone), two pairs of legs.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bug-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#......#",
    "...#....#",
    "....####",
    "...#.oo.#",
    ".###.oo.###",
    "...#.oo.#",
    "...#.oo.#",
    ".###.oo.###",
    "...#.oo.#",
    "....####",
  ],
};

export default icon;
