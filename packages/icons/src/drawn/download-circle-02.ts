import type { PixelIcon } from "../types";

// Download in a ring: the ring of `add-circle`, the arrow of `download-square-01` in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "download-circle-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#...oo...#",
    ".#...oo...#",
    ".#.o.oo.o.#",
    ".#.oooooo.#",
    ".#..oooo..#",
    ".#...oo...#",
    "..#......#",
    "...######",
  ],
};

export default icon;
