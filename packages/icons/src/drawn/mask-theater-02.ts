import type { PixelIcon } from "../types";

// Tragedy mask: the mask of `mask-theater-01` with a frown in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mask-theater-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#.##..##.#",
    ".#........#",
    ".#........#",
    "..#..oo..#",
    "..#.o..o.#",
    "...#....#",
    "....####",
  ],
};

export default icon;
