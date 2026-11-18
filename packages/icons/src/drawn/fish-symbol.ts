import type { PixelIcon } from "../types";

// Ichthys: two arcs meeting at the nose and crossing at the tail.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "fish-symbol",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "....####",
    "..##....#",
    ".#.......#.#",
    "#.........#",
    ".#.......#.#",
    "..##....#",
    "....####",
  ],
};

export default icon;
