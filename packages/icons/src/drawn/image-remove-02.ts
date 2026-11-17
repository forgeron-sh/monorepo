import type { PixelIcon } from "../types";

// Picture whose sun is replaced by a minus, to remove an image.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "image-remove-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#........#",
    ".#....ooo.#",
    ".#........#",
    ".#........#",
    ".#...#....#",
    ".#..###.#.#",
    ".#.########",
    ".##########",
  ],
};

export default icon;
