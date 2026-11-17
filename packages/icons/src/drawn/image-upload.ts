import type { PixelIcon } from "../types";

// Picture with an upload arrow badge, the frame of image-add-01 and the arrow of file-upload.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "image-upload",
  implemented: true,
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
    ".#.#....o",
    ".####..ooo",
    ".####.o.o.o",
    "........o",
    "........o",
  ],
};

export default icon;
