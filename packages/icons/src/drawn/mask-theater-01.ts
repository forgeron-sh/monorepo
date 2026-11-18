import type { PixelIcon } from "../types";

// Theatre mask: wide brow, two eye holes and a smile in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mask-theater-01",
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
    "..#.o..o.#",
    "..#..oo..#",
    "...#....#",
    "....####",
  ],
};

export default icon;
