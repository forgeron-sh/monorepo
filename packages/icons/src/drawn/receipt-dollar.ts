import type { PixelIcon } from "../types";

// Receipt: a sheet with a torn bottom edge and a dollar in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "receipt-dollar",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#...oo...#",
    ".#..ooooo.#",
    ".#.o.oo...#",
    ".#...oo.o.#",
    ".#.ooooo..#",
    ".#...oo...#",
    ".#.#....#.#",
    "..#.####.#",
  ],
};

export default icon;
