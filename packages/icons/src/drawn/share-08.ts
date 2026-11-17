import type { PixelIcon } from "../types";

// Share: a four-pixel origin node on the left and two square nodes on the right, joined by
// right-angle lines in the style of the git icons; symmetric top to bottom.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "share-08",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........###",
    "......###.#",
    "......#.###",
    ".####.#",
    ".#..###",
    ".#..###",
    ".####.#",
    "......#.###",
    "......###.#",
    "........###",
  ],
};

export default icon;
