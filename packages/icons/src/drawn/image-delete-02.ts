import type { PixelIcon } from "../types";

// Picture whose sun is replaced by a cross, to delete an image.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "image-delete-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#....o.o.#",
    ".#.....o..#",
    ".#....o.o.#",
    ".#........#",
    ".#...#....#",
    ".#..###.#.#",
    ".#.########",
    ".##########",
  ],
};

export default icon;
