import type { PixelIcon } from "../types";

// Letter T, in the secondary tone, in a rounded square; the T of text-circle.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "text-square",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#.oooooo.#",
    ".#...oo...#",
    ".#...oo...#",
    ".#...oo...#",
    ".#...oo...#",
    ".#...oo...#",
    ".#........#",
    "..########",
  ],
};

export default icon;
