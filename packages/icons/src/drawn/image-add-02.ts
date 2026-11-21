import type { PixelIcon } from "../types";

// Picture whose sun is replaced by a plus, to add an image.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "image-add-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#.....o..#",
    ".#....ooo.#",
    ".#.....o..#",
    ".#........#",
    ".#...#....#",
    ".#..###.#.#",
    ".#.########",
    ".##########",
  ],
};

export default icon;
