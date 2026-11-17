import type { PixelIcon } from "../types";

// Crop marks around a small picture: the two L frames of `crop` with a solid peak inside in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "image-crop",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#",
    "...#",
    ".########",
    "...#....#",
    "...#.oo.#",
    "...#oooo#",
    "...#....#",
    "...########",
    "........#",
    "........#",
  ],
};

export default icon;
