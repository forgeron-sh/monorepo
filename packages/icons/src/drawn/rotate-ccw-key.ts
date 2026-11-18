import type { PixelIcon } from "../types";

// Rotate a key: the key of `key-01` over an anticlockwise arrow in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "rotate-ccw-key",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..####",
    ".#....#",
    ".#....######",
    ".#....######",
    ".#....#..#.#",
    "..####...#.#",
    "",
    "..........o",
    ".o.......ooo",
    ".o........o",
    "..o......o",
    "...oooooo",
  ],
};

export default icon;
