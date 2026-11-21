import type { PixelIcon } from "../types";

// Share: a four-pixel origin node on the left and two square nodes on the right, joined by 2:1 lines; symmetric top to bottom.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "share-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........###",
    ".......##.#",
    ".....##.###",
    ".####",
    ".#..#",
    ".#..#",
    ".####",
    ".....##.###",
    ".......##.#",
    "........###",
  ],
};

export default icon;
