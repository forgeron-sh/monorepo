import type { PixelIcon } from "../types";

// Heart in the secondary tone inside the rounded square of `star-square`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "favourite-square",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#........#",
    ".#.oo..oo.#",
    ".#.oooooo.#",
    ".#.oooooo.#",
    ".#..oooo..#",
    ".#...oo...#",
    ".#........#",
    "..########",
  ],
};

export default icon;
