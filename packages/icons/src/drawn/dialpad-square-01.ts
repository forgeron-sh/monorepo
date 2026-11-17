import type { PixelIcon } from "../types";

// A rounded square holding a three-by-three grid of keypad dots.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "dialpad-square-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#........#",
    ".#..o.o.o.#",
    ".#........#",
    ".#..o.o.o.#",
    ".#........#",
    ".#..o.o.o.#",
    ".#........#",
    "..########",
  ],
};

export default icon;
