import type { PixelIcon } from "../types";

// Image rotated clockwise: the picture of `image-add-01` with a clockwise arrow badge at the lower right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "image-rotation-clockwise",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".########",
    ".#......#",
    ".#...##.#",
    ".#...##.#",
    ".#",
    ".#.#....oo",
    ".####..o..o",
    ".####..o.ooo",
    ".......o..o",
    "........o",
  ],
};

export default icon;
