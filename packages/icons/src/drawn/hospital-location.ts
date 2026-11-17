import type { PixelIcon } from "../types";

// Hospital location: a map pin with a cross in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hospital-location",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#...oo...#",
    ".#.oooooo.#",
    ".#.oooooo.#",
    ".#...oo...#",
    "..#......#",
    "...#....#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
