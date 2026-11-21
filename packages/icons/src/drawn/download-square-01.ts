import type { PixelIcon } from "../types";

// Download in a box: the box of `checkmark-square-01`, an arrow down in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "download-square-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#...oo...#",
    ".#...oo...#",
    ".#.o.oo.o.#",
    ".#.oooooo.#",
    ".#..oooo..#",
    ".#...oo...#",
    ".#........#",
    "..########",
  ],
};

export default icon;
