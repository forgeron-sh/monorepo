import type { PixelIcon } from "../types";

// Ported from the site's lab icons (`warning`), 12×12: `#` primary tone, `o` secondary tone.
const icon: PixelIcon = {
  name: "warning",
  implemented: true,
  style: "pixel",
  grid: 12,
  rows: [
    "",
    ".....##",
    "....#..#",
    "....#..#",
    "...#.oo.#",
    "...#.oo.#",
    "..#..oo..#",
    "..#......#",
    ".#...oo...#",
    ".#........#",
    "############",
  ],
};

export default icon;
